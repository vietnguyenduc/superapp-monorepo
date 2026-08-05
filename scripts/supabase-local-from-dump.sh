#!/usr/bin/env bash
set -euo pipefail

# Start a local Supabase stack from a production schema dump and test RLS locally.
# This bypasses the repo's broken migration chain (duplicate versions / ordering issues)
# and gives you the exact production schema + RLS policies on your machine.
#
# Usage:
#   SUPABASE_DUMP=/tmp/supa_dump.sql scripts/supabase-local-from-dump.sh
#
# The script:
# 1. Backs up supabase/migrations to a temp dir and uses an empty migrations dir so
#    `npx supabase start` does not try to apply the broken migration chain.
# 2. Starts the local Supabase stack (Postgres + GoTrue + PostgREST + Studio).
# 3. Restores the dump into the local Postgres.
# 4. Creates a test company + user so you can hit the REST API with a real JWT.
# 5. Restores the original supabase/migrations dir.

DUMP_FILE="${SUPABASE_DUMP:-/tmp/supa_dump.sql}"
if [[ ! -f "$DUMP_FILE" ]]; then
  echo "ERROR: Dump file not found: $DUMP_FILE"
  echo "Set SUPABASE_DUMP to a valid pg_dump / supabase db dump file."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "[1/5] Backing up supabase/migrations..."
MIGRATIONS_BACKUP=$(mktemp -d "$ROOT/supabase/.tmp-migrations-XXXXXX")
mv "$ROOT/supabase/migrations" "$MIGRATIONS_BACKUP/"
mkdir -p "$ROOT/supabase/migrations"

cleanup() {
  echo "[cleanup] Restoring supabase/migrations..."
  rm -rf "$ROOT/supabase/migrations"
  mv "$MIGRATIONS_BACKUP/migrations" "$ROOT/supabase/migrations"
  rmdir "$MIGRATIONS_BACKUP" 2>/dev/null || true
}
trap cleanup EXIT

echo "[2/5] Starting Supabase local stack (this may take 1-2 minutes)..."
npx supabase stop --no-backup >/dev/null 2>&1 || true
npx supabase start

echo "[3/5] Loading dump into local Postgres..."
STATUS_JSON=$(npx supabase status --output json)
DB_URL=$(echo "$STATUS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['DB_URL'])")
API_URL=$(echo "$STATUS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['API_URL'])")
ANON_KEY=$(echo "$STATUS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['ANON_KEY'])")

export PGPASSWORD=postgres
psql "$DB_URL" -f "$DUMP_FILE" >/dev/null

echo "[4/5] Creating a test company and admin_master user..."
COMPANY_ID="11111111-1111-1111-1111-111111111111"
USER_ID="b6e92994-39cf-4f95-850b-70c6972a9f29"
USER_EMAIL="test@example.com"
USER_PASSWORD="password123"

psql "$DB_URL" -c "
INSERT INTO public.companies (id, name, code, is_active)
VALUES ('$COMPANY_ID', 'Local Test Co', 'LOCALTEST', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO auth.users (id, email, email_confirmed_at, raw_app_meta_data, created_at, updated_at)
VALUES ('$USER_ID', '$USER_EMAIL', now(), '{\"provider\":\"email\",\"providers\":[\"email\"]}'::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, full_name, role, company_id, is_active, app_permissions)
VALUES ('$USER_ID', '$USER_EMAIL', 'Local Test User', 'admin_master', '$COMPANY_ID', true, '{\"cashflow\": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;
" >/dev/null

echo "[5/5] Getting a JWT for the test user..."
ACCESS_TOKEN=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo ""
echo "=== Local Supabase is ready ==="
echo "Studio:    http://127.0.0.1:54323"
echo "REST API:  $API_URL/rest/v1"
echo "Anon key:  $ANON_KEY"
echo "Test JWT:  $ACCESS_TOKEN"
echo ""
echo "Example RLS test:"
echo "  curl -s '$API_URL/rest/v1/customers' \\"
echo "    -H 'apikey: $ANON_KEY' \\"
echo "    -H 'Authorization: Bearer $ACCESS_TOKEN'"
