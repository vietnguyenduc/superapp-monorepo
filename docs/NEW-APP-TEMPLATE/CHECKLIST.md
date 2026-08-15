# New App Checklist

- [ ] `apps/<app>/package.json` with React 18 + TypeScript 5.8
- [ ] `apps/<app>/vite.config.ts` and `tsconfig.json`
- [ ] `apps/<app>/src/main.tsx` wrapping `<AuthProvider>` and `<CompanyProvider>`
- [ ] `apps/<app>/src/App.tsx` with routes
- [ ] `apps/<app>/src/pages/` with at least a dashboard / list page
- [ ] `apps/<app>/src/services/` with a `*Service.ts` using `createApiClient`
- [ ] `apps/<app>/src/types/UserRole.ts` (or `src/utils/rbac.ts`) with roles & permissions
- [ ] `apps/<app>/docs/` created with the 12 files from this template
- [ ] `apps/<app>/.env.example` and Vercel project linked
- [ ] Add app to root `README.md`, `AGENTS.md`, `turbo.json`, and GitHub Action deploy matrix
- [ ] Run `npx turbo run check-types lint test build --filter=<app>`
