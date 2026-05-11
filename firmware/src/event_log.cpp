#include "event_log.h"

#include <string.h>

EventLog::EventLog() : head_(0), tail_(0), count_(0) { clear(); }

bool EventLog::push(const char* message) {
  if (message == NULL) {
    return false;
  }

  strncpy(buffer_[head_], message, AppConfig::MAX_MESSAGE_LEN - 1);
  buffer_[head_][AppConfig::MAX_MESSAGE_LEN - 1] = '\0';
  head_ = (head_ + 1) % AppConfig::MAX_LOG_EVENTS;

  if (count_ == AppConfig::MAX_LOG_EVENTS) {
    tail_ = (tail_ + 1) % AppConfig::MAX_LOG_EVENTS;
  } else {
    ++count_;
  }

  return true;
}

bool EventLog::pop(char* out, size_t outSize) {
  if (!hasItems() || out == NULL || outSize == 0) {
    return false;
  }

  strncpy(out, buffer_[tail_], outSize - 1);
  out[outSize - 1] = '\0';
  buffer_[tail_][0] = '\0';
  tail_ = (tail_ + 1) % AppConfig::MAX_LOG_EVENTS;
  --count_;
  return true;
}

bool EventLog::hasItems() const { return count_ > 0; }

uint8_t EventLog::count() const { return count_; }

void EventLog::clear() {
  head_ = 0;
  tail_ = 0;
  count_ = 0;
  memset(buffer_, 0, sizeof(buffer_));
}
