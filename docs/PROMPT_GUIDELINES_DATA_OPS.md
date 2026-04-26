# Prompt Guidelines for Data Operations

**CRITICAL:** These guidelines MUST be followed when creating or responding to prompts involving database operations to prevent data integrity violations.

## 🚨 MANDATORY PROMPT INCLUSIONS

### For ANY Database-Related Request

When the user asks for database-related work, the prompt MUST include:

```
MANDATORY PRE-OPERATION CHECKLIST:
1. Read database schema using MCP Supabase tools
2. Verify ALL required fields for the table
3. Check form-to-database field mapping is complete
4. Verify foreign key relationships and constraints
5. Create backup/rollback plan for mass updates
6. Test with real data before deployment
```

### For Form Creation/Modification

When creating or modifying forms:

```
FORM REQUIREMENTS:
- Include ALL database fields in form (no missing fields)
- Foreign key fields MUST have dropdown/select with data from referenced table
- Verify each field is properly bound to state
- Verify data types match database schema
- Handle NULL cases explicitly for optional fields
- Test form submission with actual data
```

### For Mass Data Operations

When performing mass updates/inserts:

```
MASS OPERATION SAFETY:
- NEVER update ALL records without specific WHERE clause
- Always use WHERE clause with specific conditions
- Test on single record first
- Verify count of affected rows before executing
- Have rollback SQL ready
- Create backup before execution
```

## 📋 PROMPT TEMPLATE FOR DATA OPERATIONS

### Template for New Feature with Database

```
You are working on [feature name] which involves database operations.

BEFORE YOU START:
1. Use MCP Supabase tools to read the database schema:
   - mcp5_list_tables to see all tables
   - mcp5_list_tables with verbose: true to see column details
   - Verify ALL required fields, data types, and constraints
   - Check foreign key relationships

2. Create form-to-database mapping document:
   - List ALL database fields
   - Map each form field to database field
   - Verify data types match
   - Identify foreign key fields

3. For foreign key fields:
   - MUST include dropdown/select
   - Load data from referenced table
   - Display user-friendly name
   - Store the ID as value

4. Testing requirements:
   - Test with real data before deployment
   - Verify in database after insert/update
   - Check all fields saved correctly

5. Safety measures:
   - Never mass-update without WHERE clause
   - Create rollback plan for mass operations
   - Verify affected row count before executing

DO NOT:
- Assume field exists without checking schema
- Hardcode foreign key values
- Make mass data changes without backup
- Skip database verification

ALWAYS:
- Use MCP Supabase tools to verify schema
- Verify form includes ALL database fields
- Test with real data
- Create rollback plan for mass operations
- Prioritize data integrity over convenience
```

### Template for Bug Fix Involving Data

```
You are fixing a bug in [feature] which involves data operations.

BEFORE MAKING CHANGES:
1. Investigate the root cause:
   - Check database schema for the affected table
   - Verify form-to-database field mapping
   - Check if all fields are included in form
   - Verify foreign key relationships

2. Use MCP Supabase tools:
   - mcp5_list_tables to verify schema
   - mcp5_execute_sql to inspect actual data
   - Verify data integrity before fix

3. Fix verification:
   - Test fix with real data
   - Verify in database after fix
   - Check for side effects
   - Ensure no data corruption

4. Safety measures:
   - Create backup before fix
   - Have rollback plan ready
   - Test on single record first if mass operation

CRITICAL REMINDERS:
- Data integrity is sacred
- Never compromise data integrity for convenience
- User data is sacred - never arbitrarily modify
- Always verify with actual database, not assumptions
```

## 🚨 RED FLAGS IN PROMPTS

### Prompts That Require Extra Caution

If you see these in prompts, exercise extreme caution:

- "Update all transactions to..."
- "Set customer_id to..." without specifying which records
- "Fix data by assigning..."
- "Quick fix for..."
- "Just update the database..."
- "Don't worry about the schema..."

### Required Response to Red Flags

```
I cannot proceed with mass data updates without:
1. Specific WHERE clause to identify affected records
2. Verification of affected row count
3. Rollback plan
4. User confirmation of the specific records to update

Please provide:
- Which specific records should be updated?
- What criteria should be used (WHERE clause)?
- What is the expected count of affected rows?
- Do you have a backup of the data?
```

## 📝 PROMPT ENHANCEMENT CHECKLIST

### Before Responding to Any Data-Related Prompt

- [ ] Does the prompt mention database schema verification?
- [ ] Does the prompt mention field mapping?
- [ ] Does the prompt mention foreign key handling?
- [ ] Does the prompt mention testing with real data?
- [ ] Does the prompt mention rollback plan?
- [ ] Does the prompt mention data integrity?

### If Any Checklist Item is Missing

Add to your response:

```
ADDITIONAL REQUIREMENTS:
Before proceeding, I must:
1. Verify database schema using MCP Supabase tools
2. Create field mapping document
3. Ensure all foreign keys have dropdowns
4. Test with real data
5. Create rollback plan if mass operation

This ensures data integrity and prevents data corruption.
```

## 🎯 SPECIFIC GUIDELINES FOR COMMON TASKS

### Creating a New Form

```
When creating a new form:

1. Schema Verification (MANDATORY):
   - Use mcp5_list_tables to read schema
   - Identify ALL required fields
   - Identify ALL foreign key fields
   - Verify data types and constraints

2. Form Design:
   - Include ALL database fields
   - Foreign keys: dropdown with data from referenced table
   - Required fields: validation
   - Optional fields: allow NULL
   - Data types: match database schema

3. Testing:
   - Test form submission
   - Verify in database
   - Check all fields saved
   - Verify foreign key relationships

4. Documentation:
   - Create field mapping document
   - Document any assumptions
   - Document testing results
```

### Modifying an Existing Form

```
When modifying an existing form:

1. Current State Analysis:
   - Read current form code
   - Check current field mapping
   - Verify database schema hasn't changed
   - Identify missing fields

2. Modification Plan:
   - List all changes
   - Verify no fields will be missing
   - Ensure foreign keys still have dropdowns
   - Plan testing approach

3. Testing:
   - Test modified form
   - Verify in database
   - Check no data corruption
   - Verify no side effects

4. Rollback:
   - Have previous version ready
   - Test rollback if needed
```

### Fixing Data Issues

```
When fixing data issues:

1. Root Cause Analysis:
   - Use mcp5_execute_sql to inspect data
   - Identify pattern of corruption
   - Determine scope of issue
   - Assess data integrity impact

2. Fix Strategy:
   - Prefer single-record fixes
   - If mass operation needed: specific WHERE clause
   - Verify affected row count
   - Create rollback SQL

3. Execution:
   - Test on single record first
   - Verify result is correct
   - Execute mass operation if needed
   - Verify no side effects

4. Post-Fix Verification:
   - Check data integrity
   - Verify relationships still valid
   - Check reports/calculations
   - Document the fix
```

## 🔍 AGENT BEHAVIOR GUIDELINES

### When User Requests Data Operations

1. **Always verify schema first**
   - Use MCP Supabase tools
   - Don't assume structure
   - Document findings

2. **Always create field mapping**
   - Map form fields to database
   - Verify completeness
   - Check data types

3. **Always test with real data**
   - Don't rely on assumptions
   - Verify in database
   - Check all fields

4. **Always have rollback plan**
   - For mass operations
   - Test rollback script
   - Keep for emergency

5. **Never compromise data integrity**
   - Prioritize safety over speed
   - Verify before execute
   - Document everything

### When User Requests Quick Fixes

1. **Assess the risk**
   - Is this a mass operation?
   - Will it affect data integrity?
   - Is rollback possible?

2. **Explain the risk**
   - Be transparent
   - Provide alternatives
   - Get explicit confirmation

3. **Implement safely**
   - Test first
   - Verify results
   - Have rollback ready

### When User Says "Don't Worry About Schema"

1. **Politely insist on verification**
   - Explain why it's critical
   - Reference data integrity
   - Cite previous incidents

2. **Verify schema anyway**
   - Use MCP tools
   - Document findings
   - Proceed with verification

3. **Educate the user**
   - Explain the risks
   - Show the benefits
   - Build trust through safety

## 📞 EMERGENCY RESPONSE PROTOCOLS

### If You Realize You Made a Data Integrity Mistake

1. **STOP immediately**
   - Don't make more changes
   - Don't try to fix without understanding

2. **ASSESS the damage**
   - What was affected?
   - How many records?
   - What is the impact?

3. **ROLLBACK if possible**
   - Use rollback script
   - Restore from backup
   - Document rollback

4. **NOTIFY user immediately**
   - Be transparent
   - Explain impact
   - Provide recovery plan

5. **DOCUMENT the mistake**
   - What happened?
   - Why did it happen?
   - How to prevent?

6. **PREVENT recurrence**
   - Update guidelines
   - Update checklists
   - Improve procedures

## 🎯 QUALITY GATES

### Before Submitting Any Data-Related Work

- [ ] Schema verified with MCP tools
- [ ] Field mapping document created
- [ ] All database fields included in form
- [ ] Foreign keys have dropdowns
- [ ] Tested with real data
- [ ] Verified in database
- [ ] Rollback plan created (if mass operation)
- [ ] Documentation complete

### If Any Gate Fails

Do not proceed. Address the failure first. Data integrity is non-negotiable.

---

**Last Updated:** 2026-04-26
**Version:** 1.0
**Status:** MANDATORY for all data operation prompts
