# Branch Assignment Specification

## Admin Accounts
- Admin accounts (internal or customer directors) do NOT have a branch_id assigned
- Admins have system-wide access and can assign roles to staff accounts
- Admins can assign staff to one or multiple branches/offices

## Staff Accounts  
- Staff accounts MUST have branch_id assigned
- Staff can only access data from branches they are assigned to
- Staff can view their profile to see which branches/offices they have access to

## Customer Records
- Customer records MUST have a branch_id assigned (or null if not assigned to specific branch)
- Branch assignment determines which staff can view/manage the customer

## Database Schema Implications
- `users.branch_id`: NULL for admin, required for staff
- `customers.branch_id`: NULL allowed, but typically assigned to a branch
- RLS policies should respect branch assignments for staff, but allow admin full access

## Implementation Notes
- Import logic should allow admin to import customers without requiring their own branch_id
- Admin should be able to specify which branch customers belong to during import
- Staff imports should automatically use their assigned branch_id
