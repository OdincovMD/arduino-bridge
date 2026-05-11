#include "transport_esp8266.h"

#include <stdio.h>
#include <string.h>

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
  char request[AppConfig::MAX_MESSAGE_LEN * 2];
  snprintf(request, sizeof(request),
           "GET %s HTTP/1.1\r\nHost: %s\r\nX-Device-Token: %s\r\nConnection: close\r\n\r\n", path, host, token);

  if (!openTcpConnection(host, port)) return false;
  if (!sendPayload(request)) return false;
  if (!readHttpResponse(responseBody, responseSize, AppConfig::HTTP_TIMEOUT_MS)) return false;
  state_ = CONNECTION_SERVER_UP;
  return true;
}

bool TransportEsp8266::httpPost(const char* host, uint16_t port, const char* path, const char* token, const char* body,
                                char* responseBody, size_t responseSize) {
  const size_t bodyLength = strlen(body);
  char request[AppConfig::MAX_MESSAGE_LEN * 2];
  snprintf(request, sizeof(request),
           "POST %s HTTP/1.1\r\nHost: %s\r\nContent-Type: text/plain\r\nX-Device-Token: %s\r\nContent-Length: %u\r\n"
           "Connection: close\r\n\r\n%s",
           path, host, token, static_cast<unsigned>(bodyLength), body);

  if (!openTcpConnection(host, port)) return false;
  if (!sendPayload(request)) return false;
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

  debugLine(buffer);
  return strstr(buffer, expected) != NULL;
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

bool TransportEsp8266::sendPayload(const char* payload) {
  char command[32];
  snprintf(command, sizeof(command), "AT+CIPSEND=%u", static_cast<unsigned>(strlen(payload)));
  if (!sendBasicCommand(command, ">", 4000)) {
    return false;
  }

  serial_.print(payload);
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

  debugLine(payload);
  stripHeaders(payload);
  strncpy(responseBody, payload, responseSize - 1);
  responseBody[responseSize - 1] = '\0';
  closeConnection();
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
