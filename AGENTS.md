# Superapp Monorepo — Agent Rules

## 1. Always verify before declaring success

- After any code change, run the relevant build / type-check / test.
- After any deployment, open the live URL with the browser tool and confirm the UI renders.
- Do not finish a task with "it should work" or "you can check it".

## 1b. BROWSER VERIFICATION IS MANDATORY — not optional

- **Every task that changes UI MUST end with browser verification.**
- Do NOT report "task completed" without first opening a URL in browser.
- Use `browser_navigate` → `browser_screenshot` → `browser_get_content` to verify.
- If the feature is not visible in the browser → the task is NOT done. Fix and retry.

### CRITICAL: Which URL to verify depends on the Git branch

| Scenario | Branch | What Vercel does | URL to verify |
|----------|--------|------------------|---------------|
| Local dev (no push) | — | Nothing | `http://<TAILSCALE_IP>:<PORT>` (e.g. `http://100.83.130.115:5174`) |
| Pushed to `viet` | `viet` | Creates **preview deployment** | Vercel preview URL (from `vercel ls` output) |
| Merged to `main` | `main` | Deploys to **production** | `https://<app>.appforyou.xyz` |

**DO NOT verify on production URL (appforyou.xyz) after pushing to `viet` — production hasn't changed yet!**
- After `git push origin viet` → Vercel builds a **preview** deployment → verify the **preview URL**.
- Production URLs only update when `viet` is merged into `main`.
- To get the preview URL: `vercel ls --token "$VERCEL_TOKEN" <app-name>` → find the latest deployment URL.

### Local dev URLs (for testing without push)
| App | Local URL (Tailscale) | Port |
|-----|----------------------|------|
| Admin Portal | http://100.83.130.115:5173 | 5173 |
| Cashflow | http://100.83.130.115:5174 | 5174 |
| Inventory | http://100.83.130.115:5175 | 5175 |
| Sales | http://100.83.130.115:5176 | 5176 |
| HR | http://100.83.130.115:5177 | 5177 |
| Accounting | http://100.83.130.115:5178 | 5178 |
| Operations | http://100.83.130.115:3006 | 3006 |

### Production URLs (ONLY after merge to main)
| App | Production URL |
|-----|---------------|
| Admin Portal | https://admin.appforyou.xyz |
| Cashflow | https://cashflow.appforyou.xyz |
| Inventory | https://inventory.appforyou.xyz |
| Sales | https://sales.appforyou.xyz |
| HR | https://hr.appforyou.xyz |
| Accounting | https://accounting.appforyou.xyz |
| Operations | https://ops.appforyou.xyz |

### Verification workflow (choose the right one)

**Scenario A: Local dev only (no push)**
1. Code changes → Vite HMR auto-reloads on WSL
2. `browser_navigate` to `http://<TAILSCALE_IP>:<PORT>`
3. Screenshot + verify feature
4. Report: "Verified locally at [URL]: [feature] OK"

**Scenario B: Pushed to `viet` (preview deployment)**
1. `git push origin viet` → Vercel auto-builds preview
2. `vercel ls --token "$VERCEL_TOKEN" <app-name>` → find latest preview URL
3. `browser_navigate` to the **preview URL** (NOT appforyou.xyz!)
4. Screenshot + verify feature
5. Report: "Verified preview at [URL]: [feature] OK"
6. **Do NOT claim production is updated — it isn't until merge to main.**

**Scenario C: Merged to `main` (production deployment)**
1. Merge `viet` → `main` → Vercel deploys to production
2. Wait for READY
3. `browser_navigate` to `https://<app>.appforyou.xyz`
4. Screenshot + verify feature
5. Report: "Verified production at [URL]: [feature] OK"

### Common excuses that are NOT accepted
- "I can't access the URL" → Use the correct URL for the scenario (local/preview/production).
- "Browser tool not available" → It is. Use `browser_navigate`.
- "The change is backend only" → Still verify: check API response via browser or curl.
- "Vercel is still building" → Wait for READY, then verify. Don't report done before deploy finishes.
- "Production URL doesn't show the change" → Of course not, you pushed to `viet` not `main`. Verify the preview URL instead.

## 2. Git + Vercel workflow

When the user asks to deploy, redeploy, or verify a frontend app:

1. `git status --short` to see local changes.
2. `git add <relevant-files>` and `git commit -m "fix: <description>"`.
3. `git push origin viet`.
4. Use `vercel --token "$VERCEL_TOKEN"` to list deployments or trigger a new build.
5. Wait for `READY` state.
6. Use `browser_navigate` to the production URL and `browser_get_content` to verify.

## 3. Environment variables

- `VERCEL_TOKEN` and `GH_TOKEN` are injected via `OH_AGENT_SERVER_ENV`.
- `vercel` and `gh` CLI are available in the agent-server sandbox.
- Never claim "no access to Vercel" or "gh not authenticated" when these tokens are present.

## 4. Debugging discipline

- Do not hide stderr with `2>/dev/null` when investigating failures.
- Capture exact error messages, HTTP status codes, and console logs.
- Retry at most 3 times with the same approach; after that, try a different method.

## 5. Ask for confirmation only when destructive

- Auto-commit and auto-push are fine for small, safe fixes.
- Ask the user before: force-push, database migration, deleting files, or exposing secrets.

## 6. Port Forwarding / Tailscale Self-Healing

When the user is on mobile and says Tailscale is down, ports are unreachable, or asks to open/reopen ports:

1. Verify Tailscale on Windows: `tailscale ip -4`. If empty, `tailscale up` or `sc start tailscale`.
2. Run `C:\Users\Lenovo ThinkBook 14\CascadeProjects\openhands\run-forward-wsl-ports.bat` (auto-elevates as admin) to forward WSL ports, open firewall for `3000` (OpenHands) and `8080` (dashboard), and fix `winnat` dynamic ports to prevent Docker `500 ports are not available` errors.
3. If OpenHands still fails with `500 ports are not available`, restart `winnat`: `Restart-Service -Name winnat` (PowerShell admin) or `net stop winnat && net start winnat`.
   > **WARNING (learned 2026-07-24):** `Restart-Service winnat` **deletes the `NetNat` rule for the WSL subnet**, which breaks WSL internet completely (WSL cannot reach gateway, DNS, or any external host). After restarting `winnat`, you MUST recreate the NAT rule — see section 8 below. Prefer fixing Docker port exhaustion by other means before restarting `winnat`.
4. Restart any missing service: OpenHands (`start-openhands-wsl.sh`), dashboard (`generate-apps-dashboard.ps1`), Vite apps (`npm run dev:apps`), API (`npm run dev -w packages/api`).
4. Verify from the Tailscale IP with `curl` and `browser_navigate`.
5. Report the live URLs: `http://<TAILSCALE_HOSTNAME>:8080` (dashboard), `http://<TAILSCALE_HOSTNAME>:3000` (OpenHands).

Use the `superapp-port-forward` skill in `.devin/skills/superapp-port-forward/SKILL.md` for the full workflow.

## 7. Remote Dev / Tailscale Dashboard Context

The user works from anywhere (cafe, mobile, laptop) via **Tailscale**. The dev environment spans two hosts:

| Host | Role | Tailscale hostname |
|------|------|--------------------|
| Windows (`desktop-u5m9dgp`) | Runs Tailscale daemon, dashboard server, port forwarding, OpenHands launcher | `desktop-u5m9dgp` |
| WSL2 Ubuntu container | Runs OpenHands agent-server, Vite dev apps, API server | (shares Windows Tailscale IP) |

### Apps Dashboard

- **URL**: `http://desktop-u5m9dgp:8080/apps-dashboard.html` (or `http://<TAILSCALE_IP>:8080/apps-dashboard.html`)
- **Served from**: Windows host (NOT from WSL/OpenHands container). A Python HTTP server on port `8080` serves the static HTML.
- **Generated by**: `C:\Users\Lenovo ThinkBook 14\CascadeProjects\openhands\generate-apps-dashboard.ps1` (in the `openhands` project, not this repo).
- **Started by**: `C:\Users\Lenovo ThinkBook 14\CascadeProjects\openhands\start-all.bat` on Windows boot.
- **Purpose**: Single page listing all running dev apps with live status checks. Open this first when you need to know which app is on which port.

### App → Port mapping (local dev)

| App | Port | Vite app path |
|-----|------|---------------|
| OpenHands | 3000 | (agent-server, not Vite) |
| Admin Portal | 5173 | `apps/admin-portal` |
| Cashflow | 5174 | `apps/cashflow` |
| Inventory Operation | 5175 | `apps/inventory-operation` |
| Sales Operation | 5176 | `apps/sales-operation` |
| HR Operation | 5177 | `apps/hr-operation` |
| Accounting | 5178 | `apps/accounting` |
| Operations Portal | 3006 | `apps/operations-portal` |
| API server | 3001 | `packages/api` |

> Dashboard tự động lấy Tailscale IP/hostname khi sinh ra, nên URL trên dashboard luôn đúng. Khi cần kiểm tra app nào đang chạy, **mở dashboard trước** thay vì đoán port.

### Important notes

- Tailscale daemon chạy **trên Windows**, không phải trong WSL. WSL container dùng IP Tailscale của Windows host.
- Dashboard `apps-dashboard.html` **không nằm trong repo này** — nó nằm trong project `openhands` trên Windows. Đừng tìm nó trong workspace.
- Nếu IP Tailscale đổi, chạy lại `generate-apps-dashboard.ps1` để cập nhật link.
- Từ WSL, truy cập Windows host qua `desktop-u5m9dgp` (Magic DNS) hoặc IP Tailscale. Đảm bảo WSL resolve được hostname.

### CRITICAL: Network architecture — do NOT confuse

```
Phone (Tailscale)
    │
    ▼ 100.83.x.x = Tailscale IP of Windows (NOT Docker internal IP!)
Windows host (desktop-u5m9dgp)
    │ ├── Port 8080: Dashboard (Python HTTP server on Windows)
    │ ├── Port 3000: OpenHands UI (→ Docker -p 3000:3000)
    │ └── Port proxy (netsh portproxy): 3006, 5173-5178, 3001 → WSL IP
    │
    ▼
WSL2 Ubuntu
    │ ├── Vite dev apps (npm run dev:apps) ← DEV SERVERS RUN HERE
    │ ├── API server (port 3001)
    │ └── Docker
    │       └── openhands-app container (port 3000 mapped)
    │             └── Sandbox containers (OpenHands edits code here)
    │                   └── If Vite runs here → PORTS NOT EXPOSED to WSL/Windows
```

### RULE 1: Vite dev servers run on WSL, NOT inside sandbox containers

- Vite apps are started by `start-all.bat` (step 4): `wsl -d Ubuntu -- bash -c "cd /home/dev/projects/superapp-monorepo && npm run dev:apps"`.
- Vite runs **directly on WSL2**, ports forwarded from Windows via `forward-wsl-app-ports.ps1` (netsh portproxy).
- **Do NOT start Vite inside OpenHands sandbox containers.** Sandbox containers are separate Docker containers whose ports are NOT mapped to WSL or Windows.
- If you run `npm run dev` inside a sandbox, the app will NOT be accessible from Windows/phone/dashboard.
- **OpenHands job**: edit code in sandbox, do NOT host dev servers. Dev servers already run on WSL.

### RULE 2: 100.83.x.x is Tailscale IP, NOT Docker internal IP

- `100.83.130.115` is the **Tailscale IP** of the Windows host (range `100.64.0.0/10` is Tailscale CGNAT).
- It is **NOT** a Docker container internal IP. Do not confuse them.
- Dashboard links point to `http://<TAILSCALE_IP>:<PORT>` — this is the correct URL for phone access via Tailscale.
- Chain: `Phone → Tailscale IP (Windows) → netsh portproxy → WSL IP → Vite app`.

### RULE 3: Do not change Vite ports

- Dashboard hardcodes ports per app (3006, 5173-5178). Do not change Vite port to 8011 or any other port.
- If an app is unreachable, the issue is **port forwarding not running** or **Vite not started on WSL**, not wrong port.
- Fix: run `run-forward-wsl-ports.bat` on Windows + ensure `npm run dev:apps` is running on WSL.

### RULE 4: Work in /workspace/project/ (main repo), NOT in snapshot copies

- Sandbox mounts `/home/dev/projects/superapp-monorepo` → `/workspace/project/`.
- **ALWAYS work in `/workspace/project/`** — this is the main repo. Code changes here are picked up by WSL Vite via HMR.
- **Do NOT create or use `/workspace/project/project/<hash>/superapp-monorepo/`** — this is a clone from GitHub. Code changed there does NOT reach WSL Vite.
- **Why OpenHands creates copies**: When creating a conversation, if you select "Repository" = `vietnguyenduc/superapp-monorepo`, OpenHands will `git clone` the repo into `/workspace/project/<hash>/superapp-monorepo/`. **Do NOT select a repository when creating a conversation** — leave it empty, OpenHands will use `/workspace/project/` directly (the mounted repo).
- If you see a `project/<hash>/` directory inside the workspace, **delete it immediately**: `rm -rf /workspace/project/project/`.
- Verify: after editing files, run `git diff` in `/workspace/project/` to confirm changes landed in the main repo.
- **Do NOT run `npm run dev` or `vite` inside sandbox** — dev servers already run on WSL (via `start-all.bat`). Only edit code + commit.

### RULE 5: Port 60xxx is temporary preview, NOT deployment

- OpenHands sandbox maps internal ports to `localhost:60xxx` (e.g. `localhost:60865`). This is a **temporary preview**.
- When sandbox dies → port 60xxx disappears → fix is lost.
- **Do NOT use port 60xxx to verify deployment.** Always verify via `http://<TAILSCALE_IP>:<PORT>` (e.g. `http://100.83.130.115:3006`).
- Correct workflow: edit code in `/workspace/project/` → commit → WSL Vite auto-HMR → verify via Tailscale IP.

## 8. WSL2 Network / DNS / NetNat Recovery

WSL2 uses a Hyper-V NAT bridge (`NetNat`) to route traffic from the WSL subnet (`172.29.128.0/20`) to the internet via the Windows host. If this bridge breaks, WSL loses **all** external connectivity (no DNS, no internet, cannot reach even the gateway `172.29.128.1`). Symptoms: `Could not resolve host: github.com`, `git push` fails from WSL, `npm install` fails, `curl` hangs, `ping 8.8.8.8` = 100% packet loss.

### 8.1 Diagnosis flow

```mermaid
flowchart TD
  START[WSL network fails] --> PING_IP{ping 8.8.8.8 from WSL?}
  PING_IP -->|OK| DNS{getent hosts github.com?}
  DNS -->|OK| DONE[Network OK — investigate app-specific issue]
  DNS -->|FAIL| FIX_DNS[Fix DNS — see 8.3]
  PING_IP -->|FAIL 100% loss| PING_GW{ping 172.29.128.1 from WSL?}
  PING_GW -->|OK| NETNAT[Check NetNat — see 8.2]
  PING_GW -->|FAIL| NETNAT[NetNat missing/broken — see 8.2]
  NETNAT --> FIX_NAT[Recreate NetNat — see 8.4]
  FIX_NAT --> VERIFY[Verify — see 8.5]
  FIX_DNS --> VERIFY
  VERIFY -->|OK| DONE
  VERIFY -->|FAIL| ESCALATE[Escalate to user — needs admin PowerShell]
```

### 8.2 Check NetNat (Windows PowerShell, no admin needed to check)

```powershell
Get-NetNat | Format-List Name, InternalIPInterfaceAddressPrefix
```

- **Healthy**: Returns `Name: WSLNAT`, `InternalIPInterfaceAddressPrefix: 172.29.128.0/20` (or whatever the current WSL subnet is).
- **Broken**: Returns empty — NAT rule was deleted (common after `Restart-Service winnat` or Windows update).

Also check the WSL subnet (it can change after `wsl --shutdown`):
```bash
# In WSL
ip -4 addr show eth0 | grep inet   # e.g. 172.29.141.188/20
ip route | grep default             # e.g. default via 172.29.128.1
```
The NAT prefix is `<gateway_base>/20` — e.g. gateway `172.29.128.1` → prefix `172.29.128.0/20`.

### 8.3 Fix DNS in WSL (run as root via `wsl -u root`, no sudo password needed)

If `Get-NetNat` is healthy but DNS still fails, the issue is `systemd-resolved` stub (`127.0.0.53`) having no upstream DNS. Fix:

```bash
# Run from Windows PowerShell (bypasses sudo password)
wsl -d Ubuntu -u root -- bash -c '
  systemctl stop systemd-resolved
  systemctl disable systemd-resolved
  rm -f /etc/resolv.conf
  cat > /etc/resolv.conf <<EOF
nameserver 8.8.8.8
nameserver 1.1.1.1
nameserver 8.8.4.4
options timeout:2 attempts:3
EOF
  chmod 644 /etc/resolv.conf
  chattr +i /etc/resolv.conf 2>/dev/null || true
  # Ensure nsswitch uses dns, not resolve plugin
  sed -i "s/^hosts:.*/hosts:          files dns/" /etc/nsswitch.conf
'
```

The `chattr +i` locks the file so WSL/systemd cannot overwrite it on restart. To edit it later, first `chattr -i /etc/resolv.conf`.

### 8.4 Recreate NetNat (REQUIRES admin PowerShell)

If `Get-NetNat` is empty, recreate the NAT rule. **Open PowerShell as Administrator** and run:

```powershell
# Get current WSL subnet first (in non-admin shell):
#   wsl -d Ubuntu -- bash -c "ip route | grep default"
# Then in admin shell, using the subnet from the gateway IP:
New-NetNat -Name "WSLNAT" -InternalIPInterfaceAddressPrefix "172.29.128.0/20"
```

If it errors "object already exists" or the subnet changed:
```powershell
Get-NetNat | Remove-NetNat -Confirm:$false
New-NetNat -Name "WSLNAT" -InternalIPInterfaceAddressPrefix "172.29.128.0/20"
```

After recreating, `wsl --shutdown` is NOT required — connectivity returns immediately.

### 8.5 Verify

```bash
# In WSL
ping -c 2 8.8.8.8              # Should be 0% loss
getent hosts github.com        # Should resolve
curl -sI https://github.com    # Should return HTTP/2 200
git ls-remote origin viet      # Should return SHA
```

### 8.6 Rules

- **NEVER run `Restart-Service winnat` to fix WSL network issues.** It deletes the `NetNat` rule and breaks WSL internet completely. This is the opposite of what AGENTS.md section 6 step 3 used to suggest — that advice is now superseded.
- **If `winnat` was already restarted** (e.g. to fix Docker `500 ports are not available`), immediately verify `Get-NetNat` is non-empty. If empty, recreate per 8.4 before doing anything else.
- **`netsh portproxy` rules survive `winnat` restart** — Tailscale port forwarding (3000, 5173-5178, 3006, 3001, 8081) is NOT affected. Do not re-run `run-forward-wsl-ports.bat` unless `netsh interface portproxy show v4tov4` is actually empty.
- **WSL subnet can change** after `wsl --shutdown` or Windows reboot. Always re-read the current subnet from `ip route` inside WSL before creating a new `NetNat` rule. The `/20` prefix is correct for the default WSL2 configuration.
- **`wsl -u root` bypasses the sudo password** — use it for one-off root operations in WSL when the user has forgotten their sudo password. Do not change the user's password without explicit permission.
- **Do NOT enable `networkingMode=mirrored` in `.wslconfig`** to fix DNS. It was tried before and breaks Tailscale port forwarding from the phone. Keep `networkingMode` at default (NAT) and fix DNS via `/etc/resolv.conf` + `NetNat` instead.
## Trial Seed System

### Architecture

```
trial_seed.data (Supabase table)
  → API GET /api/trial/:table (packages/api/dist/routes/trial.js)
    → trialClient.ts (packages/trial-client/src/index.ts + duplicated in each app)
      → UI components
```

- **Seed data**: stored in `trial_seed.data` table (schema: `table_name`, `record` jsonb, `sort_order`)
- **API**: `GET /api/trial/:table` (public), `PUT /api/trial/:table` (admin auth required)
- **Import script**: `scripts/import-trial-seeds.mjs` — extracts mock data from `trialMockStore.ts`, `trialData.ts`, `trialMockData.ts` and inserts into Supabase
- **Admin editor**: `/admin/trial-seeds` in admin-portal — grid editor with validation, preview, and "Open in trial" links

### App ↔ Table mapping

See `TRIAL_TABLES` in `packages/trial-client/src/index.ts` for all 30+ tables.
Admin editor groups tables by app in `APP_TABLES` constant in `apps/admin-portal/src/pages/TrialSeedEditor.tsx`.

### Migration

Run `supabase/migrations/038_trial_seed_data.sql` in Supabase Dashboard SQL Editor first.
Then run `node scripts/import-trial-seeds.mjs` to populate seed data.

### RULE 6: Always git push after completing a task

- OpenHands edits code directly in `/workspace/project/` (mounted repo).
- **After completing a task, ALWAYS commit + push** to `origin/viet`:
  ```bash
  cd /workspace/project
  git add -A
  git commit -m "fix: <description>"
  git push origin viet
  ```
- This ensures:
  1. Code fix survives sandbox death.
  2. WSL Vite has the latest code (if restart needed).
  3. Vercel auto-deploy receives the fix.
  4. Next session starts with latest code.
- **Do NOT only commit without pushing** — local commit is not enough, must push to remote.
