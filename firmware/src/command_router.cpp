#include "command_router.h"

#include <stdlib.h>
#include <string.h>

#include "protocol.h"
#include "runtime_state.h"

namespace {

bool parseOnOff(const char* value, uint8_t& outState) {
  if (value == NULL) return false;
  if (strcmp(value, "ON") == 0 || strcmp(value, "1") == 0) {
    outState = 1;
    return true;
  }
  if (strcmp(value, "OFF") == 0 || strcmp(value, "0") == 0) {
    outState = 0;
    return true;
  }
  return false;
}

bool parsePriority(const char* value, uint8_t& outPriority) {
  if (value == NULL) return false;
  if (strcmp(value, "LOW") == 0) {
    outPriority = MANUAL_PRIORITY_LOW;
    return true;
  }
  if (strcmp(value, "HIGH") == 0) {
    outPriority = MANUAL_PRIORITY_HIGH;
    return true;
  }
  return false;
}

bool parsePlantMode(const char* value, uint8_t& outMode) {
  if (value == NULL) return false;
  if (strcmp(value, "TIMER") == 0) {
    outMode = PLANT_MODE_TIMER;
    return true;
  }
  if (strcmp(value, "MOISTURE") == 0) {
    outMode = PLANT_MODE_MOISTURE;
    return true;
  }
  if (strcmp(value, "DISABLED") == 0) {
    outMode = PLANT_MODE_DISABLED;
    return true;
  }
  return false;
}

}  // namespace

CommandResult CommandRouter::handle(const Message& message, RuntimeState& runtimeState, PersistedConfig& config) {
  if (message.id != 0 && message.id == runtimeState.lastProcessedCommandId) {
    return makeErrorResult(ERROR_DUPLICATE_COMMAND, "");
  }

  if (strcmp(message.name, "GET_SNAPSHOT") == 0) {
    CommandResult result = makeDoneResult("DONE");
    result.snapshotRequested = true;
    runtimeState.lastProcessedCommandId = message.id;
    return result;
  }

  if (strcmp(message.name, "TIME_SYNC") == 0) {
    const char* epoch = Protocol::getArg(message, "EPOCH");
    if (epoch == NULL) {
      return makeErrorResult(ERROR_MISSING_ARG, "EPOCH");
    }

    runtimeState.currentEpoch = static_cast<uint32_t>(strtoul(epoch, NULL, 10));
    runtimeState.timeSynced = 1;
    runtimeState.lastProcessedCommandId = message.id;
    return makeDoneResult("DONE");
  }

  if (strcmp(message.name, "LIGHT_TIMER_ENABLE") == 0) {
    runtimeState.light.timerEnabled = 1;
    config.lightTimerEnabled = 1;
    runtimeState.lastProcessedCommandId = message.id;
    markStateDirty(runtimeState);
    CommandResult result = makeDoneResult("DONE");
    result.stateChanged = true;
    result.configChanged = true;
    strncpy(result.eventName, "LIGHT_TIMER_ENABLED", sizeof(result.eventName) - 1);
    return result;
  }

  if (strcmp(message.name, "LIGHT_TIMER_DISABLE") == 0) {
    const char* after = Protocol::getArg(message, "AFTER");
    runtimeState.light.timerEnabled = 0;
    config.lightTimerEnabled = 0;
    if (after != NULL) {
      uint8_t newState = 0;
      if (!parseOnOff(after, newState)) {
        return makeErrorResult(ERROR_INVALID_ARG, "AFTER");
      }
      runtimeState.light.currentState = newState;
    }

    runtimeState.lastProcessedCommandId = message.id;
    markStateDirty(runtimeState);
    CommandResult result = makeDoneResult("DONE");
    result.stateChanged = true;
    result.configChanged = true;
    strncpy(result.eventName, "LIGHT_TIMER_DISABLED", sizeof(result.eventName) - 1);
    return result;
  }

  if (strcmp(message.name, "LIGHT_TEMPLATE_SELECT") == 0) {
    const char* index = Protocol::getArg(message, "INDEX");
    if (index == NULL) {
      return makeErrorResult(ERROR_MISSING_ARG, "INDEX");
    }

    const int templateIndex = atoi(index);
    if (templateIndex < 0 || templateIndex >= config.lightTemplateCount) {
      return makeErrorResult(ERROR_UNKNOWN_TEMPLATE, "INDEX");
    }

    runtimeState.light.activeTemplateIndex = templateIndex;
    config.activeLightTemplateIndex = templateIndex;
    runtimeState.lastProcessedCommandId = message.id;
    markStateDirty(runtimeState);
    CommandResult result = makeDoneResult("DONE");
    result.stateChanged = true;
    result.configChanged = true;
    strncpy(result.eventName, "LIGHT_TEMPLATE_SELECTED", sizeof(result.eventName) - 1);
    return result;
  }

  if (strcmp(message.name, "LIGHT_MANUAL") == 0) {
    const char* stateValue = Protocol::getArg(message, "STATE");
    const char* priorityValue = Protocol::getArg(message, "PRIORITY");
    uint8_t newState = 0;
    uint8_t newPriority = MANUAL_PRIORITY_NONE;

    if (!parseOnOff(stateValue, newState)) {
      return makeErrorResult(ERROR_INVALID_ARG, "STATE");
    }
    if (!parsePriority(priorityValue, newPriority)) {
      return makeErrorResult(ERROR_INVALID_ARG, "PRIORITY");
    }

    runtimeState.light.currentState = newState;
    runtimeState.light.manual.active = 1;
    runtimeState.light.manual.state = newState;
    runtimeState.light.manual.priority = newPriority;
    runtimeState.light.manual.untilEpoch = 0;

    const char* durationValue = Protocol::getArg(message, "DURATION");
    if (durationValue != NULL && durationValue[0] != '\0') {
      const uint32_t duration = static_cast<uint32_t>(strtoul(durationValue, NULL, 10));
      runtimeState.light.manual.untilEpoch = runtimeState.currentEpoch + duration;
    }

    runtimeState.lastProcessedCommandId = message.id;
    markStateDirty(runtimeState);
    CommandResult result = makeDoneResult("DONE");
    result.stateChanged = true;
    strncpy(result.eventName, "LIGHT_MANUAL_SET", sizeof(result.eventName) - 1);
    return result;
  }

  if (strcmp(message.name, "LIGHT_MANUAL_CANCEL") == 0) {
    runtimeState.light.manual.active = 0;
    runtimeState.light.manual.priority = MANUAL_PRIORITY_NONE;
    runtimeState.light.manual.untilEpoch = 0;
    runtimeState.lastProcessedCommandId = message.id;
    markStateDirty(runtimeState);
    CommandResult result = makeDoneResult("DONE");
    result.stateChanged = true;
    strncpy(result.eventName, "LIGHT_MANUAL_CANCELLED", sizeof(result.eventName) - 1);
    return result;
  }

  if (strcmp(message.name, "PLANT_MODE") == 0) {
    const char* plantValue = Protocol::getArg(message, "PLANT");
    const char* modeValue = Protocol::getArg(message, "MODE");
    if (plantValue == NULL) return makeErrorResult(ERROR_MISSING_ARG, "PLANT");
    if (modeValue == NULL) return makeErrorResult(ERROR_MISSING_ARG, "MODE");

    const int plantIndex = atoi(plantValue);
    if (plantIndex < 0 || plantIndex >= config.plantCount) {
      return makeErrorResult(ERROR_UNKNOWN_PLANT, "PLANT");
    }

    uint8_t mode = 0;
    if (!parsePlantMode(modeValue, mode)) {
      return makeErrorResult(ERROR_INVALID_ARG, "MODE");
    }

    config.plantConfigs[plantIndex].mode = mode;
    runtimeState.lastProcessedCommandId = message.id;
    markStateDirty(runtimeState);
    CommandResult result = makeDoneResult("DONE");
    result.stateChanged = true;
    result.configChanged = true;
    result.affectedPlantIndex = plantIndex;
    strncpy(result.eventName, "PLANT_MODE_CHANGED", sizeof(result.eventName) - 1);
    return result;
  }

  if (strcmp(message.name, "PLANT_THRESHOLD_SET") == 0) {
    const char* plantValue = Protocol::getArg(message, "PLANT");
    const char* thresholdValue = Protocol::getArg(message, "VALUE");
    if (plantValue == NULL) return makeErrorResult(ERROR_MISSING_ARG, "PLANT");
    if (thresholdValue == NULL) return makeErrorResult(ERROR_MISSING_ARG, "VALUE");

    const int plantIndex = atoi(plantValue);
    if (plantIndex < 0 || plantIndex >= config.plantCount) {
      return makeErrorResult(ERROR_UNKNOWN_PLANT, "PLANT");
    }

    config.plantConfigs[plantIndex].moistureThreshold = static_cast<uint16_t>(atoi(thresholdValue));
    runtimeState.lastProcessedCommandId = message.id;
    markStateDirty(runtimeState);
    CommandResult result = makeDoneResult("DONE");
    result.stateChanged = true;
    result.configChanged = true;
    result.affectedPlantIndex = plantIndex;
    strncpy(result.eventName, "PLANT_THRESHOLD_CHANGED", sizeof(result.eventName) - 1);
    return result;
  }

  if (strcmp(message.name, "WATERING_MANUAL_START") == 0 || strcmp(message.name, "WATERING_MANUAL_STOP") == 0) {
    const char* maskValue = Protocol::getArg(message, "MASK");
    if (maskValue == NULL) {
      return makeErrorResult(ERROR_MISSING_ARG, "MASK");
    }

    const uint8_t mask = static_cast<uint8_t>(atoi(maskValue));
    const uint8_t activate = strcmp(message.name, "WATERING_MANUAL_START") == 0 ? 1 : 0;

    for (uint8_t index = 0; index < runtimeState.plantCount; ++index) {
      if (mask & (1U << index)) {
        runtimeState.plants[index].wateringActive = activate;
      }
    }

    runtimeState.lastManualWateringMask = mask;
    runtimeState.lastProcessedCommandId = message.id;
    markStateDirty(runtimeState);
    CommandResult result = makeDoneResult("DONE");
    result.stateChanged = true;
    strncpy(result.eventName, activate ? "WATERING_STARTED" : "WATERING_STOPPED", sizeof(result.eventName) - 1);
    return result;
  }

  if (strcmp(message.name, "CONFIG_SAVE") == 0) {
    runtimeState.lastProcessedCommandId = message.id;
    CommandResult result = makeDoneResult("DONE");
    result.configChanged = true;
    return result;
  }

  if (strcmp(message.name, "CONFIG_LOAD") == 0) {
    runtimeState.lastProcessedCommandId = message.id;
    CommandResult result = makeDoneResult("DONE");
    result.reloadConfigRequested = true;
    result.stateChanged = true;
    return result;
  }

  if (strcmp(message.name, "DEVICE_REBOOT") == 0) {
    runtimeState.rebootRequested = 1;
    runtimeState.lastProcessedCommandId = message.id;
    return makeDoneResult("DONE");
  }

  return makeErrorResult(ERROR_UNKNOWN_COMMAND, "");
}

CommandResult CommandRouter::makeDoneResult(const char* resultName) const {
  CommandResult result;
  memset(&result, 0, sizeof(result));
  result.outcome = COMMAND_DONE;
  result.error = ERROR_NONE;
  result.affectedPlantIndex = -1;
  strncpy(result.resultName, resultName, sizeof(result.resultName) - 1);
  return result;
}

CommandResult CommandRouter::makeErrorResult(ErrorCode errorCode, const char* field) const {
  CommandResult result;
  memset(&result, 0, sizeof(result));
  result.outcome = COMMAND_ERROR;
  result.error = errorCode;
  result.affectedPlantIndex = -1;
  if (field != NULL) {
    strncpy(result.errorField, field, sizeof(result.errorField) - 1);
  }
  return result;
}
