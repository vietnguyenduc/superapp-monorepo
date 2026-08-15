---
app: <APP_NAME>
doc_type: OVERVIEW
---

# <APP_NAME> — Overview

## Purpose

<!-- One-line purpose -->

- **Local port:** PORT
- **Production domain:** `https://<APP_NAME>.appforyou.xyz`
- **Vercel project:** `<APP_NAME>`

## Tech stack

- React 18 + TypeScript 5.8 + Vite 8
- Tailwind CSS (Apple-inspired design tokens from `@superapp/theme`)
- Supabase cloud (`peslmsctejmvkwzyohke`) via `@superapp/shared-utils` `createApiClient`
- Shared auth / company context from `@superapp/iam`

## Main pages

- `Dashboard`
- `Settings`

## Main services

- `<feature>Service.ts`

## Related Supabase tables

- `companies`
- `users`
- `branches`

## Quick links

- `apps/<APP_NAME>/docs/ARCHITECTURE.md`
- `apps/<APP_NAME>/docs/DATA-MODEL.md`
- `apps/<APP_NAME>/docs/API.md`
- `apps/<APP_NAME>/docs/AI-CONTEXT.md`
- `apps/<APP_NAME>/docs/CHANGELOG.md`
