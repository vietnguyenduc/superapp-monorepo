---
app: hr-operation
doc_type: RUNBOOK
generated: true
---

# hr-operation — Runbook

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Local development

```bash
cd /home/dev/projects/superapp-monorepo
npx turbo run dev --filter=hr-operation
```

The HR app normally runs as a WSL systemd service. Reuse it rather than starting a
second Vite process. Verify from Windows at `http://localhost:5177`; use the optimized
mobile preview URL documented in `docs/DEV-ENVIRONMENT.md` from an iPhone.

Provisioned HR credentials remain outside the repository. The current Midomax pilot
credential is stored locally at
`/home/dev/.config/appforyou/midomax-duongquach-credentials.txt` with mode `0600`.
Never copy its password into documentation or Git. The username login is an alias for
the managed AppForYou email; first-login password enforcement is stored in Supabase Auth
user metadata and cleared only after a successful password update.

### SharePoint import configuration

Create one AppForYou-owned Microsoft Entra **multitenant Single-page application**
registration with supported accounts set to **Accounts in any organizational
directory**, then add these exact redirect URIs. Customer users do not create their
own registration or provide configuration IDs. MSAL Browser v5 uses the dedicated
redirect bridge page; registering only the site origin will cause a redirect mismatch
or popup timeout.

- `http://localhost:5177/redirect.html`
- `https://hr-preview.appforyou.xyz/redirect.html`
- `https://hr.appforyou.xyz/redirect.html`

Add delegated Microsoft Graph permission `Files.Read`. Admin consent is normally not
required for this delegated permission, though the tenant's own consent policy may be
stricter. Put the public identifiers in the ignored `.env.local` for local work and in
the matching Vercel Preview/Production environment:

```text
VITE_MICROSOFT_CLIENT_ID=<application-client-id>
```

The client uses the Microsoft `organizations` authority so work/school accounts from
other Entra tenants can sign in. Delegated Graph permissions do not override a customer
tenant's consent policy: if that organization blocks third-party user consent, use the
manual file-upload path rather than leaving the user stuck at admin approval.

Do not create or expose a client secret for this browser flow. Restart the HR service
after changing the local client ID. Verify with an Excel/CSV sharing link that
the signed-in Microsoft account can already open. The pilot reads one file through
Microsoft Graph and does not browse sites or folders.

### Excel input wizard

The macro-free phase-A template is `docs/templates/HR_Input_Wizard_v1.xlsx`. Its stable
ingestion tables are `tbl_hr_employee_profile` and
`tbl_hr_employment_assignment`. See `docs/templates/README.md` for the user flow,
protection behavior, and reproducible generator command. Upload the template to a test
SharePoint library, enter test rows, and use its sharing link in the preview app.

## Build & test

```bash
npx turbo run check-types --filter=hr-operation
npx turbo run lint --filter=hr-operation
npx turbo run test --filter=hr-operation
npx turbo run build --filter=hr-operation
```

## Deploy

1. Push to `origin/viet` to create a Vercel preview deployment.
2. Wait for `readyState: READY`.
3. Use the *direct deployment URL* from `vercel ls` if the branch alias lags.
4. After verification, merge `viet` → `main` to deploy to `hr.appforyou.xyz`.

## Common issues

- `401 Unauthorized` on Supabase → check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match the same project.
- Trial mode uses browser-local static seed data and does not require a backend.
- SharePoint button says `Chưa cấu hình Microsoft` → confirm both Microsoft build
  variables exist in the current environment, then rebuild/restart.
- Microsoft popup returns a redirect mismatch → add the exact current origin to the
  app registration's SPA redirect URIs.
- Graph returns 403 → the Microsoft account cannot access the file or the delegated
  `Files.Read` permission was not consented.
- `check-types` fails in `@repo/ui` → ensure `packages/ui/tsconfig.json` overrides `module` / `moduleResolution` to `ESNext` / `bundler`.

## Production support

- Sentry captures runtime errors.
- DB migrations: `npx supabase migration new <name>` then `npx supabase db push` after review.


## WSL local setup (2026-09-10)

Set `VITE_SUPABASE_URL` and the public `VITE_SUPABASE_ANON_KEY` in `.env.local`
using this project's existing public configuration. Missing values prevent shared
auth from initializing. Verify the Supabase URL and public key belong to the same project
without a local API. Never commit `.env.local`. Run `npm run test:smoke` at the root.
