#pragma once

#include "types.h"

class ConfigStore {
 public:
  bool begin();
  bool load(PersistedConfig& config);
  bool save(const PersistedConfig& config);
  void setDefaults(PersistedConfig& config);

 private:
  uint16_t computeCrc(const PersistedConfig& config) const;
};
