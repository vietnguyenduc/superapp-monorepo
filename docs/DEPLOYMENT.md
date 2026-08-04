# Deployment — Superapp Monorepo

> Vercel deployment cho 7 apps. Mỗi app deploy độc lập trên Vercel.

## Architecture

```
GitHub repo (vietnguyenduc/superapp-monorepo)
  ├── Branch: viet (development)
  │     └── Push → Vercel preview deployment per app
  └── Branch: main (production)
        └── Merge viet → main → Vercel production deployment
```

## Production URLs

| App | URL | Vercel Project |
|-----|-----|----------------|
| Admin Portal | https://admin.appforyou.xyz | admin-portal |
| Cashflow | https://cashflow.appforyou.xyz | cashflow |
| Inventory | https://inventory.appforyou.xyz | inventory-operation |
| Sales & POS | https://sales.appforyou.xyz | sales-operation |
| HR & Payroll | https://hr.appforyou.xyz | hr-operation |
| Accounting | https://accounting.appforyou.xyz | accounting |
| Operations | https://ops.appforyou.xyz | operations-portal |

## Vercel Configuration

Mỗi app có `vercel.json` trong `apps/<app>/`. Build từ root monorepo qua `npx turbo`:

```json
{
  "buildCommand": "cd ../.. && npx turbo run build --filter=cashflow...",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "ignoreCommand": "bash ../../scripts/vercel-ignore.sh"
}
```

### `ignoreCommand` — quản lý deploy quota

- `ignoreCommand` tối đa **256 ký tự**. Nếu dài hơn, Vercel trả lỗi `bad_request: ignoreCommand should NOT be longer than 256 characters` và build fail. Logic phân nhánh phải chuyển vào file script riêng, ví dụ `scripts/vercel-ignore.sh`.
- Với free/hobby plan, quota deploy là **100 lượt/ngày** (rolling 24h). Vì vậy:
  - `main` luôn build (production).
  - Branch `viet` chỉ build khi file của app hoặc shared packages thay đổi.
  - Tất cả branch `devin/*` và PR preview khác tự skip.
- File `scripts/vercel-ignore.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

REF="${VERCEL_GIT_COMMIT_REF:-}"

# Production is always built
[ "$REF" = "main" ] && exit 1

# Preview branch: build only when this app, shared packages, or lockfile changed.
if [ "$REF" = "viet" ]; then
  if ! git rev-parse HEAD >/dev/null 2>&1; then
    exit 1
  fi
  git fetch origin main --depth=50 -q 2>/dev/null || true
  BASE=$(git merge-base origin/main HEAD 2>/dev/null || git rev-parse HEAD^ 2>/dev/null || git rev-parse HEAD)
  git diff --quiet "$BASE" HEAD -- . ../../packages ../../package-lock.json
  exit $?
fi

# Skip all other preview branches
exit 0
```

### Environment Variables (per Vercel project)

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://<project>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `<anon-key>` |
| `VITE_TRIAL_API_URL` | `https://api.appforyou.xyz` (or Supabase Edge Function URL) |
| `SENTRY_AUTH_TOKEN` | (optional, for source maps) |
| `SENTRY_ORG` | (optional) |

### `.vercelignore`

```
node_modules
dist
*.test.ts
*.test.tsx
```

## Deployment Workflow

### Scenario A: Push to `viet` (Preview)

```bash
git add -A
git commit -m "fix(cashflow): resolve chart rendering bug"
git push origin viet
```

→ Vercel auto-builds **preview** deployment per app
→ Get preview URL: `vercel ls --token "$VERCEL_TOKEN" cashflow`
→ Verify at preview URL (NOT production)

### Scenario B: Merge to `main` (Production)

```bash
# Create PR viet → main
gh pr create --base main --head viet --title "Release: ..."

# Merge PR (squash)
gh pr merge --squash --admin

# Or force merge if CI pending
gh pr merge --admin --squash --match-head-commit
```

→ Vercel deploys to **production** (`*.appforyou.xyz`)
→ Wait for `READY` state
→ Verify at production URL

### Scenario C: Manual Redeploy

**KHÔNG** chạy `vercel --prod` từ trong `apps/<app>/` vì `rootDirectory` của mỗi project là `apps/<app>` nhưng build cần root monorepo để `turbo` resolve dependencies. Nếu cần deploy thủ công, dùng Vercel API từ repo root:

```bash
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gitSource": {"type": "github", "repoId": <repo-id>, "ref": "main"},
    "name": "cashflow",
    "project": "prj_<project-id>",
    "target": "production"
  }'
```

Hoặc trigger qua Vercel Dashboard → project → Deployments → Redeploy.

## CI/CD

### GitHub Actions (if configured)

- On push to `viet`: lint + type-check + test
- On PR to `main`: full test suite + build verification
- On merge to `main`: Vercel auto-deploys

### Vercel Auto-Deploy

Vercel connected to GitHub repo. Mỗi push trigger build cho apps có thay đổi (Vercel detects `apps/<app>/` path changes).

## Verification Checklist

Sau mỗi deployment:

- [ ] `vercel ls` shows deployment in `READY` state
- [ ] `browser_navigate` to URL → page renders
- [ ] No console errors
- [ ] Login works
- [ ] Key feature works (e.g. create transaction, import products)
- [ ] Mobile responsive

## Environment Setup

### Vercel CLI

```bash
# Install
npm i -g vercel

# Login (or use token)
vercel login

# Link project
cd apps/cashflow
vercel link

# Deploy
vercel --prod
```

### GitHub CLI

```bash
# Install
npm i -g gh

# Auth
gh auth login
# or use GH_TOKEN env var
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Build fails on Vercel with `bad_request: ignoreCommand should NOT be longer than 256 characters` | `vercel.json` `ignoreCommand` exceeds 256 chars | Move logic to `scripts/vercel-ignore.sh` and use short `bash` command |
| All PRs/checks fail Vercel but Usage shows no limit | `ignoreCommand` malformed or `.vercelignore` excludes `.git` (required for `git diff` in `ignoreCommand`) | Check `vercel.json` and remove `.git` from `.vercelignore` for affected apps |
| Vercel project named `project` always fails | It is the default root monorepo project without correct `outputDirectory` | Delete it in Vercel dashboard or reconfigure root build |
| Build fails on Vercel | Missing env vars | Check Vercel project settings |
| App shows blank page | Vite build output wrong dir | Check `vercel.json` `outputDirectory` is `dist` |
| Auth not working | Cookie domain mismatch | Ensure `.appforyou.xyz` in cookieStorage |
| API calls fail | CORS not configured | Add `*.appforyou.xyz` to Supabase CORS |
| 404 on refresh | SPA routing not configured | Check `vercel.json` rewrites |

## Domain Configuration

```
appforyou.xyz (root domain)
  ├── admin.appforyou.xyz    → Vercel admin-portal project
  ├── cashflow.appforyou.xyz → Vercel cashflow project
  ├── inventory.appforyou.xyz → Vercel inventory-operation project
  ├── sales.appforyou.xyz    → Vercel sales-operation project
  ├── hr.appforyou.xyz       → Vercel hr-operation project
  ├── accounting.appforyou.xyz → Vercel accounting project
  └── ops.appforyou.xyz      → Vercel operations-portal project
```

DNS configured via Vercel (CNAME records). SSL auto-provisioned by Vercel.

## See Also

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System architecture
- [DEV-ENVIRONMENT.md](./DEV-ENVIRONMENT.md) — Local dev setup
- [AUTH-AND-RBAC.md](./AUTH-AND-RBAC.md) — Cookie domain config
- `AGENTS.md` — Git + Vercel workflow rules
