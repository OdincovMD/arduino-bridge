#include "protocol.h"

#include <avr/pgmspace.h>
#include <stdio.h>
#include <stdarg.h>
#include <stdlib.h>
#include <string.h>

#include "app_config.h"

namespace {

MessageType parseType(const char* token) {
  if (strcmp_P(token, PSTR("CMD")) == 0) return MSG_CMD;
  if (strcmp_P(token, PSTR("ACK")) == 0) return MSG_ACK;
  if (strcmp_P(token, PSTR("RES")) == 0) return MSG_RES;
  if (strcmp_P(token, PSTR("ERR")) == 0) return MSG_ERR;
  if (strcmp_P(token, PSTR("STATE")) == 0) return MSG_STATE;
  if (strcmp_P(token, PSTR("EVT")) == 0) return MSG_EVT;
  if (strcmp_P(token, PSTR("PING")) == 0) return MSG_PING;
  if (strcmp_P(token, PSTR("PONG")) == 0) return MSG_PONG;
  if (strcmp_P(token, PSTR("TIME")) == 0) return MSG_TIME;
  return MSG_TYPE_UNKNOWN;
}

PGM_P manualPriorityToString(uint8_t priority) {
  switch (priority) {
    case MANUAL_PRIORITY_LOW:
      return PSTR("LOW");
    case MANUAL_PRIORITY_HIGH:
      return PSTR("HIGH");
    default:
      return PSTR("NONE");
  }
}

PGM_P modeToString(uint8_t mode) {
  switch (mode) {
    case PLANT_MODE_TIMER:
      return PSTR("TIMER");
    case PLANT_MODE_MOISTURE:
      return PSTR("MOISTURE");
    default:
      return PSTR("DISABLED");
  }
}

bool writeString(char* out, size_t outSize, PGM_P format, ...) {
  va_list args;
  va_start(args, format);
  const int written = vsnprintf_P(out, outSize, format, args);
  va_end(args);
  return written > 0 && static_cast<size_t>(written) < outSize;
}

}  // namespace

bool Protocol::parseMessage(const char* raw, Message& out) {
  if (raw == NULL || raw[0] == '\0') {
    return false;
  }

  memset(&out, 0, sizeof(out));
  char buffer[AppConfig::MAX_MESSAGE_LEN];
  strncpy(buffer, raw, sizeof(buffer) - 1);
  buffer[sizeof(buffer) - 1] = '\0';

  char* savePtr = NULL;
  char* token = strtok_r(buffer, "|", &savePtr);
  if (token == NULL) {
    return false;
  }
  out.type = parseType(token);
  if (out.type == MSG_TYPE_UNKNOWN) {
    return false;
  }

  token = strtok_r(NULL, "|", &savePtr);
  if (token == NULL) {
    return false;
  }
  strncpy(out.version, token, sizeof(out.version) - 1);

  token = strtok_r(NULL, "|", &savePtr);
  if (token == NULL) {
    return false;
  }
  out.id = static_cast<uint16_t>(atoi(token));

  token = strtok_r(NULL, "|", &savePtr);
  if (token == NULL) {
    return false;
  }
  strncpy(out.name, token, sizeof(out.name) - 1);

  while ((token = strtok_r(NULL, "|", &savePtr)) != NULL && out.argCount < AppConfig::MAX_MESSAGE_ARGS) {
    char* equal = strchr(token, '=');
    if (equal == NULL) {
      strncpy(out.args[out.argCount].key, token, sizeof(out.args[out.argCount].key) - 1);
      out.args[out.argCount].value[0] = '\0';
    } else {
      *equal = '\0';
      strncpy(out.args[out.argCount].key, token, sizeof(out.args[out.argCount].key) - 1);
      strncpy(out.args[out.argCount].value, equal + 1, sizeof(out.args[out.argCount].value) - 1);
    }
    ++out.argCount;
  }

  return true;
}

const char* Protocol::getArg(const Message& message, const char* key) {
  for (uint8_t i = 0; i < message.argCount; ++i) {
    if (strcmp(message.args[i].key, key) == 0) {
      return message.args[i].value;
    }
  }
  return NULL;
}

bool Protocol::buildAck(uint16_t id, char* out, size_t outSize) {
  return writeString(out, outSize, PSTR("ACK|%s|%u|ACCEPTED"), AppConfig::PROTOCOL_VERSION, id);
}

bool Protocol::buildResult(uint16_t id, const char* name, char* out, size_t outSize) {
  return writeString(out, outSize, PSTR("RES|%s|%u|%s"), AppConfig::PROTOCOL_VERSION, id, name != NULL ? name : "DONE");
}

bool Protocol::buildError(uint16_t id, ErrorCode errorCode, const char* field, char* out, size_t outSize) {
  if (field != NULL && field[0] != '\0') {
    return writeString(out, outSize, PSTR("ERR|%s|%u|%S|FIELD=%s"), AppConfig::PROTOCOL_VERSION, id,
                       errorCodeToString(errorCode), field);
  }
  return writeString(out, outSize, PSTR("ERR|%s|%u|%S"), AppConfig::PROTOCOL_VERSION, id,
                     errorCodeToString(errorCode));
}

bool Protocol::buildPing(const RuntimeState& state, int16_t rssi, char* out, size_t outSize) {
  return writeString(out, outSize, PSTR("PING|%s|0|UPTIME=%lu|WIFI=%u|RSSI=%d"), AppConfig::PROTOCOL_VERSION,
                     static_cast<unsigned long>(millis() / 1000UL), state.wifiConnected, rssi);
}

bool Protocol::buildPong(char* out, size_t outSize) {
  return writeString(out, outSize, PSTR("PONG|%s|0"), AppConfig::PROTOCOL_VERSION);
}

bool Protocol::buildEvent(const char* eventName, const char* extra, char* out, size_t outSize) {
  if (extra != NULL && extra[0] != '\0') {
    return writeString(out, outSize, PSTR("EVT|%s|0|%s|%s"), AppConfig::PROTOCOL_VERSION, eventName, extra);
  }
  return writeString(out, outSize, PSTR("EVT|%s|0|%s"), AppConfig::PROTOCOL_VERSION, eventName);
}

bool Protocol::buildStateLight(const RuntimeState& state, char* out, size_t outSize) {
  return writeString(out, outSize, PSTR("STATE|%s|0|LIGHT|STATE=%s|TIMER=%u|TEMPLATE=%d|MANUAL=%S"),
                     AppConfig::PROTOCOL_VERSION, state.light.currentState ? "ON" : "OFF", state.light.timerEnabled,
                     state.light.activeTemplateIndex, manualPriorityToString(state.light.manual.priority));
}

bool Protocol::buildStatePlant(const RuntimeState& state, const PersistedConfig& config, uint8_t plantIndex, char* out,
                               size_t outSize) {
  if (plantIndex >= config.plantCount) {
    return false;
  }

  return writeString(out, outSize,
                     PSTR("STATE|%s|0|PLANT|INDEX=%u|MOISTURE=%u|THRESHOLD=%u|MODE=%S|WATERING=%u"),
                     AppConfig::PROTOCOL_VERSION, plantIndex, state.plants[plantIndex].currentMoisture,
                     config.plantConfigs[plantIndex].moistureThreshold, modeToString(config.plantConfigs[plantIndex].mode),
                     state.plants[plantIndex].wateringActive);
}

bool Protocol::buildStateSystem(const RuntimeState& state, char* out, size_t outSize) {
  return writeString(out, outSize, PSTR("STATE|%s|0|SYSTEM|WIFI=%u|SERVER=%u|ERR=%u|UPTIME=%lu"),
                     AppConfig::PROTOCOL_VERSION, state.wifiConnected, state.serverReachable, state.lastError,
                     static_cast<unsigned long>(millis() / 1000UL));
}

PGM_P Protocol::errorCodeToString(ErrorCode errorCode) {
  switch (errorCode) {
    case ERROR_UNKNOWN_COMMAND:
      return PSTR("UNKNOWN_COMMAND");
    case ERROR_INVALID_ARG:
      return PSTR("INVALID_ARG");
    case ERROR_MISSING_ARG:
      return PSTR("MISSING_ARG");
    case ERROR_OUT_OF_RANGE:
      return PSTR("OUT_OF_RANGE");
    case ERROR_UNKNOWN_PLANT:
      return PSTR("UNKNOWN_PLANT");
    case ERROR_UNKNOWN_TEMPLATE:
      return PSTR("UNKNOWN_TEMPLATE");
    case ERROR_DUPLICATE_COMMAND:
      return PSTR("DUPLICATE_COMMAND");
    case ERROR_BUSY:
      return PSTR("BUSY");
    case ERROR_STORAGE:
      return PSTR("STORAGE_ERROR");
    case ERROR_TRANSPORT:
      return PSTR("TRANSPORT_ERROR");
    case ERROR_EXECUTION:
      return PSTR("EXECUTION_ERROR");
    default:
      return PSTR("ERROR");
  }
}
