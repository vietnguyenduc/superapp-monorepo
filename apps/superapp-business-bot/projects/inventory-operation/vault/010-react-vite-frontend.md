# ADR 010 — React + Vite Frontend

## Status

**Accepted**

## Context

Inventory app started with basic React setup. Need modern build tooling for fast development, hot module replacement, and optimized production bundles.

## Decision

**Use React 18 + Vite + TypeScript + Tailwind CSS.**

Rationale:
- Vite: instant HMR, fast builds (vs Create React App webpack)
- React 18: concurrent features, Suspense for async data loading
- TypeScript: type safety for inventory data structures
- Tailwind CSS: rapid UI development, consistent with cashflow app

## Consequences

### Positive
- Fast development iteration (HMR < 200ms)
- Optimized production bundle (tree-shaking, code splitting)
- Type-safe props and state management
- Utility-first CSS reduces custom CSS files

### Negative
- Tailwind learning curve for new developers
- Tailwind config needs customization for inventory-specific design tokens
- Vite ecosystem smaller than webpack (but growing rapidly)

## Related

- `apps/inventory-operation/docs/ARCHITECTURE.md` — Technology Rationale
- Root docs: `docs/DEVELOPMENT.md` — Project Setup