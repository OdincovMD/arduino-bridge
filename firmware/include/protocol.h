#pragma once

#include "types.h"

class Protocol {
 public:
  static bool parseMessage(const char* raw, Message& out);
  static const char* getArg(const Message& message, const char* key);

  static bool buildAck(uint16_t id, char* out, size_t outSize);
  static bool buildResult(uint16_t id, const char* name, char* out, size_t outSize);
  static bool buildError(uint16_t id, ErrorCode errorCode, const char* field, char* out, size_t outSize);
  static bool buildPing(const RuntimeState& state, int16_t rssi, char* out, size_t outSize);
  static bool buildPong(char* out, size_t outSize);
  static bool buildEvent(const char* eventName, const char* extra, char* out, size_t outSize);
  static bool buildStateLight(const RuntimeState& state, char* out, size_t outSize);
  static bool buildStatePlant(const RuntimeState& state, const PersistedConfig& config, uint8_t plantIndex, char* out,
                              size_t outSize);
  static bool buildStateSystem(const RuntimeState& state, char* out, size_t outSize);
  static const char* errorCodeToString(ErrorCode errorCode);
};
