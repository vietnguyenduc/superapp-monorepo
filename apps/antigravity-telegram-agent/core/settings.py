import json
import os

SETTINGS_FILE = "settings.json"

DEFAULT_SETTINGS = {
    "autopilot_enabled": False,
    "autopilot_interval_hours": 6
}

def load_settings():
    if not os.path.exists(SETTINGS_FILE):
        return DEFAULT_SETTINGS.copy()
    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            settings = json.load(f)
            # Merge with defaults to ensure all keys exist
            for k, v in DEFAULT_SETTINGS.items():
                if k not in settings:
                    settings[k] = v
            return settings
    except Exception:
        return DEFAULT_SETTINGS.copy()

def save_settings(settings):
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=4)
    except Exception as e:
        print(f"Failed to save settings: {e}")
