import os

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "iot-energy-secret-key-2024")
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "energy.db")
TOKEN_EXPIRY_HOURS = 24

GOOGLE_SHEETS_API_KEY = os.environ.get("GOOGLE_SHEETS_API_KEY", "")
SPREADSHEET_ID = os.environ.get("SPREADSHEET_ID", "")
SHEET_RANGE = os.environ.get("SHEET_RANGE", "Sheet1!A:D")

# Sensor thresholds for alerts
THRESHOLDS = {
    "temperature_high": 75.0,   # °C
    "power_high": 4500.0,       # W
    "current_high": 20.0,       # A
    "voltage_low": 210.0,       # V
    "voltage_high": 250.0,      # V
}

# Real OTP Service Configurations
SMTP_SERVER = os.environ.get("SMTP_SERVER", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_FROM = os.environ.get("SMTP_FROM", "noreply@energyiq.com")

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "")
