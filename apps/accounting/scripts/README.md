# QA Automation Scripts

This directory contains automation scripts for QA testing and data integrity monitoring.

## Scripts Overview

### 1. schema-verification.cjs
**Purpose:** Verify database schema matches expected structure

**Usage:**
```bash
node schema-verification.cjs
```

**What it checks:**
- Required fields exist and are NOT NULL
- Foreign key relationships are defined correctly
- Constraints (PRIMARY KEY, UNIQUE) are present

**Exit codes:**
- `0` - Schema verification passed
- `1` - Schema verification failed (critical issues)

**Run before:** Every deployment

---

### 2. field-mapping-validation.cjs
**Purpose:** Compare form fields with database schema

**Usage:**
```bash
node field-mapping-validation.cjs
```

**What it checks:**
- All required database fields are present in forms
- Foreign key fields have dropdown selectors
- No extra fields in forms
- Optional fields coverage

**Exit codes:**
- `0` - Field mapping validation passed
- `1` - Field mapping validation failed (critical issues)

**Run before:** Every deployment

---

### 3. test-data-journey.cjs
**Purpose:** Test complete data flow from import → backend → display

**Usage:**
```bash
node test-data-journey.cjs
```

**What it tests:**
- Form validation (required fields, foreign keys)
- Import data parsing
- Import validation
- Database schema
- Data insertion/update
- Data mapping for display
- Null handling
- Complete import flow
- Error recovery

**Exit codes:**
- `0` - All tests passed
- `1` - Some tests failed

**Run before:** Every deployment, after code changes

---

### 4. data-integrity-monitor.cjs
**Purpose:** Monitor data integrity in production

**Usage:**
```bash
node data-integrity-monitor.cjs
```

**What it checks:**
- Foreign key relationships (orphaned records)
- Null violations for required fields
- Unique constraint violations
- Data consistency
- Data volume

**Exit codes:**
- `0` - Data integrity check passed
- `1` - Critical data integrity issues found

**Run:** Regularly (e.g., daily, weekly) or on-demand

---

## Pre-Deployment Checklist

Before deploying to production, run:

```bash
# 1. Verify schema
node schema-verification.cjs

# 2. Validate field mapping
node field-mapping-validation.cjs

# 3. Run data journey tests
node test-data-journey.cjs

# 4. Monitor data integrity
node data-integrity-monitor.cjs
```

All scripts should exit with code `0` before deployment.

---

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: QA Automation
  run: |
    cd apps/cashflow/scripts
    node schema-verification.cjs
    node field-mapping-validation.cjs
    node test-data-journey.cjs
    node data-integrity-monitor.cjs
```

---

## Configuration

All scripts use environment variables:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Set these in your `.env` file or CI/CD secrets.

---

## Troubleshooting

### Script fails with "Could not retrieve schema"
- Check Supabase URL and key are correct
- Verify database connection
- Check network connectivity

### Script fails with "Form file not found"
- Verify file paths in script configuration
- Check that form files exist

### Script finds critical issues
- Review the detailed output
- Fix the issues before deployment
- Re-run the script to verify fixes

---

## Maintenance

**Regular tasks:**
- Update expected schema definitions when database changes
- Update form definitions when forms change
- Add new test cases for new features
- Review and update test data

**When to update:**
- After database schema changes
- After form changes
- After adding new features
- After fixing bugs

---

## Support

For issues or questions:
- Review the QA Test Plan: `../../docs/QA_DATA_JOURNEY_TEST_PLAN.md`
- Check Database Operations Checklist: `../../docs/DATABASE_OPERATIONS_CHECKLIST.md`
- Review Database Safety Guidelines: `../../docs/DATABASE_SAFETY_GUIDELINES.md`

---

**Last Updated:** 2026-04-26
**Version:** 1.0
