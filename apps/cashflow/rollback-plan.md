
# Rollback Procedures for Critical Infrastructure
# Date: 2026-03-23

## Rollback Triggers:
- System becomes unstable after fixes
- RLS policies cause unexpected issues
- User creation fails repeatedly
- Performance degradation

## Rollback Steps:
1. Stop application if running
2. Restore database backup (if created)
3. Revert RLS policies to previous state
4. Test system stability
5. Document rollback reasons
6. Notify team of rollback

## Rollback SQL (if needed):
-- Revert problematic changes
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_delete_policy ON users;

-- Restore previous policies (if available)
-- CREATE POLICY users_policy ON users...
