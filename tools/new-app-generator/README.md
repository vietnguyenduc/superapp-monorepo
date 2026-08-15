# Superapp New App Generator

A small static HTML tool for scaffolding a new Superapp Vite app.

## Usage

### In browser

Open `tools/new-app-generator/index.html` in a browser (e.g. serve with `npx serve tools/new-app-generator`), fill in the form, and download `apps/<name>.zip`.

### Re-embed doc templates

If `docs/NEW-APP-TEMPLATE/` changes, regenerate `templates.js`:

```bash
node tools/new-app-generator/embed-templates.js
```

## What it generates

- `apps/<name>/` with React 18 + TypeScript 5.8 + Vite
- Shared IAM / company context wiring
- Sample `Dashboard`, `Settings`, `sampleService`, `UserRole`
- Full 12-file doc skeleton from `docs/NEW-APP-TEMPLATE/`
- `vercel.json` and `.env.example`

## After unzipping

1. Place the `apps/<name>` folder inside the monorepo.
2. Add the app to root `README.md`, `AGENTS.md`, `turbo.json`, and `.github/workflows/deploy-changed-apps.yml`.
3. Run `npx turbo run check-types lint test build --filter=<name>`.
4. Link a Vercel project and deploy via `origin/viet` → `main`.
