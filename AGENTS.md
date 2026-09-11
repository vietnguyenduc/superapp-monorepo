# Superapp Monorepo — Codex Rules

## Project

Multi-tenant SaaS for Vietnamese SMBs. Tenant isolation uses PostgreSQL RLS and
`company_id`; never create one schema per tenant. Supabase cloud is the production
source of truth for Auth and data.

| App | Port | Production |
|---|---:|---|
| Admin Portal | 5173 | `https://admin.appforyou.xyz` |
| Cashflow | 5174 | `https://cashflow.appforyou.xyz` |
| Inventory Operation | 5175 | `https://inventory.appforyou.xyz` |
| Sales Operation | 5176 | `https://sales.appforyou.xyz` |
| HR Operation | 5177 | `https://hr.appforyou.xyz` |
| Accounting | 5178 | `https://accounting.appforyou.xyz` |
| Operations Portal | 3006 | `https://ops.appforyou.xyz` |

`apps/framework-method/` is a separate personal project. `apps/insforge-infra/`
is optional local infrastructure. `apps/superapp-business-bot/` is deprecated.

## Start every task with context

1. Work in `/home/dev/projects/superapp-monorepo`.
2. For one app, read `apps/<app>/docs/AI-CONTEXT.md` and `RUNBOOK.md`.
3. For cross-app work, read `docs/ARCHITECTURE.md` and `docs/PROJECT_CONTEXT.md`.
4. Search docs and code for the relevant feature before editing.
5. Update affected docs when behavior, architecture, operations, or setup changes.

Use `rg` / `rg --files` for searches. Verify documentation against current package
scripts, service configuration, and workflows.

## Local development on this machine

- Windows is the host; Ubuntu WSL contains this repository and runs the apps.
- The seven Vite apps run as systemd services. Reuse them; do not run
  `npm run dev:apps` while those services are active.
- Fixed ports are 5173–5178 and 3006. Do not change them.
- Open an app from Windows at `http://localhost:<port>`.
- For an iPhone, Tailscale runs directly inside WSL as `superapp-wsl`
  (`100.88.242.114` as of 2026-09-11). Use optimized mobile-preview ports
  4173–4178 and 4006; dev ports can be slow over a DERP relay. See
  `docs/DEV-ENVIRONMENT.md` for URLs, lifecycle, and restart commands.
- `.env.local` files are private and ignored. Never print or commit credentials.
- Set `VITE_USE_LOCAL_API=false` to use Supabase cloud without probing the optional
  local API. Prefer trial mode for safe UI tests when it covers the feature.
- Docker/InsForge are optional tools, not prerequisites for ordinary frontend work.

Useful commands from the repository root:

```bash
npm ci
npm run check-types -- --concurrency=1
npm run build -- --concurrency=1
npm run test:smoke
npm run test:e2e:cashflow
npm run test:e2e:inventory
```

Playwright uses Chromium and iPhone-sized WebKit smoke checks. The smoke suite
confirms public entry screens render; it does not certify authenticated workflows.

## Verification

- Run the smallest relevant test plus type-check/build appropriate to the change.
- Every UI change must be opened and exercised in a browser before reporting done.
- Check desktop and mobile behavior when layout or interaction changes.
- Do not claim a deployment is live until the correct URL renders the changed feature.

| State | Verify at |
|---|---|
| Local change | `http://localhost:<port>` |
| Push to `viet` | the preview produced for that commit |
| Merge to `main` | the production domain |

## Git and deployment

- Preserve unrelated user changes in a dirty worktree.
- Commit safe completed work and push it to `origin/viet`.
- Pushes to `viet` run `.github/workflows/deploy-changed-apps.yml`, deploying changed
  apps to fixed `*-preview.appforyou.xyz` aliases.
- Production requires a reviewed `viet` → `main` merge. GitHub Actions then deploys it.
- Vercel Git auto-deploy is disabled in each app's `vercel.json`.
- Never trigger Vercel deployments through `POST /v13/deployments`, deploy hooks,
  `forceNewBuild`, or ad-hoc `vercel --prod` commands.
- Ask before force-pushing, applying database migrations, deleting material files,
  merging to `main`, or exposing secrets.

## Data and Supabase

- Auth always uses Supabase Auth; production data uses Supabase cloud.
- Local InsForge/API/Postgres is an optional mirror and may differ from production.
- Confirm the active data source before tests that create, update, or delete records.
- Include `company_id` in tenant mutations and preserve RLS boundaries.
- Database changes require a migration in `supabase/migrations/`, relevant docs,
  security review, and explicit user approval before application.

## Documentation map

| Need | Source |
|---|---|
| App overview and gotchas | `apps/<app>/docs/AI-CONTEXT.md` |
| App operations | `apps/<app>/docs/RUNBOOK.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Local setup | `docs/DEV-ENVIRONMENT.md` |
| Data routing | `docs/DATA-ROUTING.md` |
| Deployment | `docs/DEPLOYMENT.md` and `.github/workflows/` |
| Recent app changes | `apps/<app>/docs/CHANGELOG.md` |

Add concise, durable facts to these files. Do not document generated output,
temporary debugging steps, or speculative future work.
