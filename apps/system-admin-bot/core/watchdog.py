import time
import threading
import logging
import psutil
import subprocess
import os
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

logger = logging.getLogger("ATA.watchdog")

WORKSPACE_ROOT = Path("c:/Vibecoding/superapp-monorepo")

class LintFileHandler(FileSystemEventHandler):
    def __init__(self, callback):
        super().__init__()
        self.callback = callback

    def on_modified(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith(('.ts', '.tsx', '.js', '.jsx')):
            self.callback(event.src_path)

class SystemWatchdog:
    def __init__(self, bot_instance=None, admin_chat_id=None, interval_sec=600):
        self.bot = bot_instance
        self.admin_chat_id = admin_chat_id
        self.interval_sec = interval_sec
        self.is_running = False
        self._thread = None
        
        # State tracking
        self._last_memory_warn_time = 0
        self._last_git_backup_time = time.time()
        self._last_disk_clean_time = time.time()
        
        # Lint Watcher State
        self._lint_timer = None
        self._lint_changed_files = set()
        self._lint_observer = None

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()
        
        self.start_lint_watcher()
        logger.info(f"SystemWatchdog started with interval {self.interval_sec}s.")

    def stop(self):
        self.is_running = False
        if self._lint_observer:
            self._lint_observer.stop()
            self._lint_observer.join()

    def _loop(self):
        while self.is_running:
            try:
                self.scan_and_kill_zombies()
                self.check_system_resources()
                self.auto_backup_git()
                self.cleanup_disk_garbage()
            except Exception as e:
                logger.error(f"Error in watchdog loop: {e}", exc_info=True)
            
            # Sleep in chunks to allow quick shutdown
            for _ in range(self.interval_sec):
                if not self.is_running:
                    break
                time.sleep(1)

    # ---------------------------------------------------------
    # 1. ORPHAN PROCESS ZOMBIE KILLER
    # ---------------------------------------------------------
    def scan_and_kill_zombies(self):
        """Find and kill zombie Node.js processes."""
        killed_count = 0
        current_time = time.time()
        for proc in psutil.process_iter(['pid', 'name', 'create_time', 'cmdline', 'ppid']):
            try:
                name = proc.info['name']
                if not name or 'node' not in name.lower():
                    continue
                cmdline = proc.info.get('cmdline') or []
                cmd_str = " ".join(cmdline).lower()
                if not any(k in cmd_str for k in ['vite', 'next', 'nuxt', 'react-scripts', 'dev', 'server']):
                    continue
                
                uptime = current_time - proc.info['create_time']
                if uptime > 3600:
                    proc.kill()
                    killed_count += 1
                    continue
                
                try:
                    parent = psutil.Process(proc.info['ppid'])
                    if not parent.is_running():
                         proc.kill()
                         killed_count += 1
                         continue
                except (psutil.NoSuchProcess, psutil.ZombieProcess):
                    proc.kill()
                    killed_count += 1
                    continue
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
        
        if killed_count > 0 and self.bot and self.admin_chat_id:
            try:
                self.bot.send_message(
                    self.admin_chat_id,
                    f"🧹 **SystemWatchdog**: Vừa tự động tiêu diệt `{killed_count}` zombie Node.js process.",
                    parse_mode="Markdown"
                )
            except Exception:
                pass

    def check_system_resources(self):
        mem = psutil.virtual_memory()
        if mem.percent > 90:
            current_time = time.time()
            if current_time - self._last_memory_warn_time > 3600:
                self._last_memory_warn_time = current_time
                if self.bot and self.admin_chat_id:
                    try:
                        self.bot.send_message(
                            self.admin_chat_id,
                            f"🚨 **CẢNH BÁO RAM**: `{mem.percent}%`\nSếp hãy dùng lệnh `/killnode` hoặc `/killbot`!",
                            parse_mode="Markdown"
                        )
                    except Exception:
                        pass

    # ---------------------------------------------------------
    # 2. AUTO BACKUP GIT DAEMON
    # ---------------------------------------------------------
    def auto_backup_git(self):
        """Runs every 24 hours to backup changes to 'viet' branch."""
        current_time = time.time()
        if current_time - self._last_git_backup_time < 86400:
            return
        
        self._last_git_backup_time = current_time
        try:
            result = subprocess.run(["git", "status", "--porcelain"], cwd=WORKSPACE_ROOT, capture_output=True, text=True)
            if not result.stdout.strip():
                return
            
            # Switch to backup branch safely
            cmd_checkout = "git checkout viet || git checkout -b viet"
            subprocess.run(["powershell", "-Command", cmd_checkout], cwd=WORKSPACE_ROOT, capture_output=True)
            
            # Commit and push
            subprocess.run(["git", "add", "."], cwd=WORKSPACE_ROOT, capture_output=True)
            commit_msg = f"Auto-backup: {time.strftime('%Y-%m-%d %H:%M:%S')}"
            subprocess.run(["git", "commit", "-m", commit_msg], cwd=WORKSPACE_ROOT, capture_output=True)
            subprocess.run(["git", "push", "-u", "origin", "viet"], cwd=WORKSPACE_ROOT, capture_output=True)
            
            logger.info("Git auto-backup completed on branch 'viet'.")
        except Exception as e:
            logger.error(f"Git auto-backup failed: {e}")

    # ---------------------------------------------------------
    # 3. DISK GARBAGE CLEANER
    # ---------------------------------------------------------
    def cleanup_disk_garbage(self):
        """Runs every 24 hours to clean old logs and caches."""
        current_time = time.time()
        if current_time - self._last_disk_clean_time < 86400:
            return
        
        self._last_disk_clean_time = current_time
        deleted_count = 0
        try:
            for filepath in WORKSPACE_ROOT.rglob("*.*"):
                if "node_modules" in filepath.parts: continue
                if filepath.suffix not in ['.log', '.png']: continue
                
                # Check for log files or playwright screenshots
                if filepath.suffix == '.log' or "test-results" in filepath.parts or "playwright-report" in filepath.parts:
                    if filepath.is_file():
                        age_days = (current_time - filepath.stat().st_mtime) / 86400
                        if age_days > 7:
                            filepath.unlink()
                            deleted_count += 1
                            
            if deleted_count > 0:
                logger.info(f"Disk cleanup removed {deleted_count} old files.")
        except Exception as e:
            logger.error(f"Disk cleanup failed: {e}")

    # ---------------------------------------------------------
    # 4. REAL-TIME LINT WATCHER
    # ---------------------------------------------------------
    def start_lint_watcher(self):
        try:
            handler = LintFileHandler(self._on_file_changed)
            self._lint_observer = Observer()
            apps_dir = str(WORKSPACE_ROOT / "apps")
            self._lint_observer.schedule(handler, apps_dir, recursive=True)
            self._lint_observer.start()
        except Exception as e:
            logger.error(f"Failed to start lint watcher: {e}")

    def _on_file_changed(self, file_path):
        """Debounce handler for linting."""
        file_path_str = str(file_path).replace('\\', '/')
        if "node_modules" in file_path_str or ".next" in file_path_str or "dist" in file_path_str:
            return
            
        self._lint_changed_files.add(file_path_str)
        
        if self._lint_timer:
            self._lint_timer.cancel()
            
        # Start a 60-second debounce timer (Option 2)
        self._lint_timer = threading.Timer(60.0, self._run_lint)
        self._lint_timer.start()

    def _run_lint(self):
        if not self._lint_changed_files:
            return
            
        files_to_lint = list(self._lint_changed_files)
        self._lint_changed_files.clear()
        
        try:
            logger.info(f"Running ESLint on {len(files_to_lint)} files...")
            
            chunk_size = 30
            chunks = [files_to_lint[i:i + chunk_size] for i in range(0, len(files_to_lint), chunk_size)]
            
            all_errors = ""
            has_error = False
            
            for chunk in chunks:
                files_str = " ".join([f"'{f}'" for f in chunk])
                cmd = f"npx eslint {files_str}"
                
                result = subprocess.run(
                    ["powershell", "-NoProfile", "-Command", cmd],
                    cwd=WORKSPACE_ROOT,
                    capture_output=True, text=True
                )
                
                if result.returncode != 0:
                    error_summary = result.stdout
                    if not error_summary:
                        error_summary = result.stderr
                    
                    if "couldn't find an eslint.config" in error_summary or "No ESLint configuration found" in error_summary:
                        continue
                        
                    has_error = True
                    all_errors += error_summary + "\n"
            
            if has_error and self.bot and self.admin_chat_id:
                final_error = all_errors[:3000]
                self.bot.send_message(
                    self.admin_chat_id,
                    f"⚠️ **Lint Watcher Alert**\n"
                    f"Phát hiện lỗi cú pháp sau khi sếp nghỉ tay (60s delay):\n"
                    f"```text\n{final_error}\n```",
                    parse_mode="Markdown"
                )
            elif not has_error:
                logger.info("Lint Watcher passed successfully.")
        except Exception as e:
            logger.error(f"Lint Watcher failed: {e}")
