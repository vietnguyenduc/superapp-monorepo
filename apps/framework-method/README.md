# Framework Method

A productivity app in the Superapp monorepo for running multi-step thinking frameworks (Discovery → Deconstruction → Synthesis → Strategy → Execution) and a drag-and-drop Web Builder for creating templates.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- i18next (vi/en)
- react-router-dom
- recharts
- `@superapp/iam` for auth and multi-tenant context
- `@superapp/shared-utils` for Supabase client
- Shared Supabase project: `peslmsctejkwzyohke`

## Local development

```bash
npm install
npm run dev -w framework-method
```

App runs on port **5179**.

## Environment variables

Copy `.env.example` to `.env.local` (or pass vars inline). Only the **anon key** goes to the client.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Deployment

Create a Vercel project with:

- Root Directory: `apps/framework-method`
- Framework Preset: Vite
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` pointing to the shared Superapp Supabase project.

Vercel settings are in `vercel.json`.
