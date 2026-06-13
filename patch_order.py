with open("apps/antigravity-telegram-agent/main.py", "r", encoding="utf-8") as f:
    content = f.read()

parts = content.split('if __name__ == "__main__":')

if len(parts) == 2:
    before_main = parts[0]
    main_and_after = parts[1]
    
    split_autopilot = main_and_after.split("# ─── AUTOPILOT & SETTINGS ────────────────────────────────────────────────────────")
    if len(split_autopilot) == 2:
        main_block = split_autopilot[0]
        autopilot_code = "# ─── AUTOPILOT & SETTINGS ────────────────────────────────────────────────────────\n" + split_autopilot[1]
        
        new_content = before_main + autopilot_code + "\n\nif __name__ == \"__main__\":\n" + main_block
        
        with open("apps/antigravity-telegram-agent/main.py", "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Success")
    else:
        print("Could not find autopilot block")
else:
    print("Could not find main block")
