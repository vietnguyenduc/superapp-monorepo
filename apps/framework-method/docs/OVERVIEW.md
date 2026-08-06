# Framework Method — App Overview

Framework Method is a productivity app inside the Superapp ecosystem.

## Purpose

Help users run multi-step thinking frameworks (Discovery → Deconstruction → Synthesis → Strategy → Execution) and build reusable templates through a drag-and-drop Web Builder.

## Key Features

1. Morning Dashboard — streak, weekly completion, today's task counts, framework task breakdown.
2. Overview — daily task dashboard: tasks grouped by framework/category/subcategory, status, priority, quick-add, and group renaming.
3. Step Detail — open block cards (Concepts, Reference, Examples) each with their own reflection input, hint, and completion status; finishing a step generates actionable tasks.
4. Framework/Template Overlay — switch framework template and view phases.
5. Actions — committed action list, midday reflection, quick notes.
6. Evening Reflection — what went well, daily goals, tomorrow's focus, close the day.
7. Calendar — day/week/month/quarter views grouped into Framework, Actions, and Reflections.
8. History — completed framework sessions with full per-block reflection detail.
9. Web Builder — build templates with content, interaction, and logic blocks; define per-block reflection question/placeholder/hint.
10. Daily Mix — run multiple templates together as one framework for the day.
11. Cross-template references — a block can display or depend on an answer from another template via `referenceBlockId` and `{{answer:blockId}}` placeholders.
12. Conditional logic per block — show/hide a block based on whether another answer contains a value (Tally-style dependency).
13. Task generation — blocks can create tasks when answered, and `Overview` becomes the daily todo list.

## Tech Stack

- React 18 + TypeScript + Vite 8
- Tailwind CSS with `darkMode: 'class'`
- i18next (vi/en)
- recharts for insights
- Supabase auth + RLS (shared project)
- `@superapp/iam`, `@superapp/shared-utils`, `@repo/types`, `@repo/ui`

## Release & Verification Workflow

To avoid burning Vercel Hobby quota and to keep production stable, follow this staged process:

1. **Local preview (mandatory)** — The agent builds and exposes the app locally (`npx vite preview --port 4179`). Both the agent and the requester test UI/UX, navigation, persistence, and dark mode before moving on. **Do NOT create a PR to `main` or `viet` before this is approved.**
2. **Manual Vercel preview** — Only after local approval, the agent triggers a manual Vercel preview (`npx vercel --cwd apps/framework-method --token "$VERCEL_TOKEN"`) and shares the exact preview URL. Both parties verify the preview.
3. **Production PR** — Only after the Vercel preview is approved does the agent create a PR to `main`. After merge, Vercel deploys to the production domain and both parties verify production.

See `AI-CONTEXT.md` for architecture notes and `CHANGELOG.md` for recent changes.
