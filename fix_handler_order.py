with open("apps/antigravity-telegram-agent/main.py", "r", encoding="utf-8") as f:
    content = f.read()

# Let's split by handle_agent_chat
parts = content.split("@bot.message_handler(func=lambda message: True)\ndef handle_agent_chat(message):")

if len(parts) == 2:
    # Everything before handle_agent_chat
    before_catchall = parts[0]
    
    # The rest
    rest = parts[1]
    
    # We want to extract handle_agent_chat and place it just before `if __name__ == "__main__":`
    # Let's split the rest by the AUTOPILOT comment
    split_autopilot = rest.split("# ─── AUTOPILOT & SETTINGS ────────────────────────────────────────────────────────")
    
    if len(split_autopilot) == 2:
        catchall_code = "@bot.message_handler(func=lambda message: True)\ndef handle_agent_chat(message):" + split_autopilot[0]
        
        # The autopilot block goes from here up to __main__
        autopilot_block = split_autopilot[1]
        
        main_split = autopilot_block.split("if __name__ == \"__main__\":")
        
        autopilot_code = "# ─── AUTOPILOT & SETTINGS ────────────────────────────────────────────────────────" + main_split[0]
        
        main_code = "if __name__ == \"__main__\":" + main_split[1]
        
        new_content = before_catchall + autopilot_code + catchall_code + "\n" + main_code
        
        with open("apps/antigravity-telegram-agent/main.py", "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Success")
    else:
        print("Could not find AUTOPILOT block in the rest")
else:
    print("Could not find handle_agent_chat")
