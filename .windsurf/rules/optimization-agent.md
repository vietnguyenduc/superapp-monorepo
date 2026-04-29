---
trigger: model_decision
description: Mandatory pre-refactor / optimization checklist for this monorepo. Apply whenever the user asks to optimize, refactor, clean up, lean, simplify, or modernize any part of the codebase.
---

# Optimization-Agent Guardrails

When acting as an "optimization agent" (the user asks to refactor, optimize, clean up, lean, modernize, or "make ready for senior dev review"), you MUST evaluate context before changing code. Follow this checklist in order.

## 1. Read existing decisions FIRST

Before touching any file, search and read:

1. `apps/<app>/docs/adr/*.md` — Architecture Decision Records. **A refactor that contradicts an ADR is a regression**, not an optimization. If you must contradict, write a superseding ADR first.
2. `apps/<app>/docs/*-lessons-learned.md` and `docs/*-postmortem*.md` — These exist because something broke before. Re-introducing the pattern they warn against is a regression.
3. `apps/<app>/docs/*.md` (data-flow, architecture, contracts) — Map the data flow you're about to touch.
4. `git log -n 10 -- <target-files>` — Look for recent `fix:`, `revert:`, or `hotfix:` commits. They indicate fragile areas.

If any ADR / lessons-learned doc covers the path you're refactoring, **cite it in the plan and the commit message**.

## 2. Identify the contracts

Before changing a function, hook, context, or service, list:

- Who calls it (grep for the symbol).
- What the documented contract is (JSDoc, ADR, README).
- Whether it has implicit contracts (timing, ordering, cache hydration, side effects).

If a function has a `@deprecated` tag, do not silently change its behavior — the deprecation strategy is part of the contract.

## 3. Don't widen scope without explicit user approval

A user asking to "remove dead code" did not ask you to:
- Migrate transaction-type display logic
- Restructure auth timing
- Touch shared state caches

If you discover an adjacent issue, **report it** in the plan or final summary, but do not fix it in the same commit unless the user agreed.

## 4. Verify by reading, not assuming

- Run `tsc --noEmit` after each phase. Failing types = stop and fix.
- Run targeted unit tests when refactoring a contract (e.g. `vitest run path/to/test`).
- For UI behavior changes, list manual smoke-test paths in the final summary so the user can verify.

## 5. Commit hygiene

- One concern per commit.
- Commit message format: `refactor(<area>): <change> [ref: ADR-XXXX]` when an ADR applies.
- `git show --stat <hash>` should fit on one screen for any optimization commit; if not, split it.

## 6. When in doubt, stop and ask

If the user's optimization request would:
- Change behavior of a critical path (auth, money, transactions, RLS)
- Contradict an ADR
- Touch a file with `lessons-learned` history
- Require deleting code referenced by docs

…ask the user one focused question before proceeding. A 30-second clarification beats a 2-hour regression.

## Anti-patterns to refuse

- **Hardcoded fallbacks for critical data** (display names, money math factors, role checks). The lessons-learned doc explicitly forbids this — fallbacks mask root causes.
- **Dual sources of truth** for the same data (e.g. global cache + component state both feeding the same display).
- **Removing typed casts/guards "because they look noisy"** without verifying the underlying values are actually narrower.
- **Bulk auto-fixing lint warnings** in files you weren't asked to touch.
