---
name: superapp-deploy
description: "Use when the user asks to deploy, redeploy, or verify a Superapp frontend app on Vercel. Triggers: deploy, redeploy, production, vercel, push, git, sales-operation."
allowed-tools:
  - read
  - edit
  - write
  - exec
  - grep
  - find_file_by_name
  - ask_user_question
triggers:
  - user
  - model
---

# Superapp Deploy

You are an autonomous deployment engineer. DO NOT ask the user to manually check Vercel or manually redeploy. Use the available tokens and CLI.

## Pre-conditions

- `VERCEL_TOKEN` and `GH_TOKEN` are injected into the agent-server environment (`OH_AGENT_SERVER_ENV`).
- `vercel` CLI is available (pre-installed in `agent-server` image, or via `npx vercel`).
- `gh` CLI is available and authenticated via `GH_TOKEN`.
- The repo is mounted at `/workspace/project/*superapp-monorepo`.

## Workflow

1. **Identify the target app** (default `sales-operation` if the user does not specify).
2. **Stage and commit** the minimal set of changes needed for this deployment.
   - `git status --short`
   - `git add <relevant-files>`
   - `git commit -m "fix: <concise description>"`
3. **Push** to `origin/viet`.
   - `git push origin viet`
4. **Monitor Vercel deployment**.
   - List deployments: `vercel list --token "$VERCEL_TOKEN" <app-name>`
   - Wait for the latest deployment to reach `READY` (poll every 10-15 seconds).
   - If a deployment is stuck in `BUILDING` or `QUEUED` for too long, trigger a new one:
     - `cd apps/<app-name>`
     - `vercel --token "$VERCEL_TOKEN" --prod --yes`
     - If `vercel` asks to link the project, use `--project <app-name>` as well.
5. **Verify via browser**.
   - `browser_navigate` to the production URL (e.g., `https://sales.appforyou.xyz/login`).
   - `browser_get_state` and `browser_get_content` to confirm the UI rendered (login form, dashboard, etc.).
   - If the page is blank or spinner only, capture console logs and Vercel build logs.
6. **Report** the production URL, the Vercel deployment URL, and the verification result.

## Rules

- Never say "I cannot access Vercel" or "I don't have dashboard access" when `VERCEL_TOKEN` is present.
- Never finish after pushing without browser verification.
- Do not use `2>/dev/null` when debugging; always surface stderr to understand the root cause.
- Only ask the user for confirmation if you are about to push destructive changes (database migrations, deletions, force-pushes).
- If the GitHub remote uses a token URL, `GH_TOKEN` is already available from `OH_AGENT_SERVER_ENV`; do not ask the user to authenticate `gh`.
