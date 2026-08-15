---
app: admin-portal
doc_type: OVERVIEW
generated: true
---

# admin-portal — Overview

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Purpose

Multi-company management, user/role admin, trial seed editor, and app switcher.

- **Local port:** 5173
- **Production domain:** `admin.appforyou.xyz`
- **Vercel project:** `admin-portal`

## Tech stack

- React 18 + TypeScript 5.8 + Vite 8
- Tailwind CSS (Apple-inspired design tokens from `@superapp/theme`)
- Supabase cloud (`peslmsctejmvkwzyohke`) via `@superapp/shared-utils` `createApiClient`
- Shared auth / company context from `@superapp/iam`

## Key dependencies

- @repo/types
- @repo/ui
- @superapp/iam
- @superapp/shared-utils
- react
- react-dom
- react-router-dom

## Main pages

- `CompanyManagement`
- `ConsolidatedReports`
- `DataLifecycle`
- `GlobalSettings`
- `IdentityManagement`
- `Manual`
- `TrialSeedEditor`

## Main services

*See `src/services/`*

## Related Supabase tables

- `branches`
- `companies`
- `permissions`
- `roles`
- `trial_seed`
- `users`

## Quick links

- `apps/admin-portal/docs/ARCHITECTURE.md` — structure & routing
- `apps/admin-portal/docs/DATA-MODEL.md` — tables & relationships
- `apps/admin-portal/docs/API.md` — service / API surface
- `apps/admin-portal/docs/AI-CONTEXT.md` — agent gotchas & tasks
- `apps/admin-portal/docs/CHANGELOG.md` — recent changes

