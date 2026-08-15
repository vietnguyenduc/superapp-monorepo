---
app: <APP_NAME>
doc_type: ARCHITECTURE
---

# <APP_NAME> — Architecture

## Directory layout

```
apps/<APP_NAME>/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   ├── services/
│   ├── components/
│   ├── hooks/
│   ├── types/
│   └── utils/
├── docs/
└── package.json
```

## Shared packages used

- `@superapp/iam`
- `@superapp/shared-utils`
- `@repo/ui`
- `@superapp/theme`

## Multi-tenancy

All data access is scoped by `company_id` / `branch_id`. RLS enforces isolation.

## Build flow

```bash
npx turbo run build --filter=<APP_NAME>
npx turbo run check-types --filter=<APP_NAME>
npx turbo run test --filter=<APP_NAME>
npx turbo run lint --filter=<APP_NAME>
```
