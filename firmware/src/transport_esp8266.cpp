#include "transport_esp8266.h"

#include <stdio.h>
#include <string.h>

namespace {

size_t digitCount(size_t value) {
  size_t digits = 1;
  while (value >= 10) {
    value /= 10;
    ++digits;
  }
  return digits;
}

size_t getRequestLength(const char* host, const char* path, const char* token) {
  return (sizeof("GET ") - 1) + strlen(path) + (sizeof(" HTTP/1.1\r\nHost: ") - 1) + strlen(host) +
         (sizeof("\r\nX-Device-Token: ") - 1) + strlen(token) + (sizeof("\r\nConnection: close\r\n\r\n") - 1);
}

size_t postRequestLength(const char* host, const char* path, const char* token, size_t bodyLength) {
  return (sizeof("POST ") - 1) + strlen(path) + (sizeof(" HTTP/1.1\r\nHost: ") - 1) + strlen(host) +
         (sizeof("\r\nContent-Type: text/plain\r\nX-Device-Token: ") - 1) + strlen(token) +
         (sizeof("\r\nContent-Length: ") - 1) + digitCount(bodyLength) + (sizeof("\r\nConnection: close\r\n\r\n") - 1) +
         bodyLength;
}

}  // namespace

TransportEsp8266::TransportEsp8266(uint8_t rxPin, uint8_t txPin, Stream* debugStream)
    : serial_(rxPin, txPin), debug_(debugStream), state_(CONNECTION_DOWN), lastRssi_(0) {}

void TransportEsp8266::begin(long baudRate) {
  serial_.begin(baudRate);
  delay(100);
  clearInput();
  sendBasicCommand("AT", "OK", 1000);
  sendBasicCommand("ATE0", "OK", 1000);
  sendBasicCommand("AT+CWMODE=1", "OK", 1000);
}

bool TransportEsp8266::ensureWiFiConnected(const char* ssid, const char* password) {
  if (!sendBasicCommand("AT", "OK", 1000)) {
    state_ = CONNECTION_DOWN;
    return false;
  }

  if (sendBasicCommand("AT+CWJAP?", "+CWJAP:", 2000)) {
    state_ = CONNECTION_WIFI_UP;
    sendBasicCommand("AT+CIPMUX=0", "OK", 1000);
    return true;
  }

  char command[120];
  snprintf(command, sizeof(command), "AT+CWJAP=\"%s\",\"%s\"", ssid, password);
  if (!sendBasicCommand(command, "WIFI GOT IP", 15000) && !sendBasicCommand(command, "OK", 15000)) {
    state_ = CONNECTION_DOWN;
    return false;
  }

  state_ = CONNECTION_WIFI_UP;
  sendBasicCommand("AT+CIPMUX=0", "OK", 1000);
  return true;
}

bool TransportEsp8266::httpGet(const char* host, uint16_t port, const char* path, const char* token, char* responseBody,
                               size_t responseSize) {
  if (!openTcpConnection(host, port)) return false;
  if (!startSend(getRequestLength(host, path, token))) return false;

  serial_.print(F("GET "));
  serial_.print(path);
  serial_.print(F(" HTTP/1.1\r\nHost: "));
  serial_.print(host);
  serial_.print(F("\r\nX-Device-Token: "));
  serial_.print(token);
  serial_.print(F("\r\nConnection: close\r\n\r\n"));

  if (!finishSend()) return false;
  if (!readHttpResponse(responseBody, responseSize, AppConfig::HTTP_TIMEOUT_MS)) return false;
  state_ = CONNECTION_SERVER_UP;
  return true;
}

bool TransportEsp8266::httpPost(const char* host, uint16_t port, const char* path, const char* token, const char* body,
                                char* responseBody, size_t responseSize) {
  const size_t bodyLength = strlen(body);
  if (!openTcpConnection(host, port)) return false;
  if (!startSend(postRequestLength(host, path, token, bodyLength))) return false;

  serial_.print(F("POST "));
  serial_.print(path);
  serial_.print(F(" HTTP/1.1\r\nHost: "));
  serial_.print(host);
  serial_.print(F("\r\nContent-Type: text/plain\r\nX-Device-Token: "));
  serial_.print(token);
  serial_.print(F("\r\nContent-Length: "));
  serial_.print(static_cast<unsigned>(bodyLength));
  serial_.print(F("\r\nConnection: close\r\n\r\n"));
  serial_.print(body);

  if (!finishSend()) return false;
  if (!readHttpResponse(responseBody, responseSize, AppConfig::HTTP_TIMEOUT_MS)) return false;
  state_ = CONNECTION_SERVER_UP;
  return true;
}

ConnectionState TransportEsp8266::connectionState() const { return state_; }

int16_t TransportEsp8266::lastRssi() const { return lastRssi_; }

bool TransportEsp8266::sendBasicCommand(const char* command, const char* expected, unsigned long timeoutMs) {
  clearInput();
  if (!writeWithNewline(command)) {
    return false;
  }

  const unsigned long startedAt = millis();
  char buffer[AppConfig::MAX_MESSAGE_LEN];
  size_t length = 0;
  memset(buffer, 0, sizeof(buffer));

  while (millis() - startedAt < timeoutMs) {
    while (serial_.available()) {
      const char c = static_cast<char>(serial_.read());
      if (length + 1 < sizeof(buffer)) {
        buffer[length++] = c;
        buffer[length] = '\0';
      }
      if (strstr(buffer, expected) != NULL || strstr(buffer, "ERROR") != NULL) {
        debugLine(buffer);
        return strstr(buffer, expected) != NULL;
      }
    }
  }

  const bool ok = strstr(buffer, expected) != NULL;
  if (!ok && debug_ != NULL) {
    debug_->print(F("[AT_FAIL] "));
    debug_->print(command);
    if (buffer[0] != '\0') {
      debug_->print(F(" => "));
      debug_->println(buffer);
    } else {
      debug_->println(F(" => <timeout>"));
    }
  } else {
    debugLine(buffer);
  }
  return ok;
}

bool TransportEsp8266::openTcpConnection(const char* host, uint16_t port) {
  char command[80];
  snprintf(command, sizeof(command), "AT+CIPSTART=\"TCP\",\"%s\",%u", host, port);
  if (!sendBasicCommand(command, "CONNECT", 8000) && !sendBasicCommand(command, "OK", 8000)) {
    state_ = CONNECTION_WIFI_UP;
    return false;
  }
  return true;
}

bool TransportEsp8266::startSend(size_t payloadLength) {
  char command[32];
  snprintf(command, sizeof(command), "AT+CIPSEND=%u", static_cast<unsigned>(payloadLength));
  return sendBasicCommand(command, ">", 4000);
}

bool TransportEsp8266::finishSend() {
  const unsigned long startedAt = millis();
  char buffer[AppConfig::MAX_MESSAGE_LEN];
  size_t length = 0;
  memset(buffer, 0, sizeof(buffer));

  while (millis() - startedAt < AppConfig::HTTP_TIMEOUT_MS) {
    while (serial_.available()) {
      const char c = static_cast<char>(serial_.read());
      if (length + 1 < sizeof(buffer)) {
        buffer[length++] = c;
        buffer[length] = '\0';
      }
      if (strstr(buffer, "SEND OK") != NULL || strstr(buffer, "ERROR") != NULL) {
        debugLine(buffer);
        return strstr(buffer, "SEND OK") != NULL;
      }
    }
  }

  debugLine(buffer);
  return false;
}

bool TransportEsp8266::readHttpResponse(char* responseBody, size_t responseSize, unsigned long timeoutMs) {
  if (responseBody == NULL || responseSize == 0) {
    return false;
  }

  const unsigned long startedAt = millis();
  char payload[AppConfig::MAX_MESSAGE_LEN * 2];
  size_t length = 0;
  memset(payload, 0, sizeof(payload));

  while (millis() - startedAt < timeoutMs) {
    while (serial_.available()) {
      const char c = static_cast<char>(serial_.read());
      if (length + 1 < sizeof(payload)) {
        payload[length++] = c;
        payload[length] = '\0';
      }
    }
  }

  stripHeaders(payload);
  strncpy(responseBody, payload, responseSize - 1);
  responseBody[responseSize - 1] = '\0';
  closeConnection();
  delay(AppConfig::COMMAND_GRACE_PERIOD_MS);
  clearInput();
  return true;
}

bool TransportEsp8266::closeConnection() { return sendBasicCommand("AT+CIPCLOSE", "OK", 2000); }

void TransportEsp8266::clearInput() {
  while (serial_.available()) {
    serial_.read();
  }
}

bool TransportEsp8266::writeWithNewline(const char* line) {
  serial_.print(line);
  serial_.print("\r\n");
  return true;
}

void TransportEsp8266::debugLine(const char* line) {
  if (debug_ != NULL && line != NULL && line[0] != '\0') {
    debug_->println(line);
  }
}

bool TransportEsp8266::containsOk(const char* buffer) const { return strstr(buffer, "OK") != NULL; }

void TransportEsp8266::stripHeaders(char* payload) const {
  char* bodyStart = strstr(payload, "\r\n\r\n");
  if (bodyStart == NULL) {
    return;
  }
  bodyStart += 4;
  memmove(payload, bodyStart, strlen(bodyStart) + 1);
}
