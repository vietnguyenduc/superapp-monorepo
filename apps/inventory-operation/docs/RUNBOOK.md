---
app: inventory-operation
doc_type: RUNBOOK
generated: true
---

# inventory-operation — Runbook

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Local development

```bash
cd /home/dev/projects/superapp-monorepo
npx turbo run dev --filter=inventory-operation
```

Verify at `http://<TAILSCALE_IP>:5175`.

## Build & test

```bash
npx turbo run check-types --filter=inventory-operation
npx turbo run lint --filter=inventory-operation
npx turbo run test --filter=inventory-operation
npx turbo run build --filter=inventory-operation
npm run test:e2e:inventory
```

Bulk Nhập hàng/Xuất hàng regression only:

```bash
npx playwright test --config apps/inventory-operation/playwright.config.ts \
  --grep "bulk CSV imports"
```

These tests run on Chromium and iPhone-sized WebKit. They enter trial mode,
upload two-row CSV files, verify spreadsheet date normalization, save both rows,
and confirm both product codes in recent records. They do not write to
production Supabase.

## Procurement acceptance

`/procurement` has two distinct workflows. A PO is planning data only and must
never change the inventory ledger. A supplier return starts as **Chờ duyệt**;
an `admin_company` or `admin_master` approves it, then completion writes one
outbound ledger row per return line. Before a real-data pilot, verify a PO
leaves XNT unchanged, an unapproved return cannot complete, and retrying a
completed return does not create another outbound row.

Migration `20260919173822_inventory_procurement_workflows.sql` is applied on
production. Do not use `db push --include-all` for this repository: its remote
migration history contains older intentional gaps. Apply any future reviewed
Inventory migration individually, then repair only that migration's history row.

Production bulk verification must run in a rollback transaction with an authenticated
company user: import inbound, retry the same batch ID, import outbound, assert the two
ledger rows use the product canonical unit and reconcile in XNT, then roll back. Never
leave test movements in production.

Before enabling multi-warehouse UI, apply and verify
`20260913013000_inventory_branch_unit_count_hardening.sql`, then complete a two-branch
acceptance run: source balance decreases, destination balance increases by the same
canonical quantity, the shared transfer ID links both records, retry/short-stock paths
do not create partial movements, and both branch-scoped users see only their branch.

Warehouse workspace behavior depends on active branch count: no active branch prompts
the company or system admin to create the first warehouse; one branch is automatic and keeps the
UI simple; two or more branches show the working-warehouse selector and atomic transfer
page to `admin_company` or `admin_master`. Migrations
`20260913021000_inventory_adaptive_warehouse_workspace.sql` and
`20260920164100_inventory_master_workspace_access.sql` provide the validated
create/select RPC used by the UI.
Creating the first warehouse also assigns previously unassigned company users and
unassigned inventory history to it. Operational lists and reports then follow the
selected or assigned branch; the product catalog remains company-wide.

Bulk inbound supplier matching is configured at **Cài đặt → Nhập / Xuất dữ liệu**.
Choosing **Tên nhà cung cấp** changes the grid and downloaded template from `Mã NCC`
to `Tên NCC`. Names are matched case-insensitively and must be unique in the company.
Migration `20260913170000_inventory_bulk_supplier_and_product_matching.sql` makes the
batch RPC respect product matching settings and persist the validated supplier link.

## Deploy

1. Push to `origin/viet` to create a Vercel preview deployment.
2. Wait for `readyState: READY`.
3. Use the *direct deployment URL* from `vercel ls` if the branch alias lags.
4. After verification, merge `viet` → `main` to deploy to `inventory.appforyou.xyz`.

## Supabase access token on this WSL host

The Supabase personal access token is stored outside the repository at:

```text
/home/dev/.supabase/access-token
```

- Read it only at runtime; never print it, copy it into a project `.env`, or add it to Git.
- The file must remain owned by the WSL `dev` user with mode `600`.
- To make it available to the CLI for the current shell without displaying it:

```bash
export SUPABASE_ACCESS_TOKEN="$(cat /home/dev/.supabase/access-token)"
```

- If the token is revoked, create a replacement in the Supabase account dashboard and overwrite this file from Windows Explorer at `\\wsl$\Ubuntu\home\dev\.supabase\access-token`.
- This repository has legacy migration-history gaps. Do not use `supabase db push --include-all`; review and apply only the intended new migration.

## Common issues

- `401 Unauthorized` on Supabase → check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match the same project.
- Trial mode fallback → verify `http://localhost:3001/health` is not reachable from the sandbox unless intended.
- `check-types` fails in `@repo/ui` → ensure `packages/ui/tsconfig.json` overrides `module` / `moduleResolution` to `ESNext` / `bundler`.

## Production support

- Production schema inspection confirmed that the objects from Inventory migrations `20260912230438`, `20260913013000`, `20260913021000`, `20260913170000`, and `20260915120000` already exist. Their exact remote history entries were repaired on 2026-09-19; do not apply the SQL again.
- The five migration files compile together and pass inbound, idempotent retry, outbound, XNT balance, two-branch transfer, stock-count approval, and RLS policy-count smoke checks in an isolated database on the local `insforge-postgres` container (verified 2026-09-17).
- Before a real-data pilot, verify that an `admin_company` from tenant A cannot select, insert, update, or delete tenant B rows across all six protected Inventory tables.

- Sentry captures runtime errors.
- DB migrations: `npx supabase migration new <name>` then `npx supabase db push` after review.
- Stock-count smoke test: create a session at `/stock-counts`, enter all physical counts, explain one variance, submit, approve, then confirm its adjustment ID appears and the XNT closing balance changes by the variance.
- If a product unit edit fails with `Không thể đổi đơn vị`, keep the historical product unchanged and create a new product/unit mapping; never rewrite historical transaction units.
