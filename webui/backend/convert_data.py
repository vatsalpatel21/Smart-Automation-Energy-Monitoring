import csv
import random
from datetime import datetime

input_file = "household_power_consumption.csv"
output_file = "demo_energy_data.csv"

new_data = []

with open(input_file, "r") as file:
    reader = csv.DictReader(file)

    for row in reader:
        try:
            # Create timestamp
            timestamp = row["Date"] + " " + row["Time"]

            # Simulate temperature (based on power)
            power = float(row["Global_active_power"]) if row["Global_active_power"] != "?" else 0
            temperature = round(20 + power * 2 + random.uniform(-2, 2), 2)

            # Simulate humidity
            humidity = round(40 + random.uniform(-5, 5), 2)

            # Simulate motion
            motion = random.choice([0, 1])

            # Automation logic
            light = "ON" if motion == 1 else "OFF"
            fan = "ON" if temperature >= 30 and motion == 1 else "OFF"

            new_data.append({
                "Temperature": temperature,
                "Humidity": humidity,
                "Motion": motion,
                "Fan": fan,
                "Light": light,
                "Timestamp": timestamp
            })

        except:
            continue

# Save new CSV
with open(output_file, "w", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=new_data[0].keys())
    writer.writeheader()
    writer.writerows(new_data)

print("✅ Converted dataset saved as demo_energy_data.csv")