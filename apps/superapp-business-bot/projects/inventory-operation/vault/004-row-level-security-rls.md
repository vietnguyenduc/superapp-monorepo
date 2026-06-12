# ADR 004: Implement Row-Level Security (RLS)

## Status
Accepted

## Context
Multi-user system requires data access control. Need to decide security strategy.

Options considered:
1. Application-level security (check permissions in code)
2. Database-level security (RLS policies)
3. Both application and database security

## Decision
Implement Row-Level Security (RLS) policies at database level with application-level permission checks for UI features.

## Rationale

### Why RLS at Database Level
- **Security:** Cannot bypass database-level security
- **Consistency:** Same security rules across all access methods
- **Performance:** Database engine enforces rules efficiently
- **Simplicity:** Centralized security logic
- **Audit:** All access attempts logged at database level

### Why Application-Level Checks Too
- **UI Features:** Hide/show features based on permissions
- **Better UX:** Don't show buttons user can't use
- **Performance:** Avoid unnecessary database queries
- **User Feedback:** Clear permission errors

### RLS Policy Pattern
```sql
-- Users can access their own records
CREATE POLICY user_own_data ON table_name
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id);

-- Admins can access all records
CREATE POLICY admin_all_data ON table_name
FOR ALL TO authenticated
USING (
  auth.uid()::uuid IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);
```

## Consequences

### Positive
- Robust security at data layer
- Consistent access control
- Simplified application code
- Better audit trail
- Centralized security management

### Negative
- More complex database setup
- Learning curve for RLS policies
- Debugging can be more difficult
- Performance overhead for complex policies

### Mitigation
- Document RLS policies clearly
- Test policies thoroughly
- Monitor policy performance
- Use indexes for policy queries

## Implementation

### RLS Enablement
```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_records ENABLE ROW LEVEL SECURITY;
```

### Policy Examples
```sql
-- Product access
CREATE POLICY products_select ON products
FOR SELECT TO authenticated
USING (true);  -- Products are public within company

-- Inventory record access
CREATE POLICY inventory_select ON inventory_records
FOR SELECT TO authenticated
USING (
  branch_id IN (
    SELECT branch_id FROM users WHERE id = auth.uid()
  )
);
```

## Alternatives Considered
- **Application-Only:** Rejected due to security bypass risk
- **Database-Only:** Rejected due to poor UX

## References
- Supabase RLS Guide: https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL RLS Documentation: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
