/*
 * ============================================================
 *  ESP32 Smart Automation System
 *  - PIR-based light/fan control with inactivity timeout
 *  - DHT11 temperature-gated fan control
 *  - ACS712 current sensing with multi-sample averaging
 *  - Continuous energy (Wh) accumulation via millis()
 *  - Cloud sync: Node.js server + Google Apps Script
 * ============================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// ======================= CONFIGURATION =======================

// ---- WiFi credentials ----
const char* ssid       = "SDIP";
const char* password   = "vatsal2309";

// ---- Server endpoints ----
const char* nodeServer = "http://192.168.66.66:5000/data";
const char* googleURL  = "https://script.google.com/macros/s/AKfycby7AkGKCS41SH6m-TM-ZKie3r3uiKXeVc9ZqYSOt3nkxTLv3ipuiARXytX9GyJF6QOI/exec";

// ---- Hardware pins ----
#define DHTPIN       4        // DHT11 data pin
#define PIRPIN       5        // PIR motion sensor
// #define FAN_RELAY    13       // Relay controlling the fan
#define LIGHT_RELAY  13       // Relay controlling the light
#define CURRENT_PIN  34       // ACS712 analog output (ADC1 channel)

// ---- Sensor config ----
#define DHTTYPE      DHT11

// ---- Relay logic (active-HIGH module) ----
//   LOW  = relay energised = appliance ON
//   HIGH = relay released  = appliance OFF
#define RELAY_ON     LOW
#define RELAY_OFF    HIGH

// ---- Tunables ----
const unsigned long MOTION_TIMEOUT_MS   = 15000;   // 15 s inactivity before turning OFF
const float         TEMP_THRESHOLD      = 30.0;    // °C – fan turns on above this
const float         MAINS_VOLTAGE       = 230.0;   // V (AC mains)
const int           ACS712_SAMPLES      = 100;     // Number of ADC samples to average
const float         ACS712_OFFSET_V     = 1.65;    // Zero-current voltage on ESP32 3.3 V rail
const float         ACS712_SENSITIVITY  = 0.185;   // V/A for ACS712-5A module
const unsigned long LOOP_INTERVAL_MS    = 500;     // Main loop pace (non-blocking)
const unsigned long SEND_INTERVAL_MS    = 5000;    // Cloud push interval

// ======================= GLOBALS ============================

DHT dht(DHTPIN, DHTTYPE);

// Motion tracking
bool          motionActive    = false;   // true while occupancy is assumed
unsigned long lastMotionTime  = 0;       // millis() of last HIGH from PIR

// Energy accumulation
float         energyWh        = 0.0;
unsigned long lastEnergyCalc  = 0;

// Cloud send timer
unsigned long lastSendTime    = 0;

// Cached sensor values (updated every loop, sent every SEND_INTERVAL)
float cachedTemp    = 0.0;
int   cachedHum     = 0;
float cachedCurrent = 0.0;
float cachedPower   = 0.0;

// ======================= SENSOR FUNCTIONS ====================

/*
 * readCurrentACS712()
 * Takes ACS712_SAMPLES ADC readings, averages them,
 * converts to current (A) using calibrated offset & sensitivity.
 * Returns absolute value (magnitude only).
 */
float readCurrentACS712() {
  long adcSum = 0;

  for (int i = 0; i < ACS712_SAMPLES; i++) {
    adcSum += analogRead(CURRENT_PIN);
    delayMicroseconds(200);           // small spacing between samples (~20 ms total)
  }

  float adcAvg  = (float)adcSum / ACS712_SAMPLES;
  float voltage = (adcAvg / 4095.0) * 3.3;

  // Current = (Vmeasured – Vzero) / sensitivity
  float current = (voltage - ACS712_OFFSET_V) / ACS712_SENSITIVITY;

  // Clamp near-zero noise to 0
  if (abs(current) < 0.05) current = 0.0;

  return abs(current);
}

// ======================= WIFI FUNCTIONS ======================

/*
 * ensureWiFi()
 * If WiFi is disconnected, attempt a reconnect and log status.
 * Non-blocking – returns immediately if still disconnected.
 */
void ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("[WiFi] Connection lost – attempting reconnect...");
  WiFi.disconnect();
  WiFi.begin(ssid, password);

  // Wait up to 5 s for reconnection (10 × 500 ms)
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 5000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Reconnected ✓");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Reconnect failed – will retry next cycle");
  }
}

// ======================= HTTP FUNCTIONS ======================

/*
 * buildJSON()
 * Constructs the JSON payload string used by both endpoints.
 */
String buildJSON(float temp, int hum, bool motion, float current, float power, float energy) {
  String json = "{";
  json += "\"temperature\":" + String(temp, 2) + ",";
  json += "\"humidity\":"    + String(hum) + ",";
  json += "\"motion\":"      + String(motion ? "true" : "false") + ",";
  json += "\"current\":"     + String(current, 3) + ",";
  json += "\"power\":"       + String(power, 2) + ",";
  json += "\"energy\":"      + String(energy, 4);
  json += "}";
  return json;
}

/*
 * sendHTTP()
 * Reusable HTTP POST function.
 *   url           – endpoint
 *   payload       – JSON body
 *   label         – label for Serial log (e.g. "Node" or "Google")
 *   followRedirect – true for Google Apps Script (302 redirect)
 */
void sendHTTP(const char* url, const String& payload, const char* label, bool followRedirect) {
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);   // 10 s timeout

  if (followRedirect) {
    http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  }

  int code = http.POST(payload);

  if (code > 0) {
    Serial.printf("[HTTP] %s → %d\n", label, code);
  } else {
    Serial.printf("[HTTP] %s FAILED → %s\n", label, http.errorToString(code).c_str());
  }

  http.end();
}

/*
 * sendDataToCloud()
 * Pushes the latest sensor data to both Node.js and Google endpoints.
 */
void sendDataToCloud(float temp, int hum, bool motion, float current, float power, float energy) {
  String payload = buildJSON(temp, hum, motion, current, power, energy);

  sendHTTP(nodeServer, payload, "Node.js", false);
  sendHTTP(googleURL,  payload, "Google",  true);
}

// ======================= CONTROL LOGIC =======================

/*
 * updateMotionState()
 * Reads PIR sensor. If HIGH → refresh timer.
 * If no motion for MOTION_TIMEOUT_MS → mark inactive.
 */
void updateMotionState() {
  bool pirReading = digitalRead(PIRPIN);

  if (pirReading) {
    // Motion detected – refresh the timer
    lastMotionTime = millis();
    if (!motionActive) {
      Serial.println("[PIR] Motion detected → devices ON");
    }
    motionActive = true;
  } else {
    // No motion right now – check if timeout has elapsed
    if (motionActive && (millis() - lastMotionTime >= MOTION_TIMEOUT_MS)) {
      motionActive = false;
      Serial.println("[PIR] Timeout elapsed → devices OFF");
    }
  }
}

/*
 * controlRelays()
 * Light: ON while motionActive
 * Fan:   ON while motionActive AND temperature >= threshold
 */
void controlRelays(float temperature) {
  // ---- LIGHT ----
  // Active-LOW relay: RELAY_ON (LOW) = light ON
  if (motionActive) {
    digitalWrite(LIGHT_RELAY, RELAY_ON);    // LOW = ON
  } else {
    digitalWrite(LIGHT_RELAY, RELAY_OFF);   // HIGH = OFF
  }

  // ---- FAN ----
  // Fan only runs when someone is present AND it's hot enough
  // if (motionActive && temperature >= TEMP_THRESHOLD) {
  //   digitalWrite(FAN_RELAY, RELAY_ON);      // LOW = ON
  // } else {
  //   digitalWrite(FAN_RELAY, RELAY_OFF);     // HIGH = OFF
  // }
}

// ======================= DEBUG OUTPUT ========================

void printDebug(float temp, int hum, float current, float power) {
  Serial.println("========== SENSOR DATA ==========");
  Serial.printf("  Temperature : %.1f °C\n", temp);
  Serial.printf("  Humidity    : %d %%\n", hum);
  Serial.printf("  Motion      : %s\n", motionActive ? "YES (active)" : "NO");
  Serial.printf("  Current     : %.3f A\n", current);
  Serial.printf("  Power       : %.2f W\n", power);
  Serial.printf("  Energy      : %.4f Wh\n", energyWh);
  // Serial.printf("  Fan         : %s\n", digitalRead(FAN_RELAY) == RELAY_ON ? "ON" : "OFF");
  Serial.printf("  Light       : %s\n", digitalRead(LIGHT_RELAY) == RELAY_ON ? "ON" : "OFF");
  Serial.println("=================================");
}

// ========================= SETUP =============================

void setup() {
  Serial.begin(115200);
  Serial.println("\n[BOOT] ESP32 Smart Automation System");

  // ---- Pin modes ----
  pinMode(PIRPIN, INPUT);
  // pinMode(FAN_RELAY, OUTPUT);
  pinMode(LIGHT_RELAY, OUTPUT);

  // Start with both relays OFF (HIGH = OFF for active-LOW modules)
  // digitalWrite(FAN_RELAY, RELAY_OFF);
  digitalWrite(LIGHT_RELAY, RELAY_OFF);

  // ---- DHT sensor ----
  dht.begin();

  // ---- WiFi initial connection ----
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("[WiFi] Connecting");

  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected ✓");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Initial connection failed – will retry in loop");
  }

  // ---- Initialise timers ----
  lastEnergyCalc = millis();
  lastSendTime   = millis();
  lastMotionTime = 0;

  Serial.println("[BOOT] Setup complete\n");
}

// ========================= LOOP ==============================

void loop() {
  // ---- 1. Read sensors ----
  float temperature = dht.readTemperature();
  int   humidity    = (int)dht.readHumidity();

  // Guard against NaN from DHT read failures
  if (isnan(temperature)) temperature = 0.0;
  if (isnan((float)humidity)) humidity = 0;

  // ---- 2. Update PIR / motion state (with timeout logic) ----
  updateMotionState();

  // ---- 3. Control relays based on motion + temperature ----
  controlRelays(temperature);

  // ---- 4. Read current & compute power ----
  float current = readCurrentACS712();
  float power   = MAINS_VOLTAGE * current;

  // ---- 5. Accumulate energy (Wh) using elapsed time ----
  unsigned long now   = millis();
  float         hours = (now - lastEnergyCalc) / 3600000.0;
  lastEnergyCalc = now;
  energyWh += power * hours;

  // Cache for sending
  cachedTemp    = temperature;
  cachedHum     = humidity;
  cachedCurrent = current;
  cachedPower   = power;

  // ---- 6. Print debug info every loop ----
  printDebug(temperature, humidity, current, power);

  // ---- 7. Send to cloud at SEND_INTERVAL ----
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    ensureWiFi();   // auto-reconnect if needed

    if (WiFi.status() == WL_CONNECTED) {
      sendDataToCloud(cachedTemp, cachedHum, motionActive, cachedCurrent, cachedPower, energyWh);
    } else {
      Serial.println("[HTTP] Skipped – WiFi not connected");
    }
  }

  // ---- 8. Non-blocking loop pacing ----
  delay(LOOP_INTERVAL_MS);   // 500 ms – keeps loop responsive while avoiding busy-spin
}
