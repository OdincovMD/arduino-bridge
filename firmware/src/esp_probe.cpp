#include <Arduino.h>
#include <SoftwareSerial.h>

namespace {

constexpr uint8_t kEspRxPin = 10;
constexpr uint8_t kEspTxPin = 11;
constexpr long kUsbBaud = 115200;
constexpr long kProbeBauds[] = {74880, 9600, 19200, 38400, 57600, 115200};
constexpr char kSsid[] = "Blackhooool";
constexpr char kPassword[] = "Netperesdachee";

SoftwareSerial espSerial(kEspRxPin, kEspTxPin);

void flushEspInput() {
  while (espSerial.available()) {
    espSerial.read();
  }
}

bool waitForResponse(unsigned long timeoutMs) {
  const unsigned long startedAt = millis();
  bool sawData = false;

  while (millis() - startedAt < timeoutMs) {
    while (espSerial.available()) {
      const char c = static_cast<char>(espSerial.read());
      Serial.write(c);
      sawData = true;
    }
  }

  if (!sawData) {
    Serial.println(F("<no response>"));
  } else {
    Serial.println();
  }
  return sawData;
}

bool sendCommand(const __FlashStringHelper* label, const char* command, unsigned long timeoutMs) {
  Serial.print(F(">> "));
  Serial.println(label);
  flushEspInput();
  espSerial.print(command);
  espSerial.print("\r\n");
  return waitForResponse(timeoutMs);
}

bool tryProbeAtBaud(long baud) {
  espSerial.begin(baud);
  delay(200);

  Serial.println();
  Serial.print(F("=== Probing ESP at "));
  Serial.print(baud);
  Serial.println(F(" baud ==="));

  if (!sendCommand(F("AT"), "AT", 1500)) {
    return false;
  }

  sendCommand(F("ATE0"), "ATE0", 1500);
  sendCommand(F("AT+CWMODE=1"), "AT+CWMODE=1", 1500);
  sendCommand(F("AT+CWJAP?"), "AT+CWJAP?", 2500);

  char joinCommand[96];
  snprintf(joinCommand, sizeof(joinCommand), "AT+CWJAP=\"%s\",\"%s\"", kSsid, kPassword);
  sendCommand(F("AT+CWJAP"), joinCommand, 20000);
  sendCommand(F("AT+CWJAP?"), "AT+CWJAP?", 2500);
  sendCommand(F("AT+CIFSR"), "AT+CIFSR", 2500);
  return true;
}

void captureBootLogAtBaud(long baud) {
  espSerial.begin(baud);
  delay(50);

  Serial.println();
  Serial.print(F("=== Listening for boot log at "));
  Serial.print(baud);
  Serial.println(F(" baud ==="));
  waitForResponse(1200);
}

}  // namespace

void setup() {
  Serial.begin(kUsbBaud);
  delay(1500);
  Serial.println();
  Serial.println(F("ESP probe starting"));
  Serial.println(F("Expected wiring: Arduino D10 <- ESP TX, Arduino D11 -> ESP RX"));

  captureBootLogAtBaud(74880);

  bool gotResponse = false;
  for (long baud : kProbeBauds) {
    if (tryProbeAtBaud(baud)) {
      gotResponse = true;
      break;
    }
  }

  if (!gotResponse) {
    Serial.println();
    Serial.println(F("ESP did not answer on 9600 or 115200."));
    Serial.println(F("Check 3.3V power, common GND, RX/TX, and level shifting on ESP RX."));
  } else {
    Serial.println(F("Probe finished."));
  }
}

void loop() {
  while (espSerial.available()) {
    Serial.write(static_cast<char>(espSerial.read()));
  }

  while (Serial.available()) {
    espSerial.write(static_cast<char>(Serial.read()));
  }
}
