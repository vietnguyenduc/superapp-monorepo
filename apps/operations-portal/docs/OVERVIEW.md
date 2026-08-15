---
app: operations-portal
doc_type: OVERVIEW
generated: true
---

# operations-portal — Overview

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Purpose

Operations portal: shift check-ins, documents, chat groups, tickets, assets, consumables, emergency contacts, training courses/materials/questions/progress.

- **Local port:** 3006
- **Production domain:** `ops.appforyou.xyz`
- **Vercel project:** `operations-portal`

## Tech stack

- React 18 + TypeScript 5.8 + Vite 8
- Tailwind CSS (Apple-inspired design tokens from `@superapp/theme`)
- Supabase cloud (`peslmsctejmvkwzyohke`) via `@superapp/shared-utils` `createApiClient`
- Shared auth / company context from `@superapp/iam`

## Key dependencies

- @repo/types
- @repo/ui
- @supabase/supabase-js
- @superapp/iam
- @superapp/shared-utils
- react
- react-dom
- react-router-dom

## Main pages

- `AssetsPage`
- `ChatPage`
- `CheckInPage`
- `Dashboard`
- `DocumentsPage`
- `EmergencyPage`
- `Manual/Manual`
- `TicketsPage`
- `TrainingPage`

## Main services

*See `src/services/`*

## Related Supabase tables

- `branches`
- `companies`
- `operation_assets`
- `operation_chat_groups`
- `operation_chat_members`
- `operation_chat_messages`
- `operation_checkins`
- `operation_consumables`
- `operation_documents`
- `operation_emergency_contacts`
- `operation_tickets`
- `operation_training_courses`
- `operation_training_materials`
- `operation_training_progress`
- `operation_training_questions`
- `users`

## Quick links

- `apps/operations-portal/docs/ARCHITECTURE.md` — structure & routing
- `apps/operations-portal/docs/DATA-MODEL.md` — tables & relationships
- `apps/operations-portal/docs/API.md` — service / API surface
- `apps/operations-portal/docs/AI-CONTEXT.md` — agent gotchas & tasks
- `apps/operations-portal/docs/CHANGELOG.md` — recent changes

