#pragma once

#include <Arduino.h>

namespace AppConfig {
static const char PROTOCOL_VERSION[] = "v1";

static const uint8_t ESP_RX_PIN = 10;
static const uint8_t ESP_TX_PIN = 11;

static const long DEBUG_BAUD = 115200;
static const long ESP_BAUD = 9600;

static const unsigned long POLL_INTERVAL_MS = 5000UL;
static const unsigned long HEARTBEAT_INTERVAL_MS = 30000UL;
static const unsigned long WIFI_RETRY_INTERVAL_MS = 10000UL;
static const unsigned long COMMAND_GRACE_PERIOD_MS = 250UL;
static const unsigned long HTTP_TIMEOUT_MS = 5000UL;

static const uint8_t HTTP_RETRY_COUNT = 3;

static const uint8_t MAX_PLANTS = 8;
static const uint8_t MAX_LIGHT_TEMPLATES = 4;
static const uint8_t MAX_LIGHT_INTERVALS = 8;
static const uint8_t MAX_LOG_EVENTS = 16;
static const uint8_t MAX_MESSAGE_ARGS = 8;

static const uint8_t MAX_DEVICE_ID_LEN = 16;
static const uint8_t MAX_SSID_LEN = 32;
static const uint8_t MAX_PASSWORD_LEN = 32;
static const uint8_t MAX_HOST_LEN = 32;
static const uint8_t MAX_TOKEN_LEN = 24;
static const uint8_t MAX_TEMPLATE_NAME_LEN = 12;
static const uint8_t MAX_PLANT_NAME_LEN = 12;
static const uint8_t MAX_MESSAGE_LEN = 192;
static const uint8_t MAX_NAME_LEN = 24;
static const uint8_t MAX_ARG_KEY_LEN = 16;
static const uint8_t MAX_ARG_VALUE_LEN = 24;

static const uint16_t CONFIG_MAGIC = 0xB10D;
static const uint16_t CONFIG_SCHEMA_VERSION = 1;
}  // namespace AppConfig
