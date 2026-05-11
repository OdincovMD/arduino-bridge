#pragma once

#include "types.h"

class EventLog {
 public:
  EventLog();

  bool push(const char* message);
  bool pop(char* out, size_t outSize);
  bool hasItems() const;
  uint8_t count() const;
  void clear();

 private:
  char buffer_[AppConfig::MAX_LOG_EVENTS][AppConfig::MAX_MESSAGE_LEN];
  uint8_t head_;
  uint8_t tail_;
  uint8_t count_;
};
