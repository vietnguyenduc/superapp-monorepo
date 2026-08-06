# Framework Method — App Overview

Framework Method is a productivity app inside the Superapp ecosystem.

## Purpose

Help users run multi-step thinking frameworks (Discovery → Deconstruction → Synthesis → Strategy → Execution) and build reusable templates through a drag-and-drop Web Builder.

## Key Features

1. Morning Dashboard — streak, weekly completion, productivity insights, active frameworks.
2. Overview — progress, focus for today, upcoming steps.
3. Step Detail — accordion sections (Concepts, Reference, Examples) with reflection inputs.
4. Framework/Template Overlay — switch framework template and view phases.
5. Actions — committed action list, midday reflection, quick notes.
6. Evening Reflection — what went well, daily goals, tomorrow's focus, close the day.
7. Calendar — month/week view and scheduled sessions.
8. History — completed framework sessions.
9. Web Builder — build templates with content, interaction, and logic blocks.

## Tech Stack

- React 18 + TypeScript + Vite 8
- Tailwind CSS with `darkMode: 'class'`
- i18next (vi/en)
- recharts for insights
- Supabase auth + RLS (shared project)
- `@superapp/iam`, `@superapp/shared-utils`, `@repo/types`, `@repo/ui`
