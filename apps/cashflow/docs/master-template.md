---
description: Master template guidance for UI/UX, auth, routing, and delivery
---

# Master Template Playbook

Use this as a starting point when spinning up a new app with the same UX, auth, and routing patterns.

## UI / Theme
- Font stack: Inter / SF Pro / -apple-system / BlinkMacSystemFont / Segoe UI / Roboto, sans-serif.
- Buttons: primary (bg-blue-500 hover:bg-blue-600, rounded-xl, font-medium), secondary/ghost with light border; keep focus ring.
- Cards: rounded-2xl, light border, subtle shadow; respect dark mode.
- Inputs: rounded-xl, neutral border; dark mode placeholders.
- Spacing: consistent 8px scale; generous vertical rhythm on forms.
- Icons: small, emoji is fine for toggles; keep minimal.

## Dark Mode
- Toggle adds/removes `dark` class on `document.documentElement` and stores `darkMode` in localStorage.
- On load, read localStorage and apply class before paint when possible.
- Background/body colors: light `#fff/#f8fafc`, dark `#111827` with readable text.

## Language Toggle (VI/EN)
- Store `language` in localStorage, update `document.documentElement.lang`.
- Call `i18n.changeLanguage(language)` on change/init.
- Text strings should map through i18n; for quick forms, use a local copy map keyed by language.

## Auth & Trial Flow
- `useAuth` exposes: `user`, `session`, `isAuthenticated = (!!session && !!user) || isTrial`, `isTrial`, `startTrial`, `signOut`, `clearError`.
- Trial: create mock user, persist to `cashflow_trial_user` in localStorage; restore on load if no session.
- `signOut` must clear trial storage and reset `isTrial`.
- ProtectedRoute: allow access if `isAuthenticated`; when `loading` show spinner; redirect to `/login` otherwise.
- Login page: trial CTA, dark/language toggles, no auto-redirect for trial refresh; optional trial banner with "Vào dashboard".

## Routing
- Use client-side navigation (`navigate`) for internal links. Avoid `window.location.href` to prevent losing trial/session state.
- Layout wraps protected routes; public routes include `/login`.

## LocalStorage Keys
- `cashflow_trial_user`, `darkMode`, `language`.
- For domain data, namespace per app (e.g., `cashflow_transactions`, `cashflow_bank_accounts`, `cashflow_customers`).

## Checklists
### Before coding
- Read AI_CONTEXT.md for rules and stack.
- Ensure branch: personal branch (e.g., `master-template` or feature branch).

### Implementing features
- Keep UI components reusable (Button, Card, Input, PageHeader, Toggles).
- Ensure dark mode & i18n coverage for new UI strings.
- Avoid full-page reloads; use router navigation.
- Persist toggles (dark/language) and trial state.

### QA
- Login: VI/EN toggle updates text; dark toggle flips theme; trial banner shown only when trial active; footer note present.
- Navigation: Customer -> Giao dịch link stays in app (no redirect to login).
- Dark mode visuals correct for forms, menus, dropdowns.

### Deploy (Vercel/CI)
- `npm install` (Vite + React 18 + TailwindCSS + react-i18next).
- Warnings about deprecated transient deps are acceptable if build passes.
- Clear localStorage when changing seeded data keys for manual QA.

## Footer Note Pattern
- Example: `Quản lí công nợ Ver 1.0 - 1 sản phẩm trong gói vận hành Doanh nghiệp theo yêu cầu.`
- Make it configurable per app.

## Reuse Plan
1) Copy shared UI (buttons, inputs, cards, toggles) and theme tokens into `shared/ui`.
2) Copy `useAuth`, `AuthContext`, `ProtectedRoute` (with trial support) into `shared/auth`.
3) Copy login page skeleton with toggles, trial CTA/banner, footer note.
4) Set up i18n base (vi/en) and dark-mode bootstrap script.
5) Update AI_CONTEXT.md in the new app with these rules and checklists.
