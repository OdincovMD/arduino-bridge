#pragma once

#include "types.h"

class CommandRouter {
 public:
  CommandResult handle(const Message& message, RuntimeState& runtimeState, PersistedConfig& config);

 private:
  CommandResult makeDoneResult(const char* resultName) const;
  CommandResult makeErrorResult(ErrorCode errorCode, const char* field) const;
};
