# Cashflow Runbook

Operational commands and troubleshooting for the Cashflow app.

## Local Supabase RLS simulation from a cloud dump

The `supabase/migrations/` chain in this repo has duplicate version prefixes and ordering bugs, so `npx supabase start` cannot currently bootstrap a production-like schema from migrations alone. To test Supabase RLS policies locally before any Vercel deploy, use a cloud schema dump.

### Prerequisites

- Docker running.
- A Supabase cloud schema dump, e.g. `/tmp/supa_dump.sql` (created with `supabase db dump` or `pg_dump` from the cloud project).
- `psql` installed locally.

### One-command start

```bash
SUPABASE_DUMP=/tmp/supa_dump.sql scripts/supabase-local-from-dump.sh
```

The script will:

1. Back up `supabase/migrations/` to a temp dir and create an empty `supabase/migrations/` so `npx supabase start` does not try to apply the broken migration chain.
2. Start the full local Supabase stack (Postgres, GoTrue, PostgREST, Studio, etc.).
3. Restore the dump into the local Postgres.
4. Create a test company + `admin_master` user.
5. Print the local `API_URL`, `ANON_KEY`, and a valid JWT.
6. Restore the original `supabase/migrations/` directory.

### Verify RLS is working

After the script finishes, the test user is `admin_master` and sees all rows. To test tenant isolation, change the user's role/company and query again:

```bash
# Set user to admin_company scoped to a specific company
PGPASSWORD=postgres psql \
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "UPDATE public.users SET role='admin_company', company_id='33333333-3333-3333-3333-333333333333' WHERE email='test@example.com';"

# Then query with the JWT printed by the script
curl -s "http://127.0.0.1:54321/rest/v1/customers?select=id,full_name,company_id" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <JWT>"
```

If `admin_master`, all customers are returned. If `admin_company` with `company_id` set, only that company's customers are returned.

### Connect the Cashflow app

Create `apps/cashflow/.env.local`:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
```

Then start Vite on the WSL host (do **not** start it in the sandbox):

```bash
npm run dev -w cashflow
```

Use the Tailscale IP + port from the sandbox browser, e.g. `http://<TAILSCALE_IP>:5174`.

### Stop the local stack

```bash
npx supabase stop --no-backup
```

`--no-backup` removes the data volume so the next `scripts/supabase-local-from-dump.sh` run starts from a clean schema.

### Troubleshooting

- **PostgREST `PGRST301` (cannot decode JWT)**: the local GoTruth key may have rotated after start. Stop with `npx supabase stop --no-backup` and rerun the script.
- **`psql` dump errors like `already exists`**: the data volume still contains a previous schema. Stop with `--no-backup` and rerun.
- **`npx supabase start` still applies migrations**: make sure `supabase/migrations/` is empty while the script runs. The script moves it aside automatically.
