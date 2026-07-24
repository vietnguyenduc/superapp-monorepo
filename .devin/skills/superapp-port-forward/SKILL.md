---
name: superapp-port-forward
description: "Use when the user reports local dev ports are unreachable from phone/laptop via Tailscale, Tailscale is down, or asks to open/reopen ports. Triggers: mở lại port, Tailscale sập, port mất, không vào được OpenHands, dashboard unreachable, phone cannot access local dev, WSL port forward, expose local ports."
allowed-tools:
  - exec
  - read
  - edit
  - write
  - grep
  - find_file_by_name
  - ask_user_question
triggers:
  - user
  - model
---

# Superapp Port Forward / Tailscale Self-Healing

Use this skill when the user reports mobile/phone cannot access local dev apps via Tailscale, or asks to "mở lại port", "Tailscale sập", "port mất", "không vào được OpenHands".

## Required environment

- Windows host has Tailscale installed and the `tailscale` service is running.
- WSL2 `Ubuntu` distro has the repo at `/home/dev/projects/superapp-monorepo`.
- `C:\Users\Lenovo ThinkBook 14\CascadeProjects\openhands` contains `start-all.bat`, `forward-wsl-app-ports.ps1`, `generate-apps-dashboard.ps1`.

## Auto-healing workflow

1. **Verify Tailscale is connected**
   - Run `tailscale ip -4` on the Windows host.
   - If it returns nothing or errors, run `tailscale up` and wait 5s. If it asks to authenticate, report to the user and stop.
   - If `tailscale` service is stopped, run `sc start tailscale` then retry.

2. **Forward WSL ports to Windows and open firewall**
   - Run `C:\Users\Lenovo ThinkBook 14\CascadeProjects\openhands\run-forward-wsl-ports.bat` (it auto-elevates as admin). This:
     - Forwards `5173-5178, 3001, 3006, 7130` from Windows `0.0.0.0` to WSL2.
     - Adds firewall rules for WSL dev ports, OpenHands (`3000`), and Dashboard (`8080`).
     - Configures `winnat` dynamic ports to start at `60000` and restarts `winnat` to prevent Docker `ports are not available` errors when OpenHands starts sandbox containers.
   - If the script fails, fall back to `netsh interface portproxy add v4tov4 listenport=<port> listenaddress=0.0.0.0 connectport=<port> connectaddress=<wslIp>` and add a `New-NetFirewallRule` for each missing port.
   - If OpenHands still fails with `500 ports are not available`, manually restart `winnat`: `Restart-Service -Name winnat` (PowerShell admin) or `net stop winnat && net start winnat`.
   - **WARNING (learned 2026-07-24):** `Restart-Service winnat` **deletes the `NetNat` rule for the WSL subnet**, breaking WSL internet completely (no DNS, no external connectivity). After restarting `winnat`, you MUST recreate the NAT rule — see `AGENTS.md` §8 (WSL2 Network / DNS / NetNat Recovery). Prefer fixing Docker port exhaustion by other means before restarting `winnat`.

3. **Ensure core services are running**
   - **OpenHands (3000)**: check `http://localhost:3000`. If not responding, run `C:\Users\Lenovo ThinkBook 14\CascadeProjects\openhands\start-openhands-wsl.sh` in WSL, or `start-all.bat`.
   - **Dashboard (8080)**: check `http://localhost:8080/apps-dashboard.html`. If not responding, run `C:\Users\Lenovo ThinkBook 14\CascadeProjects\openhands\generate-apps-dashboard.ps1` (it kills the old server and starts a new one).
   - **Vite apps (5173-5178, 3006)**: check `http://localhost:5173` etc. If not running, run `npm run dev:apps` in `/home/dev/projects/superapp-monorepo`.
   - **API (3001)**: check `http://localhost:3001`. If not running, run `npm run dev -w packages/api` or `start-superapp-services.bat`.

4. **Verify from the Tailscale IP**
   - Get `TAILSCALE_IP` from `tailscale ip -4` (Windows) or `tailscale status --self --json`.
   - For each important port, run `curl -s -o /dev/null -w "%{http_code}" "http://$TAILSCALE_IP:$PORT"`.
   - Use `browser_navigate` to `http://$TAILSCALE_IP:8080` and `http://$TAILSCALE_IP:3000` to confirm the UI renders.

5. **Report URLs to the user**
   - Dashboard: `http://<TAILSCALE_HOSTNAME>:8080`
   - OpenHands: `http://<TAILSCALE_HOSTNAME>:3000`
   - Vite apps: `http://<TAILSCALE_HOSTNAME>:5173` etc.

## Do not

- Tell the user "reconnect manually" without trying to heal first.
- Use `2>/dev/null` while debugging; always surface stderr.
- Assume Tailscale is in WSL; the Tailscale daemon runs on Windows.

## Notes

- `generate-apps-dashboard.ps1` uses `tailscale ip -4` to generate the dashboard HTML. If the Tailscale IP changes, rerun the script to update the links.
- `forward-wsl-app-ports.ps1` already includes `OpenHands Server 3000` and `Dashboard Server 8080` firewall rules.
- The dashboard itself is a quick-launcher; it should be the first thing the user opens on the phone.
