# Task Objective
A, migration

# Strategy Used
Direct self-healing command execution.

# Code Snippets (Skills)
🌐 *[INVENTORY-OPERATION]* _[DeepSeek]_

✅ **3 policies đã được tạo đúng:**

| Policy | Qual | Ghi chú |
|--------|------|---------|
| `users_select_own` | `auth.uid() = id` | ✅ User thấy chính mình |
| `users_select_admin` | `auth.uid() IN (SELECT id FROM users WHERE role = 'admin_master')` | ✅ Admin master thấy tất cả |
| `users_select_admin_company` | `EXISTS (SELECT 1 FROM users admin_user WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin_company' AND admin_user.company_id = users

# Lessons Learned
Execution completed with success=True and complexity=medium.