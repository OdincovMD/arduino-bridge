#include "event_log.h"

#include <string.h>

EventLog::EventLog() : hasItem_(0) { clear(); }

bool EventLog::push(const char* message) {
  if (message == NULL) {
    return false;
  }

  strncpy(buffer_, message, AppConfig::MAX_EVENT_MESSAGE_LEN - 1);
  buffer_[AppConfig::MAX_EVENT_MESSAGE_LEN - 1] = '\0';
  hasItem_ = 1;
  return true;
}

bool EventLog::pop(char* out, size_t outSize) {
  if (!hasItems() || out == NULL || outSize == 0) {
    return false;
  }

  strncpy(out, buffer_, outSize - 1);
  out[outSize - 1] = '\0';
  buffer_[0] = '\0';
  hasItem_ = 0;
  return true;
}

bool EventLog::hasItems() const { return hasItem_ != 0; }

uint8_t EventLog::count() const { return hasItem_ != 0 ? 1 : 0; }

void EventLog::clear() {
  hasItem_ = 0;
  memset(buffer_, 0, sizeof(buffer_));
}
