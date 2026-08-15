---
app: <APP_NAME>
doc_type: RUNBOOK
---

# <APP_NAME> — Runbook

## Local dev

```bash
npx turbo run dev --filter=<APP_NAME>
```

## Build & test

```bash
npx turbo run check-types --filter=<APP_NAME>
npx turbo run lint --filter=<APP_NAME>
npx turbo run test --filter=<APP_NAME>
npx turbo run build --filter=<APP_NAME>
```

## Deploy

1. Push `origin/viet` → Vercel preview.
2. Verify preview URL.
3. Merge `viet` → `main` → production `https://<APP_NAME>.appforyou.xyz`.

## Troubleshooting

- `401` → check Supabase URL/key match.
- `check-types` fails → ensure `tsconfig.json` uses `ESNext`/`bundler`.
