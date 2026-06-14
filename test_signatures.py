import sys
import os

# Add the apps directory so imports work
sys.path.insert(0, os.path.abspath('apps/antigravity-telegram-agent'))

try:
    from apps.antigravity_telegram_agent.tool_scripts.browser import run_visual_audit
    from apps.antigravity_telegram_agent.tools import record_lesson

    print("Testing record_lesson...")
    res1 = record_lesson(lesson="Testing the signature fix.")
    print("record_lesson result:", res1)
    
    print("\nTesting run_visual_audit signature...")
    # Just testing signature and early exit
    res2 = run_visual_audit(url="", delay=100)
    print("run_visual_audit result:", res2)

    print("\nALL SIGNATURES VALID!")
except Exception as e:
    print(f"FAILED: {e}")
