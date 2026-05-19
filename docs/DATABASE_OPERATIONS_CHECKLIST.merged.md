# Database Operations Checklist

**CRITICAL:** This checklist MUST be followed for ANY database operation. Failure to follow this checklist can result in data integrity violations and data corruption.

## 🚨 BEFORE ANY DATABASE CHANGE

### Step 1: Schema Verification (MANDATORY)
- [ ] **Read database schema** using MCP Supabase tools
  - Use `mcp5_list_tables` to see all tables
  - Use `mcp5_list_tables` with `verbose: true` to see column details
  - Verify ALL required fields, data types, and constraints
- [ ] **Check foreign key relationships**
  - Identify all foreign key fields
  - Verify referenced tables exist
  - Understand relationship constraints (CASCADE, SET NULL, etc.)
- [ ] **Verify field requirements**
  - Which fields are required (NOT NULL)?
  - Which fields have default values?
  - Which fields are optional (NULL allowed)?

### Step 2: Form-to-Database Mapping Verification
- [ ] **Map form fields to database fields**
  - Create a mapping document: form_field -> database_field
  - Verify ALL database fields are covered in the form
  - Verify data types match (string vs number, date format, etc.)
- [ ] **Check for missing fields**
  - Are there database fields NOT in the form?
  - Are there form fields NOT in the database?
  - Resolve ALL mismatches before proceeding

### Step 3: Backup & Rollback Plan (CRITICAL for Mass Updates)
- [ ] **Create backup plan**
  - Export current data before mass updates
  - Save rollback SQL script
  - Test rollback script on test data
- [ ] **Verify WHERE clause for updates**
  - NEVER use `UPDATE table SET field = value` without WHERE
  - Always use specific conditions: `UPDATE table SET field = value WHERE id = 'specific-id'`
  - Count affected rows before executing

## 🔧 DURING DEVELOPMENT

### Step 4: Form Implementation
- [ ] **Include ALL database fields in forms**
  - Required fields: Must have input controls
  - Foreign key fields: Must have dropdown/select with data from referenced table
  - Optional fields: Include but allow empty/NULL
- [ ] **Verify field binding**
  - Each form field must be bound to state
  - State must match database field names/types
  - onChange handlers must update state correctly

### Step 5: Backend Implementation
- [ ] **Include ALL fields in API calls**
  - INSERT: All required fields must be sent
  - UPDATE: All changed fields must be sent
  - Verify field names match database exactly
- [ ] **Handle NULL cases explicitly**
  - Optional fields: Send `null` or `undefined` when empty
  - Required fields: Validate before sending
  - Foreign keys: Verify referenced record exists

### Step 6: Testing with Real Data
- [ ] **Test INSERT with actual data**
  - Create test record via form
  - Check database to verify all fields saved correctly
  - Verify foreign key relationships work
- [ ] **Test UPDATE with actual data**
  - Edit existing record via form
  - Check database to verify only intended fields changed
  - Verify no unintended side effects
- [ ] **Use console.log for debugging**
  - Log form data before sending
  - Log API response
  - Log database query results

## ⚠️ BEFORE MASS UPDATES (CRITICAL)

### Step 7: Mass Update Safety
- [ ] **NEVER update ALL records without WHERE**
  - ❌ `UPDATE transactions SET customer_id = 'some-id'`
  - ✅ `UPDATE transactions SET customer_id = 'some-id' WHERE id = 'specific-id'`
- [ ] **Test on single record first**
  - Run update on one test record
  - Verify result is correct
  - Check for side effects
- [ ] **Verify count of affected rows**
  - Run `SELECT COUNT(*) FROM table WHERE conditions` first
  - Confirm count is expected
  - Only proceed if count is reasonable
- [ ] **Have rollback SQL ready**
  - Write rollback script before executing
  - Test rollback script
  - Keep rollback script for emergency use

## 🔍 FOR FOREIGN KEY FIELDS

### Step 8: Foreign Key Safety
- [ ] **Always include dropdown/select**
  - Load data from referenced table
  - Display user-friendly name (e.g., customer name, not ID)
  - Store the ID as the value
- [ ] **Never hardcode foreign key values**
  - ❌ `customer_id: '22dab687-eb15-4692-9c5f-1d46b7af98c8'`
  - ✅ `customer_id: selectedCustomer.id` (from user selection)
- [ ] **Verify referenced record exists**
  - Before saving, check if referenced record still exists
  - Handle case where referenced record was deleted
  - Provide user feedback if reference is invalid
- [ ] **Handle NULL explicitly**
  - If field is optional, allow user to select "None"
  - Send `null` when user selects "None"
  - Don't send empty string for optional fields

## 📋 SPECIFIC RULES FOR THIS PROJECT

### Transaction Table
- [ ] `customer_id`: MUST be in form, dropdown to select customer
- [ ] `bank_account_id`: MUST be in form, dropdown to select account
- [ ] `branch_id`: MUST be in form, dropdown to select branch
- [ ] `created_by`: Auto-populated from auth, NEVER manually assign
- [ ] `transaction_date`: Date picker, required
- [ ] `transaction_type`: Dropdown from transaction_types table
- [ ] `amount`: Number input, required
- [ ] `description`: Text area, optional

### Customer Table
- [ ] `customer_code`: Auto-generated or user input, required, must be unique
- [ ] `full_name`: Text input, required
- [ ] `phone`: Text input, required, format validation
- [ ] `email`: Text input, optional, format validation
- [ ] `address`: Text area, optional

### Bank Account Table
- [ ] `account_name`: Text input, required
- [ ] `account_number`: Text input, required, must be unique
- [ ] `bank_name`: Text input, required

### Branch Table
- [ ] `name`: Text input, required
- [ ] `code`: Text input, required, must be unique

## 🚫 NEVER DO

1. **NEVER update ALL records without WHERE clause**
   - ❌ `UPDATE table SET field = value`
   - ✅ `UPDATE table SET field = value WHERE id = 'specific-id'`

2. **NEVER assign arbitrary foreign key values**
   - ❌ `customer_id: 'random-id-from-nowhere'`
   - ✅ `customer_id: userSelectedCustomerId`

3. **NEVER assume field exists without checking schema**
   - ❌ "I think customer_id is in the transactions table"
   - ✅ "I checked schema: customer_id exists and is required"

4. **NEVER make mass data changes without backup**
   - ❌ Update 10,000 records without backup
   - ✅ Export data, create rollback script, then update

5. **NEVER skip database verification before code changes**
   - ❌ Write code first, check database later
   - ✅ Check schema first, then write code

6. **NEVER hardcode values that should come from user input**
   - ❌ `customer_id: '22dab687-eb15-4692-9c5f-1d46b7af98c8'`
   - ✅ `customer_id: form.customer_id`

## ✅ ALWAYS DO

1. **ALWAYS use MCP Supabase tools to read schema first**
   - `mcp5_list_tables` - see all tables
   - `mcp5_list_tables` with `verbose: true` - see column details
   - `mcp5_execute_sql` - run queries to verify data

2. **ALWAYS verify form includes ALL database fields**
   - Create mapping document
   - Check each field is present in form
   - Verify data types match

3. **ALWAYS test with real data before deployment**
   - Create test record
   - Edit existing record
   - Verify in database

4. **ALWAYS create rollback plan for mass operations**
   - Write rollback SQL
   - Test rollback
   - Keep for emergency

5. **ALWAYS audit changes after deployment**
   - Check affected rows count
   - Verify data integrity
   - Check for side effects

## 📝 POST-OPERATION VERIFICATION

### After INSERT
- [ ] Verify record exists in database
- [ ] Check all fields saved correctly
- [ ] Verify foreign key relationships work
- [ ] Check no unintended side effects

### After UPDATE
- [ ] Verify only intended fields changed
- [ ] Check other fields unchanged
- [ ] Verify foreign key relationships still valid
- [ ] Check no unintended side effects

### After DELETE
- [ ] Verify record is deleted
- [ ] Check cascade effects (if applicable)
- [ ] Verify no orphaned records
- [ ] Check no unintended side effects

## 🎯 CRITICAL REMINDERS

1. **Data integrity is sacred** - never compromise for convenience
2. **User data is sacred** - never arbitrarily modify without explicit request
3. **Assumptions are dangerous** - always verify with actual database
4. **Mass updates are dangerous** - always have rollback plan
5. **Foreign keys are relationships** - never assign arbitrarily
6. **Testing is mandatory** - never skip verification

## 📞 EMERGENCY PROCEDURES

If you realize you made a critical mistake:
1. **STOP** immediately - don't make more changes
2. **ASSESS** the damage - what was affected?
3. **ROLLBACK** if possible - use your rollback script
4. **NOTIFY** the user immediately - be transparent
5. **DOCUMENT** the mistake - what happened and why
6. **PREVENT** recurrence - update checklists and procedures

---

**Last Updated:** 2026-04-26
**Version:** 1.0
**Status:** MANDATORY for all database operations
