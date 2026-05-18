#include "config_store.h"

#include <EEPROM.h>
#include <stddef.h>
#include <string.h>

#include "app_config.h"

bool ConfigStore::begin() { return sizeof(PersistedConfig) <= EEPROM.length(); }

bool ConfigStore::load(PersistedConfig& config) {
  EEPROM.get(0, config);
  if (config.magic != AppConfig::CONFIG_MAGIC) {
    return false;
  }
  if (config.schemaVersion != AppConfig::CONFIG_SCHEMA_VERSION) {
    return false;
  }

  const uint16_t savedCrc = config.crc;
  config.crc = 0;
  const uint16_t computedCrc = computeCrc(config);
  config.crc = savedCrc;

  return savedCrc == computedCrc;
}

bool ConfigStore::save(const PersistedConfig& source) {
  PersistedConfig config = source;
  config.magic = AppConfig::CONFIG_MAGIC;
  config.schemaVersion = AppConfig::CONFIG_SCHEMA_VERSION;
  config.crc = 0;
  config.crc = computeCrc(config);

  if (sizeof(PersistedConfig) > EEPROM.length()) {
    return false;
  }

  EEPROM.put(0, config);
  return true;
}

void ConfigStore::setDefaults(PersistedConfig& config) {
  memset(&config, 0, sizeof(config));
  config.magic = AppConfig::CONFIG_MAGIC;
  config.schemaVersion = AppConfig::CONFIG_SCHEMA_VERSION;
  strncpy(config.deviceId, "greenhouse-01", sizeof(config.deviceId) - 1);
  strncpy(config.deviceToken, "CHANGEME123456", sizeof(config.deviceToken) - 1);
  strncpy(config.wifiSsid, "Blackhooool", sizeof(config.wifiSsid) - 1);
  strncpy(config.wifiPassword, "Netperesdachee", sizeof(config.wifiPassword) - 1);
  strncpy(config.serverHost, "192.168.3.6", sizeof(config.serverHost) - 1);
  config.serverPort = 8080;
  config.lightTimerEnabled = 1;
  config.activeLightTemplateIndex = 0;
  config.lightTemplateCount = 1;

  config.plantCount = 2;
  config.plantConfigs[0].mode = PLANT_MODE_MOISTURE;
  config.plantConfigs[0].moistureThreshold = 450;
  config.plantConfigs[1].mode = PLANT_MODE_TIMER;
  config.plantConfigs[1].moistureThreshold = 550;
}

uint16_t ConfigStore::computeCrc(const PersistedConfig& config) const {
  const uint8_t* bytes = reinterpret_cast<const uint8_t*>(&config);
  uint16_t crc = 0xFFFF;

  for (size_t i = 0; i < sizeof(PersistedConfig); ++i) {
    crc ^= bytes[i];
    for (uint8_t bit = 0; bit < 8; ++bit) {
      if (crc & 1U) {
        crc = (crc >> 1U) ^ 0xA001U;
      } else {
        crc >>= 1U;
      }
    }
  }

  return crc;
}
