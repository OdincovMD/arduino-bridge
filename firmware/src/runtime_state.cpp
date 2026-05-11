#include "runtime_state.h"

#include <string.h>

void resetRuntimeState(RuntimeState& runtimeState, const PersistedConfig& config) {
  memset(&runtimeState, 0, sizeof(runtimeState));
  runtimeState.plantCount = config.plantCount;
  runtimeState.light.timerEnabled = config.lightTimerEnabled;
  runtimeState.light.activeTemplateIndex = config.activeLightTemplateIndex;
  runtimeState.light.currentState = 0;
  runtimeState.light.manual.active = 0;
  runtimeState.light.manual.priority = MANUAL_PRIORITY_NONE;
  runtimeState.lastError = ERROR_NONE;
}

void markStateDirty(RuntimeState& runtimeState) { runtimeState.stateDirty = 1; }

void clearStateDirty(RuntimeState& runtimeState) { runtimeState.stateDirty = 0; }

void advanceEpoch(RuntimeState& runtimeState, uint32_t seconds) {
  runtimeState.currentEpoch += seconds;
  runtimeState.timeSynced = 1;
}
