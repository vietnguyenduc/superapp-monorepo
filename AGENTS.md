# Superapp Monorepo — Agent Rules

## 0. Quick Start for new agents (read this first — 60 seconds)

> **You are an agent working on the Superapp Monorepo.** This section orients you in 60 seconds. Read it before doing anything else. Then read §1-§10 for the rules that keep you out of trouble.

### 0.1 What is this project?

A **multi-tenant SaaS superapp** for Vietnamese SMBs (small-medium businesses) in F&B / retail. 7 frontend Vite Superapp apps + `apps/framework-method/` (separate personal project) + `apps/insforge-infra/` (Docker infra, not deployed to Vercel). The 7 Superapp apps are deployed to 7 Vercel production domains (`*.appforyou.xyz`). Multi-tenant via RLS + `company_id` (NOT schema-per-tenant).

### 0.2 The 7 Superapp apps (what each does)

| App | Port | Domain | Purpose |
|-----|------|--------|---------|
| **Admin Portal** | 5173 | `admin.appforyou.xyz` | Multi-company management, user/role admin, trial seed editor (`/admin/trial-seeds`), app switcher |
| **Cashflow** | 5174 | `cashflow.appforyou.xyz` | Cash flow management: transactions, bank accounts, transaction types, branches, reports |
| **Inventory Operation** | 5175 | `inventory.appforyou.xyz` | Inventory: products, categories, stock movements (import/export/transfer), variance reporting |
| **Sales Operation** | 5176 | `sales.appforyou.xyz` | Sales orders + POS for F&B (fruit, dry goods, drinks): customers, sales reports, special outbound, bulk import |
| **HR Operation** | 5177 | `hr.appforyou.xyz` | HR & **Payroll 3P** (Position-Person-Performance): employees, contracts, salary calculation |
| **Accounting** | 5178 | `accounting.appforyou.xyz` | Accounting: journal entries, invoices, fixed assets, taxes, chart of accounts, **e-invoice** |
| **Operations Portal** | 3006 | `ops.appforyou.xyz` | Operations portal: shift management, training & quizzes, branch-level ops dashboards |

> `apps/framework-method/` is a separate personal project (`https://framework.appforyou.xyz`), not part of the core Superapp docs. Its docs live in `apps/framework-method/docs/` only.

> **`apps/` directory contains 10 entries**: the 7 Vite Superapp apps above + `apps/framework-method/` (separate personal project) + `apps/insforge-infra/` (Docker infrastructure for the agent — see §9 + §10, NOT a Vite app, NOT deployed to Vercel) + `apps/superapp-business-bot/` (deprecated leftover, only `config/settings.json`, no `package.json`). Old `apps/archive/`, `apps/docs/`, `apps/web/` were deleted 2026-07-24. `superapp-business-bot` is kept for historical reference but should not be treated as a deployable app.

### 0.3 The 12 packages (shared code)

| Package | Purpose |
|---------|---------|
| `@superapp/iam` | **Auth + multi-tenant context** — `AuthProvider`, `CompanyProvider`, `useAuth`, `useCompany`. Used by all 7 Superapp apps. |
| `@repo/ui` | Shared component library (buttons, modals, DataGrid, etc.) |
| `@repo/hooks` | Shared React hooks |
| `@superapp/trial-client` | Trial mode client — `trialClient.ts` reads from `trial_seed.data` table |
| `@repo/types` | Shared TypeScript types (User, Company, UserRole, etc.) |
| `superapp-api` | Fastify API server (port 3001) — routes for trial seeds, query proxy, etc. |
| `@superapp/einvoice` | E-invoice integration (for Accounting app) |
| `@superapp/theme` | Tailwind theme tokens (Apple-inspired design) |
| `@superapp/shared-utils` | Shared utility functions (BaseService, apiClient, createSupabaseClient) |
| `@superapp/insforge-mcp` | InsForge MCP server (DB tools for OpenHands — see §10.7) |
| `@repo/eslint-config` | Shared ESLint config |
| `@repo/typescript-config` | Shared tsconfig |

### 0.4 Stack

- **Frontend**: React 18 + TypeScript 5.8 + Vite 8 + Tailwind CSS (Apple-inspired). The entire monorepo is standardized on React 18 / TS 5.8.
- **Backend**: Supabase cloud (`peslmsctejkwzyohke`) — PostgreSQL + RLS + Auth + Storage + Realtime
- **API**: Fastify (`packages/api`, port 3001) — thin layer for trial seeds + utilities
- **Local DB** (OpenHands only): PostgreSQL `localhost:5432/superapp` via `packages/api` (configurable by `DATABASE_URL`)
- **Deploy**: Vercel (preview on `viet` push, production on `main` merge)
- **Monitoring**: Sentry (wired across all 7 Superapp apps)
- **Docs**: 12 files per app in `apps/<app>/docs/` (OVERVIEW, ARCHITECTURE, API, FLOWS, DATA-MODEL, DATA-FLOW, UI-UX, PRD, ROLES-PERMISSIONS, RUNBOOK, AI-CONTEXT, CHANGELOG) + root docs in `docs/`

### 0.5 Read order for a new task

```mermaid
flowchart TD
  START[New session] --> READ0[Read AGENTS.md §0<br/>this section — 60s]
  READ0 --> READ_TASK{Task involves<br/>specific app?}
  READ_TASK -->|Yes| APPDOC[Read apps/<app>/docs/AI-CONTEXT.md<br/>(or CHANGELOG.md if AI-CONTEXT.md missing) — 2 min]
  READ_TASK -->|No, cross-app| ROOTDOC[Read docs/ARCHITECTURE.md<br/>+ docs/PROJECT_CONTEXT.md — 3 min]
  APPDOC --> MEMORY[Call read_memory via insforge-mcp<br/>load previous session context — §13.1]
  ROOTDOC --> MEMORY
  MEMORY --> GREP[Grep docs for task keywords<br/>§13.2 — what's already documented?]
  GREP --> SEARCH[Use DeepWiki vector search<br/>for conceptual queries — §9]
  SEARCH --> CODE[Now you have context.<br/>Start coding in /workspace/project/]
  CODE --> RULES[Follow §1-§13 rules<br/>verify, push, etc.]
  RULES --> DOCS[Update docs + log findings<br/>§13.3-§13.4 — MANDATORY before commit]
  DOCS --> COMMIT[Commit with doc updates<br/>§13.7 checklist]
```

### 0.6 The 6 most important rules (don't forget these)

1. **Verify in browser before reporting done** (§1b) — use the right URL (local/preview/production per branch).
2. **Work in `/workspace/project/` only** (RULE 4) — never in `project/<hash>/` snapshot copies.
3. **Don't start Vite in sandbox** (RULE 1) — dev servers run on WSL, you only edit code.
4. **Always push to `origin/viet` after task** (RULE 6) — local commit is not enough.
5. **Don't restart `winnat`** (§8) — it deletes the NetNat rule and breaks WSL internet.
6. **Read docs before coding, update docs after coding** (§13) — doc discipline is mandatory, not optional.

### 0.7 Top 10 DON'Ts (collected from all sections)

| # | Don't | Why | Section |
|---|-------|-----|---------|
| 1 | Don't verify on `appforyou.xyz` after pushing to `viet` | Production hasn't changed — verify preview URL | §1b |
| 2 | Don't work in `/workspace/project/project/<hash>/` | It's a git clone, not the mounted repo — changes won't reach Vite | RULE 4 |
| 3 | Don't start `npm run dev` / `vite` in sandbox | Sandbox ports aren't mapped to WSL/Windows — use Tailscale IP instead | RULE 1 |
| 4 | Don't change Vite ports (5173-5178, 3006) | Dashboard hardcodes them — fix port forwarding instead | RULE 3 |
| 5 | Don't use port `60xxx` for verification | It's temporary sandbox preview, dies when sandbox dies | RULE 5 |
| 6 | Don't restart `winnat` without recreating NetNat | Deletes WSL NAT rule → WSL loses internet | §8 |
| 7 | Don't edit `openhands-settings.json` from WSL/sandbox | It lives on Windows — edit from Windows side, restart OpenHands | §10.10 |
| 8 | Don't skip `read_memory` at session start | Context recall is the whole point of the InsForge Agent Protocol | §10.6 |
| 9 | Don't call `execute` with `confirm: true` without user approval | Destructive DB writes need explicit confirmation | §10.6 |
| 10 | Don't create schema-per-tenant (`tenant_<id>.`) | Project uses RLS + `company_id` — see `002_rls_policies.sql` | `.openhands_instructions` §12 |
| 11 | Don't use `localhost:3001` from sandbox | `localhost` = sandbox itself, not host — use `host.docker.internal:3001` | §10.11 |
| 12 | Don't `cd apps/cashflow && vercel deploy` | Vercel `rootDirectory` is set — deploy from `/workspace/project` root | §10.13 |
| 13 | Don't code without reading docs first | §13.1 — 3 min of reading saves 30 min of re-discovery | §13 |
| 14 | Don't commit without updating docs | §13.3 — stale docs mislead the next session | §13 |
| 15 | Don't skip `log_decision` / `log_error_pattern` / `write_memory` | §13.4 — findings not logged are findings lost | §13 |

### 0.8 When you're stuck

| Problem | Where to look |
|---------|---------------|
| "App unreachable from phone" | §6 Port Forwarding + §7 Tailscale architecture |
| "WSL has no internet / DNS fails" | §8 WSL2 Network / DNS / NetNat Recovery |
| "Sandbox can't reach API/Postgres" | §10.11 Sandbox network topology — use `host.docker.internal:<port>` |
| "Docker socket broken after WSL restart" | §10.12 Native Docker Engine — `bash /home/dev/openhands-ctl.sh start` |
| "Vercel deploy fails from sandbox" | §10.13 Vercel deploy — deploy from `/workspace/project` root |
| "Need to find how X works" | §9 DeepWiki vector search (`docker exec insforge-deepwiki python3 /tmp/dw_search.py "X" 15`) |
| "Don't know which MCP tool to use" | §10.7 MCP servers + §10.6 InsForge Agent Protocol |
| "Conversation hitting context limit" | §10.3 Condenser handles it automatically — don't manually summarize |
| "Task too big for 500 iterations" | §10.5 Task Splitter on dashboard |
| "Need to know app's data model" | `apps/<app>/docs/DATA-MODEL.md` + `supabase/migrations/` |
| "Need to know app's API" | `apps/<app>/docs/API.md` |
| "Need to know user roles" | `apps/<app>/docs/ROLES-PERMISSIONS.md` + `apps/<app>/src/types/UserRole.ts` |
| "Need to find what previous sessions knew" | `read_memory` via insforge-mcp (§13.1) + `decision_log` table + `error_patterns` table |
| "Don't know which doc to read" | §13.9 Quick reference table — maps every need to the right doc file |

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
| Accountin
### 0.9 InsForge — your native grasp toolkit (use it to understand the project fast)

InsForge is a **separate infrastructure** (its own Docker containers + local PostgreSQL `localhost:5432/insforge`) that exists so you can understand this codebase **fast, in your native way** — natural language queries, semantic search, direct DB introspection — instead of grep-reading 100 files. It has 3 components, all in `apps/insforge-infra/`:

| Component | Port | What it does | When to use |
|-----------|------|--------------|-------------|
| **InsForge Gateway** | 7130 | DeepSeek LLM proxy with task-type routing (`code_generation`→reasoner, `quick_answer`→chat, `architect`→reasoner, `debug`→chat). | Automatic — OpenHands routes LLM calls through it. You don't call it directly. |
| **DeepWiki** | 7131 | Vector search over the codebase (pgvector + BAAI/bge-small-en-v1.5 embeddings). Indexes all source files, exposes semantic search + AI Q&A + knowledge graph. | §9 — when you need to find code by concept ("how does trial mode work") in natural language (VN or EN). |
| **InsForge MCP** | (stdio) | 17 tools: DB ops (`query`, `execute`, `create_table`...), migrations, codebase search, **memory** (`read_memory`, `write_memory`), **decision log** (`log_decision`), **error patterns** (`log_error_pattern`). | §10.6 + §10.7 — when you need to introspect DB schema, recall previous session context, or log decisions/errors. |

**InsForge's local PostgreSQL** (`localhost:5432/insforge`, Docker container `insforge-postgres`, separate from Supabase cloud) stores:
- **Business data tables** (mirrors of Supabase cloud schema for local dev/testing): `companies`, `branches`, `users`, `customers`, `transactions`, `transaction_types`, `bank_accounts`, `backup_history`, `color_settings`, `audit_logs`
- **AI metadata tables** (for InsForge MCP tools): `ai_memory` (key-value context store, loaded via `read_memory` at session start), `decision_log` (architecture/tech decisions across sessions), `error_patterns` (errors you've fixed, so you don't re-debug the same issue)

> **Why this matters**: without InsForge, you'd have to grep + read 100 files to understand the project. With it, you `read_memory` (recall context) + DeepWiki search (semantic find) + `describe_table` (DB schema) — 3 calls instead of 100 reads. **This is your native way to grasp the codebase. Use it.**

g | https://accounting.appforyou.xyz |
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

### 1c. Pre-merge verification protocol (MANDATORY after pushing to viet)

**Problem this solves**: Agent pushes to `viet`, claims "deployed to preview, verified" but user sees an OLD version on the preview URL. Root causes observed:
1. **Branch alias `cashflow-git-viet-...` is NOT updated immediately** when deploy becomes READY — `aliasAssigned` can be null for several minutes after `readyState: READY`. User visits the alias → gets the PREVIOUS deployment.
2. **Project is PRIVATE** → branch alias `cashflow-git-viet-...` redirects to Vercel SSO login page. User sees a login page, not the app — thinks "it's broken/old".
3. **Each push creates a UNIQUE preview URL** (`cashflow-<hash>-...`) — the branch alias is stable but lags. The direct deployment URL is immediate but changes every push.
4. Agent verifies on an OLD bookmarked preview URL instead of the latest one.

**Protocol** (run ALL steps before reporting "verified on preview"):

1. **Find the LATEST preview deployment URL** (not the branch alias):
   ```bash
   # Via Vercel API — returns the actual deployment URL with commit metadata
   curl -s "https://api.vercel.com/v6/deployments?app=<app-name>&teamId=$VERCEL_TEAM_ID&limit=5" \
     -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "
   import json, sys
   d = json.load(sys.stdin)
   for dep in d.get('deployments', []):
       meta = dep.get('meta') or {}
       ref = meta.get('githubCommitRef', '?')
       sha = (meta.get('githubCommitSha') or '')[:7]
       state = dep.get('readyState', '?')
       target = dep.get('target') or 'preview'
       url = dep.get('url', '?')
       if ref == 'viet' and state == 'READY':
           print(f'LATEST VIET PREVIEW: {url} (commit={sha})')
           break
   "
   ```
   - Use the **direct deployment URL** (`cashflow-<hash>-...`), NOT the branch alias (`cashflow-git-viet-...`).
   - The branch alias may lag by several minutes or redirect to SSO for private projects.

2. **Wait for the deployment to be READY**:
   ```bash
   npx vercel inspect --token "$VERCEL_TOKEN" <deployment-url>
   # Wait until status shows "Ready" (not "Queued"/"Building")
   ```

3. **Verify the deployment is from the correct commit**:
   - Check `githubCommitSha` in the deployment metadata matches your latest push.
   - Check `githubCommitRef` is `viet`.
   - If commit SHA doesn't match → you're looking at an old deployment → re-run step 1.

4. **Browser-verify the direct deployment URL** (NOT production, NOT branch alias):
   - `browser_navigate` to `https://<deployment-url>` (the `cashflow-<hash>-...` URL)
   - `browser_screenshot` — attach to report
   - Test the specific feature changed
   - If feature not visible → DO NOT report done

5. **Report with evidence**:
   - "Verified preview at `https://cashflow-<hash>-...` (commit `<sha>` on viet) — [feature] works" + screenshot
   - NEVER report "verified on preview" using the branch alias URL — it may be stale or redirect to SSO.
   - NEVER report "verified on preview" without confirming the commit SHA matches.

**If user reports "preview shows old version"**:
1. Check if the branch alias `aliasAssigned` timestamp is newer than `readyAt` — if not, alias hasn't updated yet.
2. Give the user the **direct deployment URL** (`cashflow-<hash>-...`), not the branch alias.
3. If project is private, user must be logged into Vercel to access preview URLs.
4. Verify the preview bundle contains the fix: `curl -s https://<deployment-url>/assets/<chunk>.js | grep "<pattern>"`

### 1d. Post-merge verification protocol (MANDATORY after claiming "merged to main")

**Problem this solves**: OpenHands claims "pushed to viet, merged to main, deployed" but user sees no change on production. Root causes observed:
1. OpenHands reports "merged" before Vercel deploy finishes → user visits stale production
2. Browser caches old JS chunks (4h `max-age`) → user sees old UI even after deploy
3. Squash merge creates new commit hash → `git log main | grep <commit>` fails → OpenHands wrongly reports "not merged"
4. OpenHands skips browser verification → no evidence fix is actually live

**Protocol** (run ALL steps before reporting "deployed to production"):

1. **Verify merge actually happened** (don't rely on commit hash — squash changes it):
   ```bash
   git diff origin/main origin/viet -- <changed-files> | wc -l   # Should be 0
   ```

2. **Wait for Vercel production deploy READY**:
   ```bash
   npx vercel ls --token "$VERCEL_TOKEN" <app-name> --environment production
   # Wait until latest deployment shows "Ready" (not "Queued"/"Building")
   ```

3. **Browser-verify production URL** (NOT preview):
   - `browser_navigate` to `https://<app>.appforyou.xyz`
   - `browser_screenshot` — attach to report
   - `browser_get_content` or interact with the specific feature changed
   - If feature not visible → **DO NOT report done**. Check:
     - Is deploy actually READY? (step 2)
     - Is browser loading cached version? (check `index-*.js` hash in page source vs latest deploy)
     - Did the fix actually change UI? (some fixes are logic-only, no visual change)

4. **Verify cache headers** (after vercel.json cache fix):
   ```bash
   curl -sI "https://<app>.appforyou.xyz/" | grep -i cache-control
   # index.html should be: no-cache, no-store, must-revalidate
   curl -sI "https://<app>.appforyou.xyz/assets/<chunk>.js" | grep -i cache-control
   # JS chunks should be: public, max-age=31536000, immutable
   ```

5. **Report with evidence**:
   - "Verified production at https://<app>.appforyou.xyz — [feature] works" + screenshot
   - "Vercel deploy READY: <deploy-url>"
   - "Cache headers: index.html no-cache, chunks immutable"
   - NEVER report "deployed" without steps 1-4

**If user reports "don't see change"**:
1. Ask user to hard-refresh (Ctrl+Shift+R) or try incognito — bypasses browser cache
2. Verify production bundle contains the fix: `curl -s https://<app>.appforyou.xyz/assets/<chunk>.js | grep "<pattern>"`
3. If fix NOT in bundle → deploy didn't pick up the change → investigate Vercel build logs
4. If fix IN bundle but user still doesn't see → browser cache issue → user needs hard refresh

## 2. Git + Vercel workflow

When the user asks to deploy, redeploy, or verify a frontend app:

1. `git status --short` to see local changes.
2. `git add <relevant-files>` and `git commit -m "fix: <description>"`.
3. `git push origin viet` → Vercel **auto-deploys preview** (no manual trigger needed).
4. To go to production: create PR `viet` → `main`, wait for CI, merge → Vercel **auto-deploys production** (no manual trigger needed).
5. Wait for `READY` state via `vercel ls --token "$VERCEL_TOKEN" <app-name>` (read-only check, NOT a trigger).
6. Use `browser_navigate` to verify (preview URL after viet push, production URL after main merge).

### RULE: NEVER trigger Vercel deployments via API

**Do NOT call `POST /v13/deployments` or use `forceNewBuild=1` or trigger deploy hooks manually.** This causes:
1. **Vercel free plan limit exhaustion** (100 deployments/day via API → blocked for 24h)
2. **Production alias pollution** (manual deploys from `viet` can be promoted to production by mistake, bypassing the `main` branch gate)
3. **Confusion** (multiple deployments for the same commit, hard to track which is "latest")

**The ONLY correct ways to deploy:**
- Push to `viet` → Vercel auto-deploys preview
- Merge PR `viet` → `main` → Vercel auto-deploys production

**If Vercel auto-deploy doesn't trigger after a push:**
1. Wait 5-10 minutes (GitHub webhook delivery can lag)
2. Check Vercel dashboard → Settings → Git → verify GitHub integration is connected
3. If still no deploy, push an empty commit to retrigger: `git commit --allow-empty -m "chore: retrigger deploy" && git push`
4. **Do NOT** use the Vercel API to force a deployment

**If bundle content doesn't change despite new commits (Turborepo cache hit):**
- This is already fixed via `cache: false` in `turbo.json` + `rm -rf dist .turbo .vercel/cache node_modules/.vite` in Vercel buildCommand
- Do NOT try to "fix" it by triggering more deployments — that just wastes the daily limit

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
4. Restart any missing service (DO NOT use `npm run dev:apps` — it conflicts with systemd services already running on the same ports):
   - **Vite apps** (systemd, NOT npm): `wsl -d Ubuntu -u root -- bash -c "systemctl start vite-admin-portal vite-cashflow vite-inventory-operation vite-sales-operation vite-hr-operation vite-accounting vite-operations-portal"`
   - **Utils server** (systemd): `wsl -d Ubuntu -u root -- bash -c "systemctl start superapp-utils"`
   - **OpenHands**: `bash /home/dev/openhands-ctl.sh start` (or `start-all.bat` from Windows) — see §10.12
   - **Dashboard**: `generate-apps-dashboard.ps1` (Windows)
   - **Docker containers** (auto-start via `restart: unless-stopped`): if stopped, `wsl -d Ubuntu -- bash -c "cd /home/dev/projects/superapp-monorepo && docker compose up -d"`
5. Verify from the Tailscale IP with `curl` and `browser_navigate`.
6. Report the live URLs: `http://<TAILSCALE_HOSTNAME>:8080` (dashboard), `http://<TAILSCALE_HOSTNAME>:3000` (OpenHands).

### 6.1 Vite apps run as systemd services (NOT `npm run dev:apps`)

- Each Vite app has a systemd service: `vite-admin-portal`, `vite-cashflow`, `vite-inventory-operation`, `vite-sales-operation`, `vite-hr-operation`, `vite-accounting`, `vite-operations-portal`.
- Config: `/etc/systemd/system/vite-<app>.service` — `WorkingDirectory=/home/dev/projects/superapp-monorepo/apps/<app>`, `ExecStart=.../node .../vite.js --port <PORT> --host`.
- **DO NOT run `npm run dev:apps`** — it will conflict with systemd services (port already in use → `EADDRINUSE`).
- Status check: `wsl -d Ubuntu -- bash -c "systemctl is-active vite-cashflow vite-admin-portal ..."`
- Restart one app: `wsl -d Ubuntu -u root -- bash -c "systemctl restart vite-cashflow"`
- Logs: `wsl -d Ubuntu -- bash -c "tail -50 /tmp/vite-cashflow.log"`
- `npm run dev:apps` still exists in `package.json` (uses `turbo run dev`) but is **not used in production** — only for one-off manual runs when systemd services are stopped.

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

| Service | Port | Type | Path / Container |
|---------|------|------|-----------------|
| OpenHands | 3000 | Docker | `openhands-app` container (agent-server, not Vite) |
| Admin Portal | 5173 | systemd | `apps/admin-portal` (service `vite-admin-portal`) |
| Cashflow | 5174 | systemd | `apps/cashflow` (service `vite-cashflow`) |
| Inventory Operation | 5175 | systemd | `apps/inventory-operation` (service `vite-inventory-operation`) |
| Sales Operation | 5176 | systemd | `apps/sales-operation` (service `vite-sales-operation`) |
| HR Operation | 5177 | systemd | `apps/hr-operation` (service `vite-hr-operation`) |
| Accounting | 5178 | systemd | `apps/accounting` (service `vite-accounting`) |
| Operations Portal | 3006 | systemd | `apps/operations-portal` (service `vite-operations-portal`) |
| API server | 3001 | Docker | `superapp-api` container (`packages/api`) |
| **Utils server** | **8081** | **systemd** | **`superapp-utils` service** (`/home/dev/projects/openhands-utils-server.js`) — OpenHands management API: conversations, docker prune, disk usage, token logging |
| **InsForge Gateway** | **7130** | **Docker** | **`insforge-gateway`** — DeepSeek LLM proxy (§0.9) |
| **DeepWiki** | **7131** | **Docker** | **`insforge-deepwiki`** — vector search (§0.9, §9) |
| **InsForge PostgreSQL** | **5432** | **Docker** | **`insforge-postgres`** — local DB for InsForge (10 tables, §0.9) |
| **Dashboard** | **8080** | **Windows** | Python HTTP server on Windows (not in repo) |
| **Cloudflare tunnel** | — | Docker | `superapp-tunnel` (optional, disabled via `DISABLE_CLOUDFLARE_TUNNEL=true`) |

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
## 9. Codebase Search — DeepWiki Vector Search (your native way to find code)

> **DeepWiki is part of InsForge** (§0.9) — the agent's native grasp toolkit. It lets you query the codebase in natural language (Vietnamese or English) and get ranked results, instead of grep-reading 100 files.

The repo is large (7 Superapp apps + 1 separate project + 12 packages + 69+ migrations). For fast semantic queries, use **DeepWiki vector search** instead of grep when you need to find code by concept (not by exact string).

### 9.1 DeepWiki container

- **Container**: `insforge-deepwiki` (defined in `docker-compose.yml`, port 7131).
- **Status check**: `docker ps --filter "name=insforge-deepwiki" --format "{{.Names}}: {{.Status}}"`.
- **Index**: built from the monorepo source — embeddings stored in local PostgreSQL (`postgresql://postgres:postgres@host.docker.internal:5432/insforge`).
- **LLM for queries**: DeepSeek (via `DEEPSEEK_API_KEY` env var).

### 9.2 Query syntax (verified working 2026-07-24)

```bash
# From Windows PowerShell or WSL — query the indexed codebase
wsl -d Ubuntu -- bash -c 'docker exec insforge-deepwiki python3 /tmp/dw_search.py "QUERY" N'

# Example: find trial seed system architecture
wsl -d Ubuntu -- bash -c 'docker exec insforge-deepwiki python3 /tmp/dw_search.py "Trial seed system architecture" 15'
```

- `QUERY` — natural language (Vietnamese or English both work).
- `N` — max results to return (default 15, use 3-5 for quick lookup, 15-30 for thorough exploration).

Output format: `[<relevance_score>] <file_path> (<line_count>L) funcs=['<func1>', '<func2>', ...]`

### 9.3 When to use which search tool

```mermaid
flowchart TD
  QUERY[Need to find code] --> TYPE{What are you looking for?}
  TYPE -->|Exact string<br/>symbol name<br/>import path| GREP[grep / find_file_by_name<br/>fast, exact]
  TYPE -->|Concept / behavior<br/>"how does X work"<br/>"where is Y implemented"| DEEPWIKI[DeepWiki vector search<br/>semantic, ranked by relevance]
  TYPE -->|File by name pattern| GLOB[find_file_by_name<br/>glob match]
  GREP --> RESULT1[Exact matches with line numbers]
  DEEPWIKI --> RESULT2[Ranked file list + funcs<br/>may miss rare terms]
  GLOB --> RESULT3[File paths only]
```

| Tool | Best for | Limitation |
|------|----------|-----------|
| `grep` | Exact string, regex, symbol name | No semantic match |
| `find_file_by_name` | File by glob pattern | Content-agnostic |
| DeepWiki `dw_search.py` | "How is X implemented", "where does Y happen" | Needs container running; rare terms may not be indexed |
| `insforge-mcp` `search_codebase` | Same as DeepWiki but via MCP (OpenHands only) | Only available inside OpenHands agent-server |

### 9.4 Re-indexing (when code changes significantly)

The index persists in local PostgreSQL. If you add a new app or rename directories, re-index:

```bash
# Trigger re-index (DeepWiki watches the monorepo path; restart container to force full reindex)
docker restart insforge-deepwiki
# Wait ~1-2 min for index rebuild, then verify:
wsl -d Ubuntu -- bash -c 'docker exec insforge-deepwiki python3 /tmp/dw_search.py "test" 1'
```

### 9.5 Rules

- **Prefer DeepWiki for conceptual queries** ("how does trial mode work", "where is RLS enforced") — faster than grep when you don't know the exact string.
- **Prefer grep for exact matches** (symbol names, error messages, import paths).
- **Always check container is running** before querying: `docker ps --filter "name=insforge-deepwiki"`. If stopped, `docker start insforge-deepwiki` and wait 30s.
- **Combine both**: use DeepWiki to find candidate files, then grep within those files for exact lines.
- **Do NOT rely on DeepWiki for secrets/env values** — `.env` files are not indexed (correctly excluded).

## 10. OpenHands + InsForge Integration (verified 2026-07-24)

> InsForge (§0.9) is wired into OpenHands so the agent can use it natively: MCP server for DB tools + memory, DeepWiki for vector search, Gateway for LLM routing. This section documents the actual integration.

OpenHands agent-server has been tuned with several enhancements beyond defaults. Config lives in `C:\Users\Lenovo ThinkBook 14\CascadeProjects\openhands\openhands-settings.json` (NOT in this repo — do NOT edit from inside WSL/sandbox).

### 10.1 LLM profiles + model switching

```mermaid
flowchart LR
  TASK[User task] --> ACTIVE{Active profile}
  ACTIVE -->|default| V3[deepseek-v3<br/>deepseek-chat<br/>fast, cheap, 1M ctx]
  ACTIVE -->|switch_llm_tool| R1[deepseek-r1<br/>deepseek-reasoner<br/>strong reasoning]
  V3 --> COMPLEX{Complex task?<br/>agent decides}
  COMPLEX -->|Yes| SWITCH[switch_llm_tool → r1]
  COMPLEX -->|No| STAY[stay on v3]
  SWITCH --> RUN_R1[run with R1]
  STAY --> RUN_V3[run with V3]
  RUN_R1 --> DONE
  RUN_V3 --> DONE
```

- **2 profiles** defined in `llm_profiles` (in `openhands-settings.json`):
  - `deepseek-v3` (active by default) — `deepseek/deepseek-chat`, fast/cheap, 1M context.
  - `deepseek-r1` — `deepseek/deepseek-reasoner`, strong reasoning for complex tasks (SQL, architecture, debugging).
- **`enable_switch_llm_tool: true`** — agent can switch profile mid-task via `switch_llm_tool` when it detects the task needs stronger reasoning.
- Both profiles have `caching_prompt: true` + `prompt_cache_retention: 24h` (see §10.2).
- `max_iterations: 500` per conversation (NOT 50 — the 50 in `.env` is overridden by settings.json).
- **Startup script** (`start-openhands-wsl.sh`): sets `LLM_MODEL=deepseek/deepseek-chat` (V3, matches settings.json default). Agent auto-switches to R1 via `switch_llm_tool` when needed. **Fixed 2026-07-24** — was previously hardcoded to `deepseek-reasoner` (R1, slower + 2x cost); now V3 for fast/cheap default.

### 10.2 Context cache (prompt caching)

- **`caching_prompt: true`** on both LLM profiles — DeepSeek API caches prompt prefix.
- **`prompt_cache_retention: 24h`** — cache valid for 24 hours.
- **Effect**: repeated system prompt + tool descriptions + early conversation = ~50% token cost reduction on subsequent turns.
- **Implication for agents**: keep the system prompt stable across turns (don't rewrite it). Long sessions benefit most.

### 10.3 Context condenser (LLM summarization)

```mermaid
flowchart LR
  CONV[Conversation grows] --> CHECK{History > max_size 240?}
  CHECK -->|No| KEEP[Keep full history]
  CHECK -->|Yes| CONDENSE[LLM summarizing condenser]
  CONDENSE --> KEEP_FIRST[Keep first 2 messages<br/>system + first user]
  CONDENSE --> SUMMARIZE[Summarize middle<br/>LLM compresses to ~10%]
  CONDENSE --> KEEP_RECENT[Keep recent messages]
  KEEP_FIRST --> MERGE[Merged context]
  SUMMARIZE --> MERGE
  KEEP_RECENT --> MERGE
  MERGE --> CONTINUE[Continue with compressed context]
```

- **`condenser.enabled: true`**, `condenser_kind: llm_summarizing`.
- **`max_size: 240`** (tokens/messages) — when history exceeds this, condenser triggers.
- **`keep_first: 2`** — always preserve system prompt + first user message.
- **`minimum_progress: 0.1`** — don't condense if progress < 10% (avoid losing fresh context).
- **Effect**: long conversations stay coherent without hitting context window limit. Agent can run 500 iterations without running out of context.

### 10.4 Sub-agents

- **`enable_sub_agents: true`** — OpenHands can spawn sub-agents for parallel/sub-tasks.
- **`tool_concurrency_limit: 1`** — but only 1 tool call at a time per agent (sequential within an agent; sub-agents run in parallel).
- Use case: split a large task into sub-agents (e.g. one writes backend, one writes frontend) — see `.openhands_instructions` §11 Multi-Agent Swarm.

### 10.5 Task Splitter (dashboard feature)

- **Location**: Apps Dashboard (`http://<TAILSCALE_IP>:8080/apps-dashboard.html`) → "Task Splitter" button.
- **Purpose**: user pastes a large task → DeepSeek-chat splits into 3-6 subtasks → user copies each subtask to OpenHands.
- **Why**: `MAX_ITERATIONS=50` per conversation means a single huge task will hit the limit. Splitting into 5-8 iteration subtasks ensures completion.
- **API**: `POST /api/proxy/task-split` (proxied server-side via `dashboard-server.py` to keep DeepSeek API key off the browser).
- **Token tracking**: dashboard shows "Da dung (Task Splitter)" — DeepSeek token usage from Task Splitter is tracked; OpenHands agent calls are NOT tracked here (separate billing).

### 10.6 InsForge Agent Protocol (system_message_suffix)

The `agent_context.system_message_suffix` in `openhands-settings.json` injects a mandatory protocol into every OpenHands session. **All 6 rules below are enforced**:

1. **`read_memory` at session start** (no key) — load context from previous sessions before doing anything.
2. **`log_decision`** when making architecture/tech decisions — title, context, decision, alternatives, consequences, tags.
3. **`log_error_pattern`** when fixing errors — error_type, error_message, file_path, fix_description, fix_code.
4. **`write_memory`** when discovering useful project context — descriptive key (e.g. `cashflow.schema`), category.
5. **`list_tables` + `describe_table` + `search_codebase`** before writing SQL or touching DB.
6. **Prefer `search_codebase` (semantic)** over guessing when asked about the codebase.

**Forbidden** (also enforced in protocol):
- `execute` with `confirm: true` without explicit user approval.
- `drop_table` without explicit user confirmation.
- Logging trivial decisions.
- Skipping `read_memory` at session start — "context recall is the whole point".

### 10.7 MCP servers (actual, not aspirational)

```mermaid
flowchart TD
  OH[OpenHands agent-server] --> MCP{MCP config}
  MCP --> SUPA[supabase MCP<br/>@supabase/mcp-server-supabase<br/>access-token + project-ref]
  MCP --> VER[vercel MCP<br/>https://mcp.vercel.com<br/>Bearer VERCEL_TOKEN]
  MCP --> FS[filesystem MCP<br/>@modelcontextprotocol/server-filesystem<br/>/workspace]
  MCP --> INS[insforge MCP<br/>packages/insforge-mcp/index.mjs<br/>DB_URL + DEEPWIKI_URL]
  SUPA --> SB[(Supabase cloud<br/>peslmsctejmvkwzyohke)]
  VER --> VERC[Vercel deployments]
  FS --> WKSP[/workspace/project/]
  INS --> LOCAL[(local PostgreSQL<br/>localhost:5432/insforge)]
  INS --> DW[DeepWiki<br/>host.docker.internal:7131]
```

4 MCP servers configured (NOT 7 as old `.openhands_instructions` claimed):
- `supabase` — stdio, `@supabase/mcp-server-supabase` with access token + project ref.
- `vercel` — SSE, `https://mcp.vercel.com` with Bearer token.
- `filesystem` — stdio, `@modelcontextprotocol/server-filesystem` exposing `/workspace`.
- `insforge` — stdio, `packages/insforge-mcp/index.mjs` with `DB_URL` + `DEEPWIKI_URL` env.

### 10.8 Security analyzer

- **`security_analyzer: llm`** — LLM-based security analyzer reviews code changes for vulnerabilities.
- Runs as part of the agent loop (not a separate step).

### 10.9 Sandbox grouping

- **`sandbox_grouping_strategy: GROUP_BY_NEWEST`** — new conversations reuse the newest sandbox container (faster startup, preserves recent state).
- **`confirmation_mode: false`** — agent does NOT ask for confirmation before each action (autonomous mode). Destructive ops still ask per `AGENTS.md` §5.

### 10.10 Rules

- **Do NOT edit `openhands-settings.json` from inside WSL/sandbox** — it lives on Windows at `C:\Users\Lenovo ThinkBook 14\CascadeProjects\openhands\`. Edit from Windows side, then restart OpenHands via `bash /home/dev/openhands-ctl.sh restart` (§10.12).
- **`max_iterations: 500`** is the real limit (settings.json overrides `.env`'s 50). Plan tasks to fit in 500 iterations or use Task Splitter.
- **`read_memory` at session start is mandatory** — do not skip even if you think you have enough context.
- **Log decisions and error patterns** — they persist in local PostgreSQL (`ai_memory`, `decision_log`, `error_patterns` tables) and are loaded by next session's `read_memory`.
- **Context cache is automatic** — don't rewrite system prompt mid-session; let the cache work.
- **Condenser is automatic** — don't manually summarize; let it trigger at `max_size: 240`.
- **Sub-agents run in parallel but tools are sequential** (`tool_concurrency_limit: 1`) — don't expect concurrent tool calls within one agent.

### 10.11 Sandbox network topology (verified 2026-08-02)

You are running inside a **Docker sandbox container** on **WSL2** with **native Docker Engine** (NOT Docker Desktop). Understanding the network layout is critical for reaching host services.

```
┌─────────────────────────────────────────────────────────┐
│  Windows Host (Tailscale IP: 100.106.8.61)              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  WSL2 (Ubuntu) — Docker Engine native             │  │
│  │  docker0 bridge gateway: 172.17.0.1               │  │
│  │                                                   │  │
│  │  ┌──────────────┐   ┌──────────────────────────┐  │  │
│  │  │ openhands-app │   │ Sandbox (YOU are here)   │  │  │
│  │  │ 172.17.0.3    │   │ 172.17.0.4              │  │  │
│  │  │ port 3000     │   │ /workspace/project/      │  │  │
│  │  └──────────────┘   └──────────────────────────┘  │  │
│  │  ┌──────────────┐   ┌──────────────┐              │  │
│  │  │ superapp-api │   │ insforge-pg  │              │  │
│  │  │ 172.18.0.3   │   │ 172.18.0.2   │              │  │
│  │  │ port 3001    │   │ port 5432    │              │  │
│  │  └──────────────┘   └──────────────┘              │  │
│  │  Vite apps (host, not Docker):                     │  │
│  │    5173 (admin) 5174 (cashflow) 5175 (inventory)   │  │
│  │    5176 (sales) 5177 (hr) 5178 (accounting)        │  │
│  │    3006 (ops) 3001 (api) 8081 (utils)              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**`host.docker.internal` resolves to `172.17.0.1`** (docker0 bridge gateway = WSL host). This lets you reach ALL host services from inside the sandbox:

| Service | URL from sandbox | Notes |
|---------|------------------|-------|
| OpenHands app | `http://host.docker.internal:3000` | The app server that manages you |
| Superapp API | `http://host.docker.internal:3001` | Fastify API (may return 503 if DB down) |
| Postgres (local) | `host.docker.internal:5432` | `insforge-postgres` container |
| Vite apps | `http://host.docker.internal:5173-5178,3006` | systemd services on WSL host |
| Utils server | `http://host.docker.internal:8081` | systemd service |
| InsForge Gateway | `http://host.docker.internal:7130` | DeepSeek proxy (Docker) |
| DeepWiki | `http://host.docker.internal:7131` | Vector search (Docker) |

**DO NOT** use `localhost:3001` from sandbox — `localhost` inside sandbox is the sandbox itself, not the host. Always use `host.docker.internal:<port>`.

**Test reachability**:
```bash
curl -s http://host.docker.internal:3001/health --max-time 5
curl -s http://host.docker.internal:5174/ --max-time 5  # cashflow Vite
```

### 10.12 Native Docker Engine (no Docker Desktop)

As of 2026-08-02, WSL2 runs **Docker Engine natively** (not Docker Desktop integration). This is more stable — no more socket breakage on WSL restart.

- **Docker socket**: `/var/run/docker.sock` (native, systemd-managed)
- **Control plane**: `openhands-ctl.sh` at `/home/dev/openhands-ctl.sh` (NOT `start-openhands-wsl.sh` which was deleted)
- **Commands**: `bash /home/dev/openhands-ctl.sh start|stop|restart|status`
- **Image**: `openhands-agent-server-with-node:latest` (entrypoint = `openhands-agent-server` binary)
- **Sandbox spec**: privileged mode + docker.sock mount + `host.docker.internal: host-gateway`

### 10.13 Vercel deploy from sandbox

**Deploy from monorepo root, NOT from `apps/<app>/`** — Vercel project settings have `rootDirectory: apps/<app>` configured, so it auto-detects.

```bash
cd /workspace/project  # monorepo root
vercel deploy --token $VERCEL_TOKEN --yes
# Vercel picks the project based on .vercel/project.json in monorepo root
```

**`.vercel/project.json`** exists at monorepo root AND each `apps/<app>/.vercel/`. The monorepo root one is used for `vercel deploy` from root.

**Known issue**: `vercel ls` shows warning "Your Project was either deleted" — this is a Vercel CLI 57.0.0 bug, deployments still work. Upgrade CLI or ignore the warning.

**Deploy from specific app** (alternative):
```bash
cd /workspace/project/apps/cashflow
vercel deploy --token $VERCEL_TOKEN --yes
# But this may fail with "path does not exist" if rootDirectory is set in Vercel dashboard
```

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

## 11. Project status & next steps (inferred 2026-07-24)

> **Source**: inferred from `git log`, `apps/<app>/docs/CHANGELOG.md`, and TODO/FIXME scan. **Not authoritative** — confirm with user before starting major work.

### 11.1 What's done (recent milestones)

| When | What | Commit |
|------|------|--------|
| 2026-07-24 | Rules consolidation: AGENTS.md §8-§10, `.openhands_instructions` dedup | `9207c025` |
| 2026-07-24 | Full documentation set attempted (12 files × 7 apps) + 9 root docs; status partially stale as of 2026-08 | `991a3d82` |
| 2026-07-23 | Sentry error tracking wired across all 7 Superapp apps | `4ecb5830` |
| 2026-07-22 | Vite 4 → 8 + plugin-react 4 → 6 + @types/react 18 → 19 (5 apps) | `978d0fda` |
| 2026-07-22 | `nguoi_dai_dien` field added to customers (migration + type + forms + bulk import) | `9ba47de0`–`ac1b68b6` |
| 2026-07-21 | CompanyBadge component showing company context across all 7 Superapp apps + RLS fix | `05330cd8`, `95334d65` |
| 2026-07-20 | Bulk import: 200 → 2000 rows, Vietnamese column headers, phone optional, mobile AddButton | `f0ad459b`–`ab24c577` |
| 2026-07-19 | AppSwitcher env-aware URL routing (production vs dev) | `7606affd` |
| 2026-07-18 | Phase 1-6 architecture enhancements: RLS, cross-app auth, monorepo standardization | `41ed5982` |
| 2026-07-15 | Trial mode services refactored to use data adapter (shared logic) | `90aa4034`–`2fec11ed` |

### 11.2 Known TODOs (from code scan — 28 total)

| App | TODOs | Theme |
|-----|-------|-------|
| sales-operation | 13 | `varianceReportingService` Supabase calls not implemented; `created_by`/`updated_by` hardcoded to `'current-user'` (should come from auth); `ProductBulkImportEnhanced` actual DB import not implemented; `SalesOrderCreatePage` missing form + DataGrid |
| inventory-operation | 11 | Same `varianceReportingService` + `created_by`/`updated_by` + `ProductBulkImportEnhanced` pattern (shared with sales) |
| cashflow | 2 | Email service not configured (CreateUserModal); monitoring service not configured (errorHandling.ts — but Sentry is wired, so this TODO may be stale) |
| accounting | 2 | Same email + monitoring TODOs as cashflow |
| admin-portal, hr-operation, operations-portal | 0 | — |

**Top 3 unfinished features (by impact)**:
1. **`varianceReportingService`** (sales + inventory, 8 TODOs) — Supabase calls stubbed, not implemented. Affects variance reporting UI.
2. **`ProductBulkImportEnhanced`** (sales + inventory, 4 TODOs) — actual DB import not wired (UI exists, backend missing).
3. **`SalesOrderCreatePage`** (sales, 2 TODOs) — page is a placeholder, missing `SalesOrderForm` + DataGrid.

### 11.3 Suggested next steps (priority order — confirm with user)

1. **Wire `created_by`/`updated_by` to real auth** (sales + inventory, 6 TODOs) — small change, replace `'current-user'` with `useAuth().user.id`. Quick win.
2. **Implement `varianceReportingService` Supabase calls** (sales + inventory, 8 TODOs) — medium effort, unblocks variance reporting feature.
3. **Wire `ProductBulkImportEnhanced` to DB** (sales + inventory, 4 TODOs) — medium effort, completes bulk import feature.
4. **Build `SalesOrderCreatePage`** (sales, 2 TODOs) — larger effort, new form + DataGrid.
5. **Stale TODO cleanup** — verify if cashflow/accounting email + monitoring TODOs are still relevant (Sentry is wired, so monitoring TODO may be obsolete).

### 11.4 Documentation status

- App docs: every Superapp app now has the standard 12-file doc set (`OVERVIEW`, `PRD`, `ARCHITECTURE`, `DATA-MODEL`, `DATA-FLOW`, `FLOWS`, `API`, `UI-UX`, `ROLES-PERMISSIONS`, `RUNBOOK`, `AI-CONTEXT`, `CHANGELOG`). `framework-method` docs remain in `apps/framework-method/docs/`.
- Root docs cover the 7-app Superapp scope. Remaining root doc gaps (`CODING-STANDARDS.md`, `DATABASE-SCHEMA.md`, `AUTH-AND-RBAC.md`, `TRIAL-SYSTEM.md`, `DATA-MIGRATION.md`, `DEV-ENVIRONMENT.md`) can be created from the `docs/NEW-APP-TEMPLATE/` skeleton or root `docs/README.md`.
- ✅ Rules consolidated (AGENTS.md §0-§13 + `.openhands_instructions`).
- ⚠️ CHANGELOG `[Unreleased]` sections only mention "Full documentation set" — should be updated with actual feature changes when next version is cut.

## 12. Improvement history (don't reinvent)

> **Why this section exists**: past sessions have made significant architectural improvements. If you don't know about them, you might re-implement (waste) or break them (regression). This is a condensed log — see `git log` for full history.

### 12.1 Architecture improvements

| Improvement | What it did | Don't undo |
|-------------|-------------|------------|
| **RLS + `company_id` multi-tenancy** (`002_rls_policies.sql`, `006_multi_tenancy_company_id.sql`) | All tenant-scoped tables have `company_id` + RLS policy `USING (company_id = jwt.company_id)`. Single schema, not schema-per-tenant. | Don't create `tenant_<id>.` schemas. Don't add tables without `company_id` + RLS. |
| **`@superapp/iam` shared auth** | `AuthProvider` + `CompanyProvider` in `packages/iam` — used by all 7 Superapp apps. Replaces per-app auth. | Don't create new auth context in apps. Use `useAuth()`, `useCompany()` from `@superapp/iam`. |
| **`@superapp/shared-utils` BaseService pattern** | Transaction, customer, bank account, branch, transaction type services extend `BaseService` from `@superapp/shared-utils`. | Don't re-implement business logic in apps. Check `@superapp/shared-utils` first. |
| **Trial mode data adapter** | Trial mode services use data adapter pattern — same UI works with both real Supabase and trial seed data. | Don't bypass the adapter. See `AGENTS.md` Trial Seed System. |
| **AppSwitcher env-aware routing** (`7606affd`) | App switcher detects production vs dev and routes to `appforyou.xyz` vs `localhost:PORT`. | Don't hardcode URLs in app switcher. |
| **CompanyBadge across all 7 Superapp apps** (`05330cd8`) | Shows current company context in header of every app. RLS-fixed (`95334d65`). | Don't remove CompanyBadge. Don't query `companies` table without RLS context. |
| **Sentry error tracking** (`4ecb5830`) | Wired across all 7 Superapp apps. Errors flow to Sentry org `viet-duc`. | Don't remove Sentry. Don't add try/catch that swallows errors silently. |
| **Vite 8 + React 18 + TypeScript 5.8** (`978d0fda`, `docs-alignment`) | Standardized across all packages. | Don't add React 19 / TS 6 dependencies. Use React 18 patterns. |
| **Bulk import 2000 rows + Vietnamese headers** (`f0ad459b`, `df035cdf`) | Increased limit 200→2000, added Vietnamese column header mapping. | Don't reduce limit. Don't assume English-only headers. |

### 12.2 Dev environment improvements

| Improvement | What it did | Don't undo |
|-------------|-------------|------------|
| **WSL2 as dev host** | Vite + API run on WSL2, not in Docker sandbox. Code edited in sandbox → HMR on WSL. | Don't run Vite in sandbox (RULE 1). |
| **Tailscale remote access** | Phone/laptop access dev apps via Tailscale IP. Dashboard at `:8080`. | Don't break Tailscale daemon on Windows. |
| **InsForge infrastructure** (`apps/insforge-infra/`, renamed from `superapp-unified-bot` 2026-07-24) | 3 components: Gateway (LLM routing, port 7130) + DeepWiki (vector search, port 7131) + local PostgreSQL (business data + AI metadata tables: ai_memory, decision_log, error_patterns). Helps agent grasp codebase in native way — see §0.9. | Re-index DeepWiki after major changes (`docker restart insforge-deepwiki`). Don't confuse with Supabase cloud (apps backend) — InsForge is separate. |
| **InsForge MCP** (`packages/insforge-mcp`) | 17 tools: DB ops, migrations, codebase search, memory, decision log, error patterns. Wired into OpenHands as MCP server (§10.7). | Don't use raw SQL when an MCP tool exists. Always `read_memory` at session start. |
| **OpenHands agent enhancements** (see §10) | LLM profiles, context cache, condenser, sub-agents, Task Splitter, InsForge Agent Protocol. | Don't edit `openhands-settings.json` from WSL. Don't skip `read_memory`. |
| **NetNat recovery procedure** (§8) | Documented recovery after `winnat` restart deletes NetNat rule. | Don't restart `winnat` without recreating NetNat. |


### 12.2 Inventory + Sales are near-clones (2026-07-25 audit)

**Finding**: `apps/inventory-operation/src/` and `apps/sales-operation/src/` share 207 of 207+ files. **121 files are byte-identical** (58% of src/), 86 differ only in branding (app name "Inventory Operation" vs "Sales Operation", Vietnamese title, sidebar width, accent color). No files are unique to either app.

**Implication for agents**:
- **When you fix a bug or add a feature in inventory-operation, CHECK sales-operation** — the same code likely exists there too. Use `diff apps/inventory-operation/src/<path> apps/sales-operation/src/<path>` to confirm.
- **Sync both apps in the same PR** unless the change is inventory-specific (e.g. stock movements) or sales-specific (e.g. POS checkout).
- **Do NOT assume they're fully independent** — a fix in one without syncing the other creates drift that future agents won't notice.

**Identical files include** (sample, full list via `diff -rq apps/inventory-operation/src/ apps/sales-operation/src/`):
- `components/auth/*` (LoginForm, ProtectedRoute, PermissionGuard, etc.)
- `components/Dashboard/FeaturedProducts.tsx`, `InventoryWaterfallChart.tsx`
- `components/Import/*` (BulkImport, ProductBulkImportEnhanced, ProductImportGrid)
- `components/UI/*` (AddButton, ErrorFallback, LoadingFallback, PartnerQuickAddModal)
- `hooks/*` (useAuth, useInventory, usePermissions, useProductCatalog, useProducts, useSales)
- `lib/trialClient.ts`, `config/supabase.ts`
- `data/*` (mockData, realInventoryData, realProductsData, realSalesData, trialMockData)
- `pages/Auth/*`, `pages/CompanySelector/*`, many pages/*

**Different files (86) are branding tweaks**:
- `App.tsx`, `components/Layout/{Layout,Navigation,Sidebar,BottomTabBar}.tsx` — app name, title, sidebar width
- `components/{ImportExport/ImportExportPage,EditableDataGrid}.tsx` — large files with mixed logic + branding
- `pages/*` — some inventory-specific (InventoryInputPage, InventoryMRPPage) vs sales-specific (SalesOrderPage, POSPage)

**Future refactor opportunity** (not done yet — risk vs scope):
- Extract 121 identical files into `packages/inventory-sales-shared/` (or `@superapp/ops-shared`)
- Parameterize 86 different files via props/env (appName, accentColor, sidebarWidth)
- Update ~207 imports in each app
- This is a large refactor — do in a dedicated PR with full test coverage, NOT as part of a cleanup batch.

**Why we didn't extract in the 2026-07-25 cleanup**: risk of breaking 2 production apps at once, scope too large for a single cleanup pass, and pre-existing React Router type errors indicate the codebase needs stabilization first.

## 13. Documentation Discipline — Read, Grep, Document (MANDATORY)

> **Why this section exists**: Past sessions skipped docs entirely — coded blind, then left stale docs behind. New sessions started from scratch every time, re-discovering what previous sessions already knew. This section fixes that by making doc-reading and doc-writing **mandatory habits**, not optional.

### 13.1 Session start protocol — ALWAYS do this first (3 min, not optional)

Before writing any code, every session MUST:

1. **Read AGENTS.md §0** (this file, first 108 lines) — 60s. Gives you project overview, 7 Superapp apps, 12 packages, stack, read order.
2. **Read the relevant app docs** — 2 min:
   - If task involves a specific app → `apps/<app>/docs/AI-CONTEXT.md` (fallback to `CHANGELOG.md` if missing)
   - If cross-app → `docs/ARCHITECTURE.md` + `docs/PROJECT_CONTEXT.md`
3. **Call `read_memory` via insforge-mcp** (§10.6) — loads context from previous sessions. If no memory exists yet, this is your first session — proceed but start writing memory.
4. **Grep docs for keywords related to your task** — see §13.2 below.

**Do NOT skip this.** Skipping = coding blind = re-discovering what previous sessions already knew = wasted time + duplicated effort + inconsistent changes.

### 13.2 Grep docs before coding — MANDATORY pattern

Before touching any code, grep the docs for keywords related to your task. This tells you what's already documented (and likely already implemented):

```bash
# Example: task is "add export feature to cashflow"
# 1. Grep root docs
grep -ri "export" docs/ --include="*.md" -l

# 2. Grep app-specific docs
grep -ri "export" apps/cashflow/docs/ --include="*.md" -l

# 3. Grep all app docs (cross-app patterns)
grep -ri "export" apps/*/docs/ --include="*.md" -l

# 4. Grep AI-CONTEXT files (densest context per app)
grep -ri "export" apps/*/docs/AI-CONTEXT.md

# 5. Grep CHANGELOGs (what was recently changed?)
grep -ri "export" apps/*/docs/CHANGELOG.md
```

**Why**: Docs often mention features that are already implemented, half-done, or planned. If you don't check, you'll either re-implement or contradict existing design.

### 13.3 Document after every change — MANDATORY update list

After making code changes, you MUST update the relevant docs **in the same commit**. This is not optional — stale docs are worse than no docs because they mislead the next session.

| What you changed | Which docs to update |
|-------------------|---------------------|
| New feature / page / component | `apps/<app>/docs/OVERVIEW.md` (or `AI-CONTEXT.md` if `OVERVIEW.md` missing) + `apps/<app>/docs/CHANGELOG.md` (add entry) |
| API endpoint added/changed | `apps/<app>/docs/API.md` + `docs/DATABASE-SCHEMA.md` if DB changed |
| Database schema (migration) | `docs/DATABASE-SCHEMA.md` (create if missing) + `apps/<app>/docs/DATA-MODEL.md` + `supabase/migrations/` (the migration itself) |
| Auth/RLS/permissions | `docs/PROJECT_CONTEXT.md` / `docs/ARCHITECTURE.md` + `apps/<app>/docs/ROLES-PERMISSIONS.md` |
| UI/UX change (layout, flow) | `apps/<app>/docs/UI-UX.md` + `apps/<app>/docs/FLOWS.md` if user flow changed |
| Shared package (`packages/*`) | `docs/ARCHITECTURE.md` § "Shared packages" + the package's own `README.md` |
| Architecture decision (tech choice, pattern) | `docs/ARCHITECTURE.md` + call `log_decision` via insforge-mcp (§10.6) |
| Bug fix (non-trivial) | `apps/<app>/docs/CHANGELOG.md` + call `log_error_pattern` via insforge-mcp (§10.6) |
| Environment/config change | `docs/DEV-ENVIRONMENT.md` + `apps/<app>/docs/RUNBOOK.md` if it affects ops |
| New dependency added | `apps/<app>/docs/ARCHITECTURE.md` (tech stack section) + `package.json` |
| Refactor (file moves, renames) | `apps/<app>/docs/ARCHITECTURE.md` (directory structure) |

**Rule of thumb**: If a new session would need to know about your change to understand the project, document it. If you're unsure whether to document — document. Over-documenting is cheap; under-documenting is expensive.

### 13.4 Document new findings — even if you didn't change code

When you discover something non-obvious about the codebase (a quirk, a pattern, a gotcha, a hidden dependency), you MUST record it:

1. **If it's a reusable architectural insight** → call `log_decision` via insforge-mcp with `title`, `context`, `decision`, `tags`.
2. **If it's an error you debugged and fixed** → call `log_error_pattern` via insforge-mcp with `error_type`, `error_message`, `fix_description`.
3. **If it's general project context** (e.g. "inventory and sales share 121 identical files") → call `write_memory` via insforge-mcp with a descriptive key like `inventory-sales-shared-files`.
4. **If it's important enough for future agents to see immediately** → also add it to `AGENTS.md` §12 (Improvement history) or the relevant `apps/<app>/docs/AI-CONTEXT.md`.

**Why**: Next session calls `read_memory` at start (§13.1 step 3) and gets your findings instantly. Without this, they re-discover everything from scratch.

### 13.5 CHANGELOG format — every app, every change

Each `apps/<app>/docs/CHANGELOG.md` follows this format:

```markdown
## [Unreleased]

### Added
- New feature X for Y purpose

### Changed
- Refactored Z to use shared BaseService pattern

### Fixed
- Bug: RLS policy missing on table X (was leaking cross-tenant data)

### Deprecated
- Old API endpoint /api/v1/old-thing (replaced by /api/v2/thing)
```

**Update the `[Unreleased]` section with every commit.** When a version is cut (deployed to production), move `[Unreleased]` → `[v1.2.3 — 2026-08-01]` and start a new `[Unreleased]`.

### 13.6 AI-CONTEXT.md — the "densest context" file

Each `apps/<app>/docs/AI-CONTEXT.md` is the **single most important file for a new session**. It should contain:

- **What this app does** (1 paragraph)
- **Key files and their roles** (table: file → responsibility)
- **Data model summary** (main tables, relationships)
- **Current state** (what works, what's stubbed, what's TODO)
- **Gotchas** (non-obvious things a new agent would trip on)
- **Cross-app dependencies** (what this app imports from other apps/packages)

**When you change code, update AI-CONTEXT.md too.** This file is what §13.1 step 2 tells the next session to read — if it's stale, the next session starts with wrong context.

### 13.7 Doc quality checklist — before every commit

Before `git commit`, verify:

- [ ] Did I read the relevant docs before coding? (§13.1)
- [ ] Did I grep docs for keywords related to my task? (§13.2)
- [ ] Did I update all docs affected by my change? (§13.3 table)
- [ ] Did I log new findings to insforge-mcp memory/decision_log/error_patterns? (§13.4)
- [ ] Did I update the app's CHANGELOG.md `[Unreleased]` section? (§13.5)
- [ ] Did I update the app's AI-CONTEXT.md if key files/state changed? (§13.6)

If any answer is "no" — go back and do it. A commit with stale docs is incomplete.

### 13.8 What NOT to document (avoid doc bloat)

- **Trivial changes**: typo fixes, formatting, import reordering → skip CHANGELOG, skip docs.
- **Auto-generated files**: `dist/`, `node_modules/`, `.turbo/` → never document these.
- **Temporary debug code**: if you add `console.log` for debugging and remove it before commit → no doc needed.
- **Duplicate info**: if it's already in `AI-CONTEXT.md`, don't also put it in `OVERVIEW.md` — link instead.
- **Speculative future work**: don't document "we might do X" in docs — use `log_decision` with `alternatives` field instead.

### 13.9 Quick reference — where to find each doc type

| Need to know... | Read this |
|------------------|-----------|
| What an app does | `apps/<app>/docs/OVERVIEW.md` (or `AI-CONTEXT.md` if missing) |
| How an app is structured | `apps/<app>/docs/ARCHITECTURE.md` |
| What API endpoints exist | `apps/<app>/docs/API.md` |
| How data flows through the app | `apps/<app>/docs/DATA-FLOW.md` |
| What tables the app uses | `apps/<app>/docs/DATA-MODEL.md` |
| User roles and permissions | `apps/<app>/docs/ROLES-PERMISSIONS.md` |
| UI layout and components | `apps/<app>/docs/UI-UX.md` |
| User flows (step-by-step) | `apps/<app>/docs/FLOWS.md` |
| Product requirements | `apps/<app>/docs/PRD.md` |
- Densest context for AI | `apps/<app>/docs/AI-CONTEXT.md` |
| What changed recently | `apps/<app>/docs/CHANGELOG.md` |
| How to operate/debug the app | `apps/<app>/docs/RUNBOOK.md` |
| Overall architecture | `docs/ARCHITECTURE.md` |
| Auth and RLS | `docs/PROJECT_CONTEXT.md` / `docs/ARCHITECTURE.md` |
| Database schema (all apps) | `docs/DATABASE-SCHEMA.md` (to be created) / `supabase/migrations/` |
| Coding standards | `docs/CODING-STANDARDS.md` |
| Data migration procedures | `docs/DATA-MIGRATION.md` |
| Dev environment setup | `docs/DEV-ENVIRONMENT.md` |
| Deployment process | `docs/DEPLOYMENT.md` |
| Trial seed system | `docs/TRIAL-SYSTEM.md` |
| Agent rules (this file) | `AGENTS.md` |
