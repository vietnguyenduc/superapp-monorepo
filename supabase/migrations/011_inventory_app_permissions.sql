-- Migration: 011_inventory_app_permissions.sql
-- Description: Add app_permissions to users table for multi-app support
-- Date: 2026-05-01

-- Step 1: Add app_permissions column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS app_permissions JSONB DEFAULT '{"cashflow": true, "inventory": false}';

-- Step 2: Add comment for documentation
COMMENT ON COLUMN public.users.app_permissions IS 'App-level permissions: { cashflow: boolean, inventory: boolean } - Controls which apps a user can access';

-- Step 3: Create index for app_permissions (for filtering users by app access)
CREATE INDEX IF NOT EXISTS idx_users_app_permissions ON public.users USING GIN (app_permissions);

-- Step 4: Update existing users to have inventory access if they are admin_master
-- This allows admin_master to access both apps by default
UPDATE public.users 
SET app_permissions = '{"cashflow": true, "inventory": true}'::jsonb
WHERE role = 'admin_master' AND (app_permissions->>'inventory')::boolean = false;

-- Step 5: Create function to check if user has access to specific app
CREATE OR REPLACE FUNCTION has_app_access(user_id UUID, app_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id 
        AND (app_permissions->>app_name)::boolean = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger to ensure app_permissions is not null
CREATE OR REPLACE FUNCTION ensure_app_permissions_not_null()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.app_permissions IS NULL THEN
        NEW.app_permissions = '{"cashflow": true, "inventory": false}'::jsonb;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_app_permissions_not_null
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_app_permissions_not_null();
