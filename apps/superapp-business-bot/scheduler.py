import os
import psutil
import logging
import subprocess
from datetime import datetime
from pathlib import Path
from apscheduler.schedulers.background import BackgroundScheduler
import tools

logger = logging.getLogger(__name__)

def get_system_telemetry() -> str:
    """Gathers CPU, memory, disk, and run metrics."""
    try:
        cpu_usage = psutil.cpu_percent(interval=0.5)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        telemetry = (
            f"🖥️ **System Health Report**:\n"
            f"- CPU Usage: {cpu_usage}%\n"
            f"- RAM Usage: {memory.percent}% ({memory.used // (1024**2)} MB / {memory.total // (1024**2)} MB)\n"
            f"- Disk Free: {disk.free // (1024**3)} GB / {disk.total // (1024**3)} GB\n"
        )
        return telemetry
    except Exception as e:
        return f"Error gathering telemetry: {e}"

def get_monorepo_status() -> str:
    """Gathers status of the git monorepo workspace."""
    try:
        # Check git changes
        git_status = subprocess.run(
            ["git", "status", "-s"],
            cwd=str(tools.MONOREPO_ROOT),
            text=True,
            capture_output=True,
            timeout=10
        ).stdout.strip()
        
        # Check recent commits from today
        git_log = subprocess.run(
            ["git", "log", "--since=1.day.ago", "--oneline"],
            cwd=str(tools.MONOREPO_ROOT),
            text=True,
            capture_output=True,
            timeout=10
        ).stdout.strip()
        
        status_report = "📦 **Monorepo Workspace Status**:\n"
        
        if git_status:
            status_report += "⚠️ **Uncommitted Changes**:\n```\n" + git_status + "\n```\n"
        else:
            status_report += "✅ Working directory is clean.\n"
            
        if git_log:
            status_report += "🔄 **Commits (Past 24 Hours)**:\n" + git_log + "\n"
        else:
            status_report += "ℹ️ No commits in the past 24 hours.\n"
            
        return status_report
    except Exception as e:
        return f"Error gathering monorepo status: {e}"

def compile_daily_report() -> str:
    """Aggregates system telemetry and monorepo changes into a single beautiful daily report."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    report = (
        f"📅 **ANTIGRAVITY AUTONOMOUS DAILY REPORT**\n"
        f"Timestamp: {now_str}\n"
        f"----------------------------------------\n\n"
    )
    report += get_system_telemetry() + "\n"
    report += get_monorepo_status() + "\n"
    report += "🤖 Antigravity runs 24/7 in background. Send commands at any time to interact."
    return report

def setup_scheduler(bot, chat_id, report_time_str: str = "21:00") -> BackgroundScheduler:
    """Sets up standard background tasks, e.g. daily compiled report to Telegram."""
    scheduler = BackgroundScheduler()
    
    # Parse report time HH:MM
    try:
        hour, minute = map(int, report_time_str.split(":"))
    except ValueError:
        hour, minute = 21, 0 # Default to 9:00 PM
        
    def send_daily_report_job():
        logger.info("Executing scheduled daily report job...")
        try:
            report_msg = compile_daily_report()
            bot.send_message(chat_id, report_msg, parse_mode="Markdown")
        except Exception as e:
            logger.error(f"Error sending scheduled report: {e}")

    # Add cron daily job
    scheduler.add_job(
        send_daily_report_job,
        'cron',
        hour=hour,
        minute=minute,
        id='daily_report_job'
    )
    
    scheduler.start()
    logger.info(f"Daily report job scheduled for {report_time_str} everyday.")
    return scheduler
