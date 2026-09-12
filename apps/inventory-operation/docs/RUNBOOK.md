---
app: inventory-operation
doc_type: RUNBOOK
generated: true
---

# inventory-operation — Runbook

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Local development

```bash
cd /home/dev/projects/superapp-monorepo
npx turbo run dev --filter=inventory-operation
```

Verify at `http://<TAILSCALE_IP>:5175`.

## Build & test

```bash
npx turbo run check-types --filter=inventory-operation
npx turbo run lint --filter=inventory-operation
npx turbo run test --filter=inventory-operation
npx turbo run build --filter=inventory-operation
npm run test:e2e:inventory
```

Bulk Nhập hàng/Xuất hàng regression only:

```bash
npx playwright test --config apps/inventory-operation/playwright.config.ts \
  --grep "bulk CSV imports"
```

These tests run on Chromium and iPhone-sized WebKit. They enter trial mode,
upload two-row CSV files, verify spreadsheet date normalization, save both rows,
and confirm both product codes in recent records. They do not write to
production Supabase.

## Deploy

1. Push to `origin/viet` to create a Vercel preview deployment.
2. Wait for `readyState: READY`.
3. Use the *direct deployment URL* from `vercel ls` if the branch alias lags.
4. After verification, merge `viet` → `main` to deploy to `inventory.appforyou.xyz`.

## Supabase access token on this WSL host

The Supabase personal access token is stored outside the repository at:

```text
/home/dev/.supabase/access-token
```

- Read it only at runtime; never print it, copy it into a project `.env`, or add it to Git.
- The file must remain owned by the WSL `dev` user with mode `600`.
- To make it available to the CLI for the current shell without displaying it:

```bash
export SUPABASE_ACCESS_TOKEN="$(cat /home/dev/.supabase/access-token)"
```

- If the token is revoked, create a replacement in the Supabase account dashboard and overwrite this file from Windows Explorer at `\\wsl$\Ubuntu\home\dev\.supabase\access-token`.
- This repository has legacy migration-history gaps. Do not use `supabase db push --include-all`; review and apply only the intended new migration.

## Common issues

- `401 Unauthorized` on Supabase → check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match the same project.
- Trial mode fallback → verify `http://localhost:3001/health` is not reachable from the sandbox unless intended.
- `check-types` fails in `@repo/ui` → ensure `packages/ui/tsconfig.json` overrides `module` / `moduleResolution` to `ESNext` / `bundler`.

## Production support

- Sentry captures runtime errors.
- DB migrations: `npx supabase migration new <name>` then `npx supabase db push` after review.
- Stock-count smoke test: create a session at `/stock-counts`, enter all physical counts, explain one variance, submit, approve, then confirm its adjustment ID appears and the XNT closing balance changes by the variance.
- If a product unit edit fails with `Không thể đổi đơn vị`, keep the historical product unchanged and create a new product/unit mapping; never rewrite historical transaction units.
