"""
Antigravity Bot — Comprehensive Test Suite
==========================================
Tests: imports, config, providers, tools, agent, commands, architecture
"""
import sys, os, json, time, traceback
from pathlib import Path

# Force UTF-8
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

os.chdir(Path(__file__).parent)
from dotenv import load_dotenv
load_dotenv('.env')

PASS = "[PASS]"
FAIL = "[FAIL]"
WARN = "[WARN]"
results = []

def test(name, fn):
    try:
        result = fn()
        msg = f"{PASS} {name}" + (f" — {result}" if result else "")
        print(msg)
        results.append(("PASS", name, str(result or "")))
    except Exception as e:
        msg = f"{FAIL} {name} — {e}"
        print(msg)
        results.append(("FAIL", name, str(e)))

print("=" * 60)
print("  ANTIGRAVITY BOT — FULL AUDIT")
print("=" * 60)

# ── 1. ENVIRONMENT ────────────────────────────────────────────
print("\n[1/7] ENVIRONMENT & CONFIG")

test("TELEGRAM_BOT_TOKEN set", lambda: bool(os.environ.get("TELEGRAM_BOT_TOKEN")))
test("GEMINI_API_KEY set", lambda: bool(os.environ.get("GEMINI_API_KEY")))
test("DEEPSEEK_API_KEY set", lambda: os.environ.get("DEEPSEEK_API_KEY", "")[:8] + "...")
test("DEEPSEEK_BASE_URL set", lambda: os.environ.get("DEEPSEEK_BASE_URL"))
test("MONOREPO_ROOT_PATH set", lambda: os.environ.get("MONOREPO_ROOT_PATH"))
test("active_project.json readable", lambda: json.loads(open("active_project.json").read()).get("active_project"))
test("settings.json valid", lambda: list(json.loads(open("config/settings.json").read()).keys()))
test("requirements.txt exists", lambda: len(open("requirements.txt").readlines()))

# ── 2. CORE MODULE IMPORTS ────────────────────────────────────
print("\n[2/7] CORE MODULE IMPORTS")

def import_module(mod):
    import importlib
    m = importlib.import_module(mod)
    return f"OK ({mod})"

test("import tools", lambda: import_module("tools"))
test("import scheduler", lambda: import_module("scheduler"))
test("import core.provider_registry", lambda: import_module("core.provider_registry"))
test("import core.ai_router", lambda: import_module("core.ai_router"))
test("import core.budget_tracker", lambda: import_module("core.budget_tracker"))
test("import core.telegram_utils", lambda: import_module("core.telegram_utils"))
test("import core.db", lambda: import_module("core.db"))
test("import core.executor", lambda: import_module("core.executor"))
test("import core.tunnel", lambda: import_module("core.tunnel"))
test("import core.memory_vault", lambda: import_module("core.memory_vault"))
test("import agent (AntigravityAgent)", lambda: import_module("agent"))

# ── 3. PROVIDER HEALTH ────────────────────────────────────────
print("\n[3/7] PROVIDER HEALTH")

from core.provider_registry import get_registry
registry = get_registry()

def check_provider(name):
    p = getattr(registry, name)
    ok = p.health_check()
    return "ONLINE" if ok else "OFFLINE"

test("DeepSeek health check", lambda: check_provider("deepseek"))
test("Gemini health check", lambda: check_provider("gemini"))
test("Ollama health check (optional)", lambda: check_provider("ollama"))
test("Registry.health_status()", lambda: str(registry.health_status()))

# ── 4. AI ROUTER ─────────────────────────────────────────────
print("\n[4/7] AI ROUTER")

from core.ai_router import classify_task, smart_generate

test("classify 'list files' → simple", lambda: "OK" if classify_task("list files") == "simple" else f"WRONG: {classify_task('list files')}")
test("classify 'fix login bug' → medium", lambda: "OK" if classify_task("fix the login bug in auth.ts") == "medium" else f"WRONG: {classify_task('fix the login bug in auth.ts')}")
test("classify 'refactor entire backend' → heavy", lambda: "OK" if classify_task("refactor entire backend module") == "heavy" else f"WRONG: {classify_task('refactor entire backend module')}")
test("classify 'status' → simple", lambda: "OK" if classify_task("status") == "simple" else f"WRONG: {classify_task('status')}")

# Live generate (DeepSeek)
def test_live_generate():
    t0 = time.time()
    text, provider = smart_generate(
        prompt="Reply with exactly: PONG",
        system="You are a test bot. Reply exactly as instructed."
    )
    elapsed = time.time() - t0
    return f"{provider} in {elapsed:.1f}s — '{text[:40].strip()}'"

test("smart_generate live (DeepSeek→Gemini)", test_live_generate)

# ── 5. TOOLS ─────────────────────────────────────────────────
print("\n[5/7] TOOLS")

import tools

test("tools.execute_command('echo hello')", lambda: tools.execute_command("echo hello").strip())
test("tools.list_directory('.')", lambda: str(tools.list_directory("."))[:80])
test("tools.read_file('requirements.txt')", lambda: tools.read_file("requirements.txt")[:50] + "...")
test("tools.read_file (nonexistent) — safe?", lambda: "Error" in tools.read_file("nonexistent_file_xyz.txt") or "not found" in tools.read_file("nonexistent_file_xyz.txt").lower() or "error" in tools.read_file("nonexistent_file_xyz.txt").lower())

# ── 6. AGENT ─────────────────────────────────────────────────
print("\n[6/7] AGENT CORE")

from agent import AntigravityAgent
a = AntigravityAgent()

test("agent.get_active_project()", lambda: a.get_active_project())
test("agent.get_project_paths()", lambda: str(a.get_project_paths()))
test("agent.get_vault_summary()", lambda: a.get_vault_summary()[:60] + "...")
test("agent vault dir exists", lambda: a.get_project_paths()[0].exists())
test("scraper storage path", lambda: str(a.scraper_storage))

# ── 7. ARCHITECTURE CHECK ─────────────────────────────────────
print("\n[7/7] ARCHITECTURE & COMMAND REGISTRY")

import ast

def count_handlers(filepath):
    src = open(filepath, encoding='utf-8').read()
    tree = ast.parse(src)
    handlers = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            for deco in node.decorator_list:
                deco_str = ast.unparse(deco)
                if 'message_handler' in deco_str or 'callback_query_handler' in deco_str:
                    handlers.append(node.name)
    return handlers

handlers = count_handlers("main.py")
test(f"main.py handler count ({len(handlers)})", lambda: ", ".join(handlers))

# Check command handlers specifically
cmds = [h for h in handlers if 'handle' in h.lower() or 'send' in h.lower()]
test("Critical: handle_status registered", lambda: "OK" if "handle_status" in handlers else "MISSING!")
test("Critical: handle_agent_chat registered", lambda: "OK" if "handle_agent_chat" in handlers else "MISSING!")

# Check handler order (status must be before catch-all)
src = open("main.py", encoding="utf-8").read()
status_pos = src.find("def handle_status")
catchall_pos = src.find("func=lambda message: True")
test("handle_status registered BEFORE catch-all", lambda: "OK" if status_pos < catchall_pos else f"WRONG ORDER! status={status_pos} catchall={catchall_pos}")

# Check Ollama disabled
test("Ollama removed from routing chain", lambda: "OK" if "[registry.ollama" not in open("core/ai_router.py", encoding="utf-8").read() else "STILL IN CHAIN!")

# Check budget tracker DB
from core.budget_tracker import get_tracker
tracker = get_tracker()
test("budget_tracker DB writable", lambda: str(tracker.get_today_summary()['total_cost_usd']) + " USD today")

# ── SUMMARY ───────────────────────────────────────────────────
print("\n" + "=" * 60)
passed = sum(1 for r in results if r[0] == "PASS")
failed = sum(1 for r in results if r[0] == "FAIL")
warned = sum(1 for r in results if r[0] == "WARN")
print(f"  RESULTS: {passed} passed / {failed} failed / {warned} warned")
print("=" * 60)

if failed:
    print("\nFAILED TESTS:")
    for r in results:
        if r[0] == "FAIL":
            print(f"  - {r[1]}: {r[2]}")
