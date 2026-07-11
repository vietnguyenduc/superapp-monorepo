# Superapp Monorepo — Agent Rules

## 1. Always verify before declaring success

- After any code change, run the relevant build / type-check / test.
- After any deployment, open the live URL with the browser tool and confirm the UI renders.
- Do not finish a task with "it should work" or "you can check it".

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
4. Restart any missing service: OpenHands (`start-openhands-wsl.sh`), dashboard (`generate-apps-dashboard.ps1`), Vite apps (`npm run dev:apps`), API (`npm run dev -w packages/api`).
4. Verify from the Tailscale IP with `curl` and `browser_navigate`.
5. Report the live URLs: `http://<TAILSCALE_HOSTNAME>:8080` (dashboard), `http://<TAILSCALE_HOSTNAME>:3000` (OpenHands).

Use the `superapp-port-forward` skill in `.devin/skills/superapp-port-forward/SKILL.md` for the full workflow.
