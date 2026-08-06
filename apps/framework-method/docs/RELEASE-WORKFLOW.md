# Framework Method — Release & Verification Workflow

This document captures the agreed deploy-and-verify workflow for `apps/framework-method` (and, by extension, the other Superapp frontend apps). The goal is to avoid burning Vercel Hobby quota on premature deployments and to keep production stable.

## Principles

1. **No surprise deploys.** A push to `viet` or `main` should NOT be used as a way to "just get a preview link." Preview links are produced deliberately.
2. **Local first.** Both the agent and the requester test on a local preview build before any Vercel build is requested.
3. **Manual Vercel preview.** When local testing is approved, the agent manually triggers a Vercel preview deployment and shares the exact preview URL.
4. **Production only after Vercel preview approval.** A PR into `main` is created only after the Vercel preview URL is verified by both the agent and the requester.

## Step 1 — Local preview (mandatory)

1. The agent builds the app in production mode locally:
   ```bash
   npm run build -w framework-method
   ```
2. The agent serves the `dist` folder and exposes it (or uses Tailscale):
   ```bash
   cd apps/framework-method
   npx vite preview --port 4179
   ```
3. The agent verifies the UI in browser (light/dark, navigation, buttons, persistence, responsive layout).
4. The agent shares the local/preview link with the requester.
5. **The requester tests and approves.** No PR is created before this approval.

> **Do NOT create a PR to `main` or `viet` before local approval.** This avoids unnecessary Vercel preview builds and protects production quota.

## Step 2 — Vercel preview (manual, on request)

1. After local approval, the requester asks for a Vercel preview.
2. The agent triggers a manual preview deploy from the repo root:
   ```bash
   cd /home/ubuntu/repos/superapp-monorepo
   npx vercel --cwd apps/framework-method --token "$VERCEL_TOKEN"
   ```
   Or, if a project is already linked, use `npx vercel --token "$VERCEL_TOKEN"` from `apps/framework-method`.
3. The agent waits for the build to finish and shares the exact preview URL from `vercel ls` / dashboard.
4. Both the agent and the requester verify the preview URL.
5. If fixes are needed, the agent edits locally, rebuilds, and re-tests on local first before pushing another Vercel preview.

> **Vercel Hobby quota is 100 deployments per rolling 24 hours.** Avoid auto-deploy on every push. Manual preview deploys are used sparingly.

## Step 3 — Production deploy (via PR to `main`)

1. Only after the Vercel preview URL is approved by both parties does the agent create a PR to `main`.
2. The PR body references the Vercel preview URL and the local verification notes.
3. The agent waits for required CI checks (type-check, lint, test) but does **not** merge until the requester approves the PR.
4. After merge, Vercel deploys to `https://framework-method.appforyou.xyz` (or the configured production domain).
5. Both parties verify the production URL.

## What NOT to do

- Do not push to `viet` or `main` just to get a preview link.
- Do not create a PR into `main` or `viet` before local testing is complete.
- Do not rely on Vercel auto-deploy for iterative UI fixes; iterate locally.
- Do not verify on `appforyou.xyz` unless the change has been merged to `main`.

## App-specific verification checklist

For `framework-method`, each release stage should confirm:

- [ ] Login / trial preview (`?trial_preview=true`) works.
- [ ] Header navigation returns to `/dashboard`.
- [ ] Overview "Back to home", "Start Session", and "View All" actions work.
- [ ] Step page loads current step, saves reflections, and advances on "Complete Step".
- [ ] Progress and reflections persist across reload (localStorage).
- [ ] Dark mode toggles and persists.
- [ ] Mobile viewport is usable.
