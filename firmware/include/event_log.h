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
  // Uno cannot afford a multi-kilobyte event ring buffer, so keep only
  // the latest unsent event.
  char buffer_[AppConfig::MAX_EVENT_MESSAGE_LEN];
  uint8_t hasItem_;
};
