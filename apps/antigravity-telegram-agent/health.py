"""Simple HTTP health endpoint for remote monitoring."""
import os
import sys
import time
import json
import threading
import psutil
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

_start_time = time.time()
_last_message_time = 0.0
_lock = threading.Lock()


def record_message():
    global _last_message_time
    with _lock:
        _last_message_time = time.time()


class HealthHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # suppress default access logs

    def do_GET(self):
        if self.path == "/health":
            self._respond(200, self._health_payload())
        elif self.path == "/metrics":
            self._respond(200, self._metrics_payload())
        else:
            self._respond(404, {"error": "not found"})

    def _respond(self, code: int, body: dict):
        payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    @staticmethod
    def _health_payload() -> dict:
        uptime_s = time.time() - _start_time
        h, rem = divmod(int(uptime_s), 3600)
        m, s = divmod(rem, 60)
        return {
            "status": "alive",
            "uptime": f"{h}h{m:02d}m",
            "last_message": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(_last_message_time)) if _last_message_time else None,
        }

    @staticmethod
    def _metrics_payload() -> dict:
        proc = psutil.Process(os.getpid())
        return {
            "ram_mb": round(proc.memory_info().rss / (1024 * 1024), 1),
            "active_threads": threading.active_count(),
            "cpu_percent": proc.cpu_percent(interval=0.1),
            "errors_last_hour": 0,
        }


def start_health_server(port: int = 8766):
    server = HTTPServer(("0.0.0.0", port), HealthHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server
