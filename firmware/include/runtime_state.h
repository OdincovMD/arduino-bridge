#pragma once

#include "types.h"

void resetRuntimeState(RuntimeState& runtimeState, const PersistedConfig& config);
void markStateDirty(RuntimeState& runtimeState);
void clearStateDirty(RuntimeState& runtimeState);
void advanceEpoch(RuntimeState& runtimeState, uint32_t seconds);
