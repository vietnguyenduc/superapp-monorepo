import os
import sys
import hmac
import hashlib
import urllib.parse
import json
import logging
import threading
import subprocess
from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit

logger = logging.getLogger("ATA.SocketBridge")

# Create Flask & Flask-SocketIO instances using native 'threading' mode
app = Flask(__name__, static_folder="../webapp")
# We explicitly set async_mode='threading' to avoid pydantic / monkey patching conflicts
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Thread-safe tracker of active terminal processes per socket connection
active_processes = {}
processes_lock = threading.Lock()

def verify_telegram_init_data(init_data_str: str, token: str) -> bool:
    """
    Verifies the signature of the Telegram WebApp initData string.
    Ensures the request actually comes from Telegram and is untampered.
    """
    if not init_data_str or not token:
        return False
    
    try:
        # Parse query string
        parsed_data = dict(urllib.parse.parse_qsl(init_data_str))
        received_hash = parsed_data.pop("hash", None)
        if not received_hash:
            return False
            
        # Re-sort parameters alphabetically and join with newlines
        sorted_keys = sorted(parsed_data.keys())
        data_check_string = "\n".join(f"{key}={parsed_data[key]}" for key in sorted_keys)
        
        # Calculate WebApp secret key
        secret_key = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
        
        # Calculate the check hash
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        # Check against Telegram developer allowed ID from env
        user_info_str = parsed_data.get("user", "{}")
        user_info = json.loads(user_info_str)
        user_id = str(user_info.get("id", ""))
        
        allowed_id = os.environ.get("ALLOWED_TELEGRAM_USER_ID")
        if allowed_id and user_id != str(allowed_id):
            logger.warning(f"Unauthorized WebApp user ID attempt: {user_id}")
            return False
            
        return hmac.compare_digest(calculated_hash, received_hash)
    except Exception as e:
        logger.error(f"Error validating Telegram initData: {e}")
        return False


@socketio.on('connect')
def handle_connect(auth=None):
    """Handles socket connection and enforces strict security validation."""
    sid = sys._getframe().f_globals.get('request').sid if hasattr(sys._getframe().f_globals.get('request'), 'sid') else 'unknown'
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    init_data = auth.get("initData") if auth else None
    
    # Bypass verification ONLY if allowed user ID isn't set (e.g. localhost testing)
    allowed_id = os.environ.get("ALLOWED_TELEGRAM_USER_ID")
    
    if allowed_id and not verify_telegram_init_data(init_data, token):
        logger.warning(f"Connection rejected: Auth failed.")
        emit('auth_failed', 'Signature verification failed. Unauthorized user.')
        return False
        
    logger.info(f"Secure Client WebApp connected.")
    return True


@socketio.on('disconnect')
def handle_disconnect():
    import flask
    sid = flask.request.sid
    logger.info(f"Client WebApp disconnected: {sid}")
    
    # Terminate any active process running for this client to free resources
    with processes_lock:
        if sid in active_processes:
            try:
                active_processes[sid].terminate()
                logger.info(f"Cleaned up active process for disconnected client {sid}")
            except Exception:
                pass
            del active_processes[sid]


@socketio.on('execute_command')
def handle_execute_command(command):
    """Executes system command on the host machine and streams output via WebSocket."""
    import flask
    sid = flask.request.sid
    logger.info(f"Client {sid} requested execution: {command}")
    
    # If client already has a command running, terminate it before starting a new one
    with processes_lock:
        if sid in active_processes:
            try:
                active_processes[sid].terminate()
            except Exception:
                pass
            del active_processes[sid]
            emit('terminal_data', '\r\n\x1b[1;33m[!] Interrupted previous running command.\x1b[0m\r\n')

    def run_proc(sid_target):
        try:
            # Run command in Shell mode (PowerShell for Windows, bash for Linux)
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE,
                text=True,
                bufsize=1, # Line buffered
                encoding='utf-8',
                errors='replace'
            )
            
            with processes_lock:
                active_processes[sid_target] = process
            
            # Helper to stream output in real-time
            def read_stream(stream, color_prefix=""):
                for line in iter(stream.readline, ''):
                    # Check if connection was deleted/cancelled
                    with processes_lock:
                        if sid_target not in active_processes:
                            break
                    # Convert standard Unix newlines to CR-LF for proper xterm presentation
                    formatted_line = f"{color_prefix}{line.replace(chr(10), chr(13) + chr(10))}"
                    socketio.emit('terminal_data', formatted_line, room=sid_target)
                stream.close()

            # Read stdout and stderr in separate threads to prevent deadlocks
            t_out = threading.Thread(target=read_stream, args=(process.stdout,))
            t_err = threading.Thread(target=read_stream, args=(process.stderr, "\x1b[1;31m"))
            
            t_out.start()
            t_err.start()
            
            # Wait for execution to finish
            process.wait()
            t_out.join()
            t_err.join()

            with processes_lock:
                if sid_target in active_processes:
                    exit_code = process.returncode
                    color = "\x1b[1;32m" if exit_code == 0 else "\x1b[1;31m"
                    socketio.emit('terminal_data', f"\r\n{color}[Command finished with exit code {exit_code}]\x1b[0m\r\n", room=sid_target)
                    del active_processes[sid_target]
                
        except Exception as e:
            socketio.emit('terminal_data', f"\r\n\x1b[1;31mError running command: {str(e)}\x1b[0m\r\n", room=sid_target)

    threading.Thread(target=run_proc, args=(sid,), daemon=True).start()


@app.route("/")
def serve_index():
    """Serve the WebApp HTML page directly."""
    return send_from_directory("../webapp", "index.html")

@app.route("/<path:path>")
def serve_static(path):
    """Serve static files if any."""
    return send_from_directory("../webapp", path)


def start_server_bridge(port=8765):
    """Starts the Flask + Socket.IO server on a separate thread using Python's native threading."""
    def run():
        logger.info(f"Starting Secure Terminal WebSocket Bridge on port {port}...")
        # Start server running in threaded mode cleanly with allow_unsafe_werkzeug=True for dev simplicity
        socketio.run(app, host='0.0.0.0', port=port, log_output=False, use_reloader=False, allow_unsafe_werkzeug=True)
        
    t = threading.Thread(target=run, daemon=True)
    t.start()
    return t
