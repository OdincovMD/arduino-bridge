#include <Arduino.h>
#include <string.h>

#include "app_config.h"
#include "command_router.h"
#include "config_store.h"
#include "event_log.h"
#include "protocol.h"
#include "runtime_state.h"
#include "transport_esp8266.h"

namespace {

ConfigStore configStore;
PersistedConfig persistedConfig;
RuntimeState runtimeState;
EventLog eventLog;
CommandRouter commandRouter;
TransportEsp8266 transport(AppConfig::ESP_RX_PIN, AppConfig::ESP_TX_PIN, &Serial);
unsigned long lastWiFiAttemptAt = 0;

void buildDevicePath(const char* suffix, char* out, size_t outSize) {
  snprintf(out, outSize, "/api/v1/device/%s/%s", persistedConfig.deviceId, suffix);
}

bool postMessage(const char* suffix, const char* body) {
  char path[80];
  char response[AppConfig::MAX_MESSAGE_LEN];
  buildDevicePath(suffix, path, sizeof(path));
  return transport.httpPost(persistedConfig.serverHost, persistedConfig.serverPort, path, persistedConfig.deviceToken, body,
                            response, sizeof(response));
}

bool publishEvent(const char* eventName, const char* extra) {
  char message[AppConfig::MAX_MESSAGE_LEN];
  if (!Protocol::buildEvent(eventName, extra, message, sizeof(message))) {
    return false;
  }
  return postMessage("event", message);
}

void enqueueEvent(const char* eventName, const char* extra) {
  char message[AppConfig::MAX_EVENT_MESSAGE_LEN];
  if (Protocol::buildEvent(eventName, extra, message, sizeof(message))) {
    eventLog.push(message);
  }
}

bool publishStateSnapshot() {
  char message[AppConfig::MAX_MESSAGE_LEN];
  bool ok = Protocol::buildStateLight(runtimeState, message, sizeof(message)) && postMessage("state", message);
  for (uint8_t i = 0; ok && i < persistedConfig.plantCount; ++i) {
    ok = Protocol::buildStatePlant(runtimeState, persistedConfig, i, message, sizeof(message)) && postMessage("state", message);
  }
  ok = ok && Protocol::buildStateSystem(runtimeState, message, sizeof(message)) && postMessage("state", message);
  if (ok) {
    clearStateDirty(runtimeState);
  }
  return ok;
}

bool sendAck(uint16_t commandId) {
  char message[AppConfig::MAX_MESSAGE_LEN];
  if (!Protocol::buildAck(commandId, message, sizeof(message))) {
    return false;
  }
  return postMessage("ack", message);
}

bool sendCommandOutcome(uint16_t commandId, const CommandResult& result) {
  char message[AppConfig::MAX_MESSAGE_LEN];
  bool built = false;
  if (result.outcome == COMMAND_ERROR) {
    built = Protocol::buildError(commandId, result.error, result.errorField, message, sizeof(message));
  } else {
    built = Protocol::buildResult(commandId, result.resultName, message, sizeof(message));
  }
  return built && postMessage("result", message);
}

void flushEventQueue() {
  char message[AppConfig::MAX_MESSAGE_LEN];
  while (eventLog.hasItems()) {
    if (!eventLog.pop(message, sizeof(message))) {
      return;
    }
    if (!postMessage("event", message)) {
      eventLog.push(message);
      return;
    }
  }
}

void sendHeartbeat() {
  char path[80];
  char response[AppConfig::MAX_MESSAGE_LEN];
  char message[AppConfig::MAX_MESSAGE_LEN];
  buildDevicePath("heartbeat", path, sizeof(path));
  Serial.println(F("[HB]"));

  if (Protocol::buildPing(runtimeState, transport.lastRssi(), message, sizeof(message)) &&
      transport.httpPost(persistedConfig.serverHost, persistedConfig.serverPort, path, persistedConfig.deviceToken, message,
                         response, sizeof(response))) {
    runtimeState.serverReachable = 1;
    Serial.println(F("[HB_OK]"));
  } else {
    runtimeState.serverReachable = 0;
    runtimeState.lastError = ERROR_TRANSPORT;
    Serial.println(F("[HB_FAIL]"));
  }
  runtimeState.lastHeartbeatAt = millis();
}

void handleReloadConfig() {
  PersistedConfig reloaded;
  if (configStore.load(reloaded)) {
    persistedConfig = reloaded;
    resetRuntimeState(runtimeState, persistedConfig);
    markStateDirty(runtimeState);
  } else {
    runtimeState.lastError = ERROR_STORAGE;
  }
}

void pollCommands() {
  char path[80];
  char response[AppConfig::MAX_MESSAGE_LEN];
  buildDevicePath("commands", path, sizeof(path));
  Serial.println(F("[POLL]"));

  if (!transport.httpGet(persistedConfig.serverHost, persistedConfig.serverPort, path, persistedConfig.deviceToken, response,
                         sizeof(response))) {
    runtimeState.serverReachable = 0;
    runtimeState.lastError = ERROR_TRANSPORT;
    runtimeState.lastPollAt = millis();
    Serial.println(F("[POLL_FAIL]"));
    return;
  }

  runtimeState.serverReachable = 1;
  runtimeState.lastPollAt = millis();
  Serial.println(F("[POLL_OK]"));

  if (response[0] == '\0') {
    return;
  }

  Message message;
  if (!Protocol::parseMessage(response, message) || message.type != MSG_CMD) {
    runtimeState.lastError = ERROR_INVALID_ARG;
    return;
  }

  if (!sendAck(message.id)) {
    runtimeState.lastError = ERROR_TRANSPORT;
    return;
  }

  CommandResult result = commandRouter.handle(message, runtimeState, persistedConfig);
  if (result.configChanged && !configStore.save(persistedConfig)) {
    result.outcome = COMMAND_ERROR;
    result.error = ERROR_STORAGE;
    strncpy(result.errorField, "EEPROM", sizeof(result.errorField) - 1);
  }

  if (!sendCommandOutcome(message.id, result)) {
    runtimeState.lastError = ERROR_TRANSPORT;
  }

  if (result.reloadConfigRequested) {
    handleReloadConfig();
  }

  if (result.eventName[0] != '\0') {
    enqueueEvent(result.eventName, "");
  }

  if (result.snapshotRequested || result.stateChanged) {
    publishStateSnapshot();
  }
}

void tickPlaceholders() {
  for (uint8_t i = 0; i < runtimeState.plantCount; ++i) {
    if (runtimeState.plants[i].currentMoisture == 0) {
      runtimeState.plants[i].currentMoisture = 500 + i * 10;
      runtimeState.plants[i].sensorOk = 1;
    }
  }
}

}  // namespace

void setup() {
  Serial.begin(AppConfig::DEBUG_BAUD);
  delay(200);

  configStore.begin();
  if (!configStore.load(persistedConfig)) {
    configStore.setDefaults(persistedConfig);
    configStore.save(persistedConfig);
  }

  resetRuntimeState(runtimeState, persistedConfig);
  transport.begin(AppConfig::ESP_BAUD);

  if (transport.ensureWiFiConnected(persistedConfig.wifiSsid, persistedConfig.wifiPassword)) {
    runtimeState.wifiConnected = 1;
    lastWiFiAttemptAt = millis();
  }

  runtimeState.lastHeartbeatAt = millis();
  runtimeState.lastPollAt = millis();
  enqueueEvent("DEVICE_BOOT", "");
  markStateDirty(runtimeState);
}

void loop() {
  const unsigned long now = millis();
  const unsigned long serverRetryInterval =
      runtimeState.serverReachable ? AppConfig::POLL_INTERVAL_MS : AppConfig::SERVER_RETRY_INTERVAL_MS;
  const unsigned long heartbeatInterval =
      runtimeState.serverReachable ? AppConfig::HEARTBEAT_INTERVAL_MS : AppConfig::SERVER_RETRY_INTERVAL_MS;
  bool networkActivity = false;

  if (!runtimeState.wifiConnected && now - lastWiFiAttemptAt >= AppConfig::WIFI_RETRY_INTERVAL_MS) {
    lastWiFiAttemptAt = now;
    runtimeState.wifiConnected = transport.ensureWiFiConnected(persistedConfig.wifiSsid, persistedConfig.wifiPassword) ? 1 : 0;
  }

  tickPlaceholders();

  if (now - runtimeState.lastHeartbeatAt >= heartbeatInterval) {
    sendHeartbeat();
    networkActivity = true;
  }

  if (!networkActivity && now - runtimeState.lastPollAt >= serverRetryInterval) {
    pollCommands();
    networkActivity = true;
  }

  if (!networkActivity && runtimeState.serverReachable && runtimeState.stateDirty) {
    publishStateSnapshot();
    networkActivity = true;
  }

  if (!networkActivity && runtimeState.serverReachable) {
    flushEventQueue();
  }
  delay(10);
}
