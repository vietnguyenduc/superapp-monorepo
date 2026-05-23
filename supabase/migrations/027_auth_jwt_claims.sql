-- Migration: 027_auth_jwt_claims.sql
-- Description: Create Custom JWT Access Token Hook to inject role and app_permissions
-- Note: After running this migration, you MUST manually enable the Custom Access Token Hook 
-- in the Supabase Dashboard (Authentication -> Hooks -> Custom access token) and point it 
-- to this function `public.custom_access_token_hook`.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
  DECLARE
    claims jsonb;
    user_role text;
    app_perms jsonb;
  BEGIN
    -- Fetch the user's role and permissions from the public.users table
    SELECT role::text, app_permissions INTO user_role, app_perms
    FROM public.users
    WHERE id = (event->>'user_id')::uuid;

    claims := event->'claims';

    IF user_role IS NOT NULL THEN
      -- Inject role and app_permissions directly into app_metadata so our frontend can read it
      -- and so RLS policies can use auth.jwt() -> 'app_metadata' -> 'role'
      claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role));
      
      IF app_perms IS NOT NULL THEN
        claims := jsonb_set(claims, '{app_metadata, app_permissions}', app_perms);
      END IF;

      -- Update the 'claims' object in the original event
      event := jsonb_set(event, '{claims}', claims);
    END IF;

    RETURN event;
  END;
$$;

-- Grant execution to supabase_auth_admin (required for the hook to run)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Optional: Create a helper function for RLS policies to easily read the custom claims
CREATE OR REPLACE FUNCTION public.get_jwt_claim(claim_key text)
RETURNS jsonb
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'app_metadata' -> claim_key,
    null
  );
$$;
