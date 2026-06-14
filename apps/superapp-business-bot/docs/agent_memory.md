# Project Agent Memory

This file contains learned lessons, bug fixes, and architectural rules discovered during development. The AI should read this to avoid repeating mistakes.

### Lesson Recorded on 2026-06-14 02:05
**Bug:** `subprocess.Popen` with `stdout=subprocess.PIPE` hangs indefinitely on Windows if the command spawns a child process (like a Node.js server via `Start-Process`) and only `proc.kill()` is called on timeout. The child process inherits the stdout pipe and keeps it open, blocking `iter(proc.stdout.readline)` forever.
**Fix:** Always use `subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)])` to kill the entire process tree on Windows before calling `proc.kill()`. This ensures no orphaned child processes keep the pipe open.
