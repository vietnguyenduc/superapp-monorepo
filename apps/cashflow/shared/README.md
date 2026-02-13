# Shared Template Modules

Starter building blocks to reuse UI/UX, auth, and i18n patterns across apps.

## Structure
- `ui/`
  - `Button.tsx`: Primary/secondary button variants with focus states.
  - `Card.tsx`: Rounded container with border/shadow; supports dark mode.
  - `Toggles.tsx`: Dark-mode and language toggles wired for localStorage + callbacks.
- `auth/`
  - `useTemplateAuth.ts`: Hook pattern with trial support, localStorage persistence, and typed state.
  - `AuthProviderTemplate.tsx`: Context wrapper exposing auth state/actions.
  - `ProtectedRouteTemplate.tsx`: Guard for protected routes (supports trial sessions).
- `i18n/`
  - `index.ts`: Minimal i18n init for vi/en with language persistence.

## Notes
- These modules are examples to copy/adjust per app; they do not replace existing app wiring automatically.
- Namespace localStorage keys per app (e.g., `appname_darkMode`, `appname_language`, `appname_trial_user`).
- Keep UI tokens (colors, radius, shadows, font stack Inter/SF) aligned with `index.css`.
