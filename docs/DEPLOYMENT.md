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

Mỗi app có `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
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

```bash
# Trigger new deployment
vercel --token "$VERCEL_TOKEN" --prod

# Or via Vercel Dashboard
```

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
| Build fails on Vercel | Missing env vars | Check Vercel project settings |
| App shows blank page | Vite build output wrong dir | Check `vercel.json` `outputDirectory` |
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
