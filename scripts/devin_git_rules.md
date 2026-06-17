# Devin Git Rules — superapp-monorepo

## Branch Policy

1. **ALWAYS push to branch `viet`**. NEVER push directly to `main`.
2. When creating PRs, the target (base) branch MUST be `viet`.
3. Feature branches should be named `devin/<timestamp>-<description>` and merged into `viet`.

## Before Pushing

1. Run `git pull origin viet --rebase` to sync with remote.
2. If rebase conflicts occur:
   - Create a backup branch: `git branch backup-<timestamp>`
   - Abort the rebase: `git rebase --abort`
   - Try a merge instead: `git pull origin viet`
   - If merge also fails, notify the user and do NOT force push.

## Commit Guidelines

- Use conventional commits: `feat(scope):`, `fix(scope):`, `docs(scope):` etc.
- Scope should be the app name: `business-bot`, `antigravity-agent`, `admin-bot`, `cashflow`, etc.
- Never commit `.env` files or secrets.
- Never run `git add .` — explicitly add only changed files.

## After Pushing

- Confirm the push succeeded.
- Message the user so they can `git pull origin viet` on their local machine.

## Protected Branches

- `main` — Production. Only merge via reviewed PRs from `viet`.
- `viet` — Development integration branch. Devin and user push here.

## Emergency Procedures

- If `viet` is broken, create `viet-hotfix-<timestamp>` from the last known good commit.
- Never force-push to `viet` or `main`.
- If unsure, ask the user before proceeding.
