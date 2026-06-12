import urllib.request
import json
import socket

def test_port(port: int) -> bool:
    """Checks if a local port is open."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex(('127.0.0.1', port)) == 0

def query_url(url: str) -> dict:
    """Queries an HTTP endpoint and returns JSON response."""
    try:
        req = urllib.request.Request(url, method='GET')
        with urllib.request.urlopen(req, timeout=2.0) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

def run_diagnostics():
    print("[INFO] Starting diagnostic scan for local Ollama and OpenClaw services...\n")
    
    # Common ports
    # 11434: Ollama default
    # 8000, 8080, 5001, 3000: OpenClaw, LiteLLM, LM Studio default ports
    ports_to_scan = [11434, 8000, 8080, 5001, 3000]
    active_ports = []
    
    for port in ports_to_scan:
        open_status = test_port(port)
        status_str = "OPEN" if open_status else "CLOSED"
        print(f"Port {port}: {status_str}")
        if open_status:
            active_ports.append(port)
            
    print("\n" + "-"*50)
    print("[INFO] Diagnosing Active Endpoints:\n")
    
    # 1. Test Ollama Specific API
    if 11434 in active_ports:
        print("[INFO] Testing Ollama on port 11434...")
        ollama_tags = query_url("http://127.0.0.1:11434/api/tags")
        if "error" not in ollama_tags:
            models = [m.get("name") for m in ollama_tags.get("models", [])]
            print(f"[SUCCESS] Ollama is running! Available models: {models}")
        else:
            print(f"[WARNING] Ollama port is open, but API returned error: {ollama_tags['error']}")
            
    # 2. Check OpenAI-Compatible endpoints on open ports
    for port in active_ports:
        print(f"\n[INFO] Testing OpenAI-compatible Models Endpoint on port {port}...")
        url = f"http://127.0.0.1:{port}/v1/models"
        res = query_url(url)
        if "error" not in res:
            try:
                models = [m.get("id") for m in res.get("data", [])]
                print(f"[SUCCESS] Found OpenAI-compatible gateway! Available models: {models}")
            except Exception as e:
                print(f"[WARNING] Endpoint responded, but parsing failed: {e}. Raw response: {res}")
        else:
            # Try non-V1 endpoint just in case
            url_alt = f"http://127.0.0.1:{port}/models"
            res_alt = query_url(url_alt)
            if "error" not in res_alt:
                print(f"[SUCCESS] Found gateway at /models! Response: {res_alt}")
            else:
                print(f"[ERROR] Port {port} did not respond to standard model query API.")

if __name__ == "__main__":
    run_diagnostics()
