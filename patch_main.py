import re

with open("apps/antigravity-telegram-agent/main.py", "r", encoding="utf-8") as f:
    content = f.read()

# Add global bg_scheduler_instance
content = content.replace("import core.settings as settings\n", "import core.settings as settings\n\nbg_scheduler_instance = None\n")

# At the bottom, assign bg_scheduler_instance
content = content.replace("bg_scheduler = scheduler.setup_scheduler(bot, primary_id, \"18:00\")\n", "global bg_scheduler_instance\n        bg_scheduler = scheduler.setup_scheduler(bot, primary_id, \"18:00\")\n        bg_scheduler_instance = bg_scheduler\n        apply_autopilot_schedule()\n")

with open("apps/antigravity-telegram-agent/main.py", "w", encoding="utf-8") as f:
    f.write(content)
