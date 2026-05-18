#pragma once

#include <Arduino.h>
#include <SoftwareSerial.h>

#include "app_config.h"
#include "types.h"

class TransportEsp8266 {
 public:
  TransportEsp8266(uint8_t rxPin, uint8_t txPin, Stream* debugStream);

  void begin(long baudRate);
  bool ensureWiFiConnected(const char* ssid, const char* password);
  bool httpGet(const char* host, uint16_t port, const char* path, const char* token, char* responseBody,
               size_t responseSize);
  bool httpPost(const char* host, uint16_t port, const char* path, const char* token, const char* body,
                char* responseBody, size_t responseSize);
  ConnectionState connectionState() const;
  int16_t lastRssi() const;

 private:
  bool sendBasicCommand(const char* command, const char* expected, unsigned long timeoutMs);
  bool openTcpConnection(const char* host, uint16_t port);
  bool startSend(size_t payloadLength);
  bool finishSend();
  bool readHttpResponse(char* responseBody, size_t responseSize, unsigned long timeoutMs);
  bool closeConnection();
  void clearInput();
  bool writeWithNewline(const char* line);
  void debugLine(const char* line);
  bool containsOk(const char* buffer) const;
  void stripHeaders(char* payload) const;

  SoftwareSerial serial_;
  Stream* debug_;
  ConnectionState state_;
  int16_t lastRssi_;
};
