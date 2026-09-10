---
app: hr-operation
doc_type: RUNBOOK
generated: true
---

# hr-operation — Runbook

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Local development

```bash
cd /home/ubuntu/repos/superapp-monorepo
npx turbo run dev --filter=hr-operation
```

Verify at `http://<TAILSCALE_IP>:5177`.

## Build & test

```bash
npx turbo run check-types --filter=hr-operation
npx turbo run lint --filter=hr-operation
npx turbo run test --filter=hr-operation
npx turbo run build --filter=hr-operation
```

## Deploy

1. Push to `origin/viet` to create a Vercel preview deployment.
2. Wait for `readyState: READY`.
3. Use the *direct deployment URL* from `vercel ls` if the branch alias lags.
4. After verification, merge `viet` → `main` to deploy to `hr.appforyou.xyz`.

## Common issues

- `401 Unauthorized` on Supabase → check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match the same project.
- Trial mode fallback → verify `http://localhost:3001/health` is not reachable from the sandbox unless intended.
- `check-types` fails in `@repo/ui` → ensure `packages/ui/tsconfig.json` overrides `module` / `moduleResolution` to `ESNext` / `bundler`.

## Production support

- Sentry captures runtime errors.
- DB migrations: `npx supabase migration new <name>` then `npx supabase db push` after review.


## WSL local setup (2026-09-10)

Set `VITE_SUPABASE_URL` and the public `VITE_SUPABASE_ANON_KEY` in `.env.local`
using this project's existing public configuration. Missing values prevent shared
auth from initializing. Set `VITE_USE_LOCAL_API=false` when using Supabase cloud
without a local API. Never commit `.env.local`. Run `npm run test:smoke` at the root.
