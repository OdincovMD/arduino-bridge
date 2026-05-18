#pragma once

#include <Arduino.h>
#include "app_config.h"

enum MessageType : uint8_t {
  MSG_TYPE_UNKNOWN = 0,
  MSG_CMD,
  MSG_ACK,
  MSG_RES,
  MSG_ERR,
  MSG_STATE,
  MSG_EVT,
  MSG_PING,
  MSG_PONG,
  MSG_TIME
};

enum ErrorCode : uint8_t {
  ERROR_NONE = 0,
  ERROR_UNKNOWN_COMMAND,
  ERROR_INVALID_ARG,
  ERROR_MISSING_ARG,
  ERROR_OUT_OF_RANGE,
  ERROR_UNKNOWN_PLANT,
  ERROR_UNKNOWN_TEMPLATE,
  ERROR_DUPLICATE_COMMAND,
  ERROR_BUSY,
  ERROR_STORAGE,
  ERROR_TRANSPORT,
  ERROR_EXECUTION
};

enum PlantMode : uint8_t {
  PLANT_MODE_TIMER = 0,
  PLANT_MODE_MOISTURE = 1,
  PLANT_MODE_DISABLED = 2
};

enum ManualPriority : uint8_t {
  MANUAL_PRIORITY_NONE = 0,
  MANUAL_PRIORITY_LOW = 1,
  MANUAL_PRIORITY_HIGH = 2
};

enum CommandOutcome : uint8_t {
  COMMAND_DONE = 0,
  COMMAND_UNCHANGED = 1,
  COMMAND_ERROR = 2
};

enum ConnectionState : uint8_t {
  CONNECTION_DOWN = 0,
  CONNECTION_WIFI_UP = 1,
  CONNECTION_SERVER_UP = 2
};

struct KeyValuePair {
  char key[AppConfig::MAX_ARG_KEY_LEN];
  char value[AppConfig::MAX_ARG_VALUE_LEN];
};

struct Message {
  MessageType type;
  char version[4];
  uint16_t id;
  char name[AppConfig::MAX_NAME_LEN];
  uint8_t argCount;
  KeyValuePair args[AppConfig::MAX_MESSAGE_ARGS];
};

struct LightInterval {
  uint16_t startMinute;
  uint16_t endMinute;
  uint8_t lightOn;
} __attribute__((packed));

struct LightTemplate {
  char name[AppConfig::MAX_TEMPLATE_NAME_LEN];
  uint8_t intervalCount;
  LightInterval intervals[AppConfig::MAX_LIGHT_INTERVALS];
} __attribute__((packed));

struct ManualLightMode {
  uint8_t active;
  uint8_t state;
  uint8_t priority;
  uint32_t untilEpoch;
} __attribute__((packed));

struct LightState {
  uint8_t currentState;
  uint8_t timerEnabled;
  int8_t activeTemplateIndex;
  ManualLightMode manual;
} __attribute__((packed));

struct PlantConfig {
  uint8_t mode;
  uint16_t moistureThreshold;
} __attribute__((packed));

struct PlantRuntime {
  uint16_t currentMoisture;
  uint8_t wateringActive;
  uint8_t sensorOk;
} __attribute__((packed));

struct PersistedConfig {
  uint16_t magic;
  uint16_t schemaVersion;
  uint16_t crc;
  char deviceId[AppConfig::MAX_DEVICE_ID_LEN];
  char deviceToken[AppConfig::MAX_TOKEN_LEN];
  char wifiSsid[AppConfig::MAX_SSID_LEN];
  char wifiPassword[AppConfig::MAX_PASSWORD_LEN];
  char serverHost[AppConfig::MAX_HOST_LEN];
  uint16_t serverPort;
  uint8_t lightTimerEnabled;
  int8_t activeLightTemplateIndex;
  uint8_t lightTemplateCount;
  PlantConfig plantConfigs[AppConfig::MAX_PLANTS];
  uint8_t plantCount;
} __attribute__((packed));

struct RuntimeState {
  LightState light;
  PlantRuntime plants[AppConfig::MAX_PLANTS];
  uint8_t plantCount;
  uint8_t wifiConnected;
  uint8_t serverReachable;
  uint8_t timeSynced;
  uint8_t stateDirty;
  uint8_t rebootRequested;
  ErrorCode lastError;
  uint32_t currentEpoch;
  uint32_t lastHeartbeatAt;
  uint32_t lastPollAt;
  uint16_t lastProcessedCommandId;
  uint8_t lastManualWateringMask;
} __attribute__((packed));

struct CommandResult {
  CommandOutcome outcome;
  ErrorCode error;
  bool stateChanged;
  bool configChanged;
  bool snapshotRequested;
  bool reloadConfigRequested;
  int8_t affectedPlantIndex;
  char resultName[12];
  char errorField[AppConfig::MAX_ARG_VALUE_LEN];
  char eventName[AppConfig::MAX_NAME_LEN];
};
