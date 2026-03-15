# SYSTEM CONSTRAINTS

Last Updated:

Owner:

---

# CORE BUSINESS LOGIC

List logic that must not change.

Example

Portfolio holdings calculation.

---

# DATABASE CONSTRAINTS

Rules for database.

Example

Do not rename columns.  
Use migrations for schema changes.

---

# API CONTRACTS

Stable API endpoints.

Example

POST /api/import-transactions

Payload format must remain stable.

---

# AUTHENTICATION RULES

Example

All queries must filter by user_id.

---

# SECURITY RULES

Example

Never expose API keys in frontend.

---

# PROTECTED MODULES

Files that should not be refactored.

Example

portfolio_calculation.ts
auth_middleware.ts