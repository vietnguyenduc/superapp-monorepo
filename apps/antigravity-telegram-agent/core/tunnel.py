import os
import requests
import logging
import subprocess
from pathlib import Path

logger = logging.getLogger("ATA.tunnel")

def get_ngrok_url() -> str:
    """
    Checks if local ngrok is running and retrieves its active public URL.
    Attempts to connect to standard ngrok client API at http://127.0.0.1:4040/api/tunnels.
    """
    try:
        res = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=2)
        if res.status_code == 200:
            tunnels = res.json().get("tunnels", [])
            for tunnel in tunnels:
                if tunnel.get("proto") in ["http", "https"]:
                    return tunnel.get("public_url", "")
    except Exception:
        pass
    
    # Try importing pyngrok dynamically to start a tunnel
    authtoken = os.environ.get("NGROK_AUTHTOKEN")
    try:
        from pyngrok import ngrok
        if authtoken and authtoken.strip():
            ngrok.set_auth_token(authtoken)
        tunnels = ngrok.get_tunnels()
        if tunnels:
            return tunnels[0].public_url
        # Start default tunnel on openclaw port
        tunnel = ngrok.connect(18789)
        return tunnel.public_url
    except Exception as e:
        logger.warning(f"Failed to start pyngrok tunnel: {e}")
            
    return "No active Ngrok tunnel detected. Run `ngrok http <port>` locally."

def disconnect_all_tunnels():
    """Disconnects and terminates all active Ngrok tunnels."""
    logger.info("Disconnecting all active Ngrok tunnels...")
    try:
        from pyngrok import ngrok
        ngrok.kill()
    except Exception as e:
        logger.warning(f"Failed to kill pyngrok instance: {e}")
        
    try:
        # OS level fallback to kill ngrok.exe
        subprocess.run(["taskkill", "/f", "/im", "ngrok.exe"], capture_output=True)
    except Exception:
        pass

def start_tunnel_for_port(port: int) -> str:
    """Starts a new Ngrok tunnel on a specific application port."""
    logger.info(f"Establishing new Ngrok tunnel for port: {port}")
    authtoken = os.environ.get("NGROK_AUTHTOKEN")
    
    try:
        from pyngrok import ngrok
        if authtoken and authtoken.strip():
            ngrok.set_auth_token(authtoken)
            
        tunnel = ngrok.connect(port)
        return tunnel.public_url
    except Exception as e:
        logger.error(f"Failed to spin up new Ngrok tunnel on port {port}: {e}")
        return f"Failed to start Ngrok tunnel on port {port}. Please run 'ngrok config add-authtoken <token>' in your system terminal or add NGROK_AUTHTOKEN to your .env file. Error details: {str(e)}"

def get_tailscale_status() -> str:
    """Retrieves Tailscale CLI status if active."""
    try:
        result = subprocess.run(
            ["tailscale", "status"],
            text=True,
            capture_output=True,
            timeout=5
        )
        if result.returncode == 0:
            lines = result.stdout.strip().splitlines()
            if lines:
                return f"Tailscale is active. Personal device info:\n{lines[0]}"
    except Exception:
        pass
    return "Tailscale is not running or not found in system PATH."

def is_port_active(port: int) -> bool:
    """Checks if a local port is active (LISTENING)."""
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex(("127.0.0.1", port)) == 0
    except Exception:
        return False

def get_active_tunnel_for_port(port: int) -> str:
    """
    Checks if there is an active local ngrok tunnel mapping to localhost:<port>.
    Returns the public URL if found, else None.
    """
    try:
        res = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=1.5)
        if res.status_code == 200:
            tunnels = res.json().get("tunnels", [])
            for t in tunnels:
                addr = t.get("config", {}).get("addr", "")
                if f":{port}" in addr or addr == str(port):
                    return t.get("public_url", "")
    except Exception:
        pass
    return None
