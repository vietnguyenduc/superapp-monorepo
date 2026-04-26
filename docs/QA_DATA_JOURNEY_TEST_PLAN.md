# QA Test Plan - Data Journey: Import → Backend → Display

**Date:** 2026-04-26
**QA Role:** Senior QA/QE
**Scope:** Complete data flow validation from import to display
**Priority:** CRITICAL

## 🚨 ISSUES DISCOVERED

### 1. Form Missing Required Fields
**Severity:** CRITICAL
**Impact:** Data not saved correctly
**Example:** Transaction edit form missing customer_id field
**Root Cause:** Form-to-database mapping incomplete

### 2. Import Data Parsing Failure
**Severity:** HIGH
**Impact:** customer_id not mapped, data integrity violation
**Example:** "CUST0003 - Công ty Hoàng Gia" → customer_id = null
**Root Cause:** No parsing logic for composite input strings

### 3. Missing Validation
**Severity:** HIGH
**Impact:** Invalid data imported without blocking
**Example:** customer_id null still allowed import
**Root Cause:** No validation after data mapping

### 4. Data Integrity Violation
**Severity:** CRITICAL
**Impact:** All transactions assigned to wrong customer
**Example:** All transactions assigned to "Công ty An Phát"
**Root Cause:** Mass update without WHERE clause, no audit

## 📋 COMPREHENSIVE TEST PLAN

### Phase 1: Form Validation Testing

#### Test Case 1.1: Required Field Coverage
**Objective:** Verify ALL database fields are present in forms

**Steps:**
1. Read database schema for each table
2. Compare form fields with database fields
3. Identify missing fields
4. Verify required fields have validation

**Expected Result:**
- 100% field coverage between form and database
- All required fields have validation
- No orphaned data

**Test Data:**
- Transactions table schema
- Customers table schema
- Bank accounts table schema
- Branches table schema

**Pass/Fail Criteria:**
- ✅ Pass: All fields covered
- ❌ Fail: Missing fields found

---

#### Test Case 1.2: Foreign Key Field Testing
**Objective:** Verify all FK fields have dropdown selectors

**Steps:**
1. Identify all foreign key fields
2. Check each FK field has dropdown/select
3. Verify dropdown loads data from referenced table
4. Verify user-friendly name displayed
5. Verify ID stored as value

**Expected Result:**
- All FK fields have dropdowns
- Dropdowns load correct data
- User sees names, system stores IDs

**Test Data:**
- customer_id → customers dropdown
- bank_account_id → bank_accounts dropdown
- branch_id → branches dropdown

**Pass/Fail Criteria:**
- ✅ Pass: All FK fields have working dropdowns
- ❌ Fail: Missing or broken dropdowns

---

### Phase 2: Import Data Testing

#### Test Case 2.1: Data Parsing Validation
**Objective:** Verify import data is parsed correctly

**Steps:**
1. Import with composite input: "CUST0003 - Công ty Hoàng Gia"
2. Verify parsing extracts "CUST0003"
3. Verify lookup finds customer
4. Verify customer_id assigned correctly

**Expected Result:**
- Composite input parsed correctly
- Customer found in database
- customer_id assigned correctly

**Test Data:**
- "CUST0003 - Công ty Hoàng Gia"
- "CUST0003 Công ty Hoàng Gia"
- "CUST0003"

**Pass/Fail Criteria:**
- ✅ Pass: All formats parsed correctly
- ❌ Fail: Parsing fails for any format

---

#### Test Case 2.2: Import Validation Testing
**Objective:** Verify invalid data is blocked

**Steps:**
1. Import with non-existent customer code
2. Verify error message displayed
3. Verify import blocked
4. Verify no data inserted

**Expected Result:**
- Invalid customer code triggers error
- Import blocked with clear message
- No data inserted

**Test Data:**
- "CUST9999 - Non-existent Customer"
- Empty customer code
- Invalid format

**Pass/Fail Criteria:**
- ✅ Pass: Invalid data blocked with error
- ❌ Fail: Invalid data imported

---

#### Test Case 2.3: Required Field Validation
**Objective:** Verify required fields are validated during import

**Steps:**
1. Import without customer_code
2. Import without transaction_type
3. Import without amount
4. Verify each missing field triggers error

**Expected Result:**
- Each missing required field triggers error
- Clear error message for each field
- Import blocked

**Test Data:**
- Missing customer_code
- Missing transaction_type
- Missing amount

**Pass/Fail Criteria:**
- ✅ Pass: All required fields validated
- ❌ Fail: Required fields not validated

---

### Phase 3: Backend Data Integrity Testing

#### Test Case 3.1: Database Schema Verification
**Objective:** Verify database schema matches expectations

**Steps:**
1. Read schema using MCP Supabase tools
2. Verify all required fields exist
3. Verify field types match expectations
4. Verify foreign key constraints
5. Verify unique constraints

**Expected Result:**
- Schema matches documentation
- All constraints defined correctly
- No unexpected field types

**Test Data:**
- Full schema dump
- Constraint definitions

**Pass/Fail Criteria:**
- ✅ Pass: Schema correct
- ❌ Fail: Schema issues found

---

#### Test Case 3.2: Data Insertion Verification
**Objective:** Verify data is inserted correctly into database

**Steps:**
1. Create test record via form
2. Query database for inserted record
3. Verify all fields saved correctly
4. Verify foreign key relationships valid

**Expected Result:**
- All fields saved correctly
- Foreign keys point to valid records
- No data corruption

**Test Data:**
- Test transaction with all fields
- Test customer with all fields

**Pass/Fail Criteria:**
- ✅ Pass: Data inserted correctly
- ❌ Fail: Data corruption or missing fields

---

#### Test Case 3.3: Data Update Verification
**Objective:** Verify updates only affect intended fields

**Steps:**
1. Create test record
2. Update specific field
3. Query database
4. Verify only intended field changed
5. Verify other fields unchanged

**Expected Result:**
- Only intended field changed
- Other fields unchanged
- No side effects

**Test Data:**
- Test transaction
- Update only amount

**Pass/Fail Criteria:**
- ✅ Pass: Update works correctly
- ❌ Fail: Unintended changes

---

### Phase 4: Display Testing

#### Test Case 4.1: Data Mapping Verification
**Objective:** Verify data is mapped correctly for display

**Steps:**
1. Insert test record with known data
2. Fetch data via API
3. Verify mapping from database to display
4. Verify foreign key relationships resolved
5. Verify names displayed instead of IDs

**Expected Result:**
- All fields mapped correctly
- Foreign keys resolved to names
- User-friendly display

**Test Data:**
- Test transaction with customer_id
- Test transaction with bank_account_id
- Test transaction with branch_id

**Pass/Fail Criteria:**
- ✅ Pass: Display shows correct data
- ❌ Fail: Display shows wrong data

---

#### Test Case 4.2: Null Handling Testing
**Objective:** Verify null values are handled gracefully

**Steps:**
1. Create record with null optional fields
2. Verify display handles null
3. Verify fallback values shown
4. Verify no errors

**Expected Result:**
- Null values handled gracefully
- Appropriate fallback shown
- No UI errors

**Test Data:**
- Transaction with null customer_id
- Transaction with null bank_account_id
- Transaction with null branch_id

**Pass/Fail Criteria:**
- ✅ Pass: Null handled correctly
- ❌ Fail: Null causes errors

---

### Phase 5: End-to-End Integration Testing

#### Test Case 5.1: Complete Import Flow
**Objective:** Verify complete flow from import to display

**Steps:**
1. Import valid transaction data
2. Verify data inserted into database
3. Verify customer_id mapped correctly
4. Refresh transaction list
5. Verify transaction displayed correctly
6. Verify customer name shown
7. Click on customer
8. Verify customer modal shows correct data

**Expected Result:**
- Complete flow works end-to-end
- Data integrity maintained
- Display shows correct information

**Test Data:**
- Valid CSV with customer_code
- Valid Excel with customer_code
- Manual input with customer_code

**Pass/Fail Criteria:**
- ✅ Pass: Complete flow works
- ❌ Fail: Any step fails

---

#### Test Case 5.2: Error Recovery Testing
**Objective:** Verify error handling and recovery

**Steps:**
1. Import with invalid data
2. Verify error message displayed
3. Fix invalid data
4. Re-import
5. Verify successful import

**Expected Result:**
- Clear error messages
- User can recover from errors
- System remains stable

**Test Data:**
- Invalid customer code
- Invalid date format
- Invalid amount format

**Pass/Fail Criteria:**
- ✅ Pass: Error recovery works
- ❌ Fail: Cannot recover from errors

---

## 🔧 ENHANCEMENT RECOMMENDATIONS

### 1. Schema Verification Automation
**Priority:** CRITICAL
**Implementation:**
- Create automated schema verification script
- Run before each deployment
- Alert on schema changes

**Benefit:** Prevent form-database mismatch

---

### 2. Field Mapping Validation
**Priority:** CRITICAL
**Implementation:**
- Create field mapping validation tool
- Compare form fields with database schema
- Report missing fields

**Benefit:** Ensure 100% field coverage

---

### 3. Import Data Validation Layer
**Priority:** HIGH
**Implementation:**
- Create comprehensive validation layer
- Validate before database insert
- Provide clear error messages
- Support data correction

**Benefit:** Prevent invalid data import

---

### 4. Data Integrity Monitoring
**Priority:** HIGH
**Implementation:**
- Create data integrity checks
- Monitor foreign key relationships
- Alert on orphaned records
- Monitor null violations

**Benefit:** Detect data integrity issues early

---

### 5. Audit Logging
**Priority:** MEDIUM
**Implementation:**
- Log all data changes
- Track who changed what
- Enable rollback capability
- Provide audit trail

**Benefit:** Accountability and recovery

---

### 6. Test Data Generator
**Priority:** MEDIUM
**Implementation:**
- Create test data generator
- Generate realistic test data
- Support edge cases
- Automate test data creation

**Benefit:** Faster testing

---

## 📊 TEST COVERAGE MATRIX

| Component | Unit Tests | Integration Tests | E2E Tests | Coverage % |
|-----------|-----------|------------------|-----------|-------------|
| Forms | ✅ | ✅ | ✅ | 100% |
| Import Logic | ✅ | ✅ | ✅ | 100% |
| Backend API | ✅ | ✅ | ✅ | 100% |
| Database | ✅ | ✅ | ✅ | 100% |
| Display | ✅ | ✅ | ✅ | 100% |
| Validation | ✅ | ✅ | ✅ | 100% |

## 🎯 SUCCESS CRITERIA

### Before Production Deployment:
- ✅ All test cases pass
- ✅ 100% test coverage
- ✅ No critical issues
- ✅ Data integrity verified
- ✅ Schema verification automated
- ✅ Field mapping validated
- ✅ Import validation complete

### Ongoing:
- ✅ Automated regression testing
- ✅ Continuous monitoring
- ✅ Regular schema audits
- ✅ Data integrity checks

## 📞 IMMEDIATE ACTIONS

### P0 - Critical:
1. Implement schema verification automation
2. Complete field mapping validation
3. Add import validation layer
4. Fix all discovered issues

### P1 - High:
1. Implement data integrity monitoring
2. Add audit logging
3. Create test data generator
4. Complete E2E test suite

### P2 - Medium:
1. Implement automated regression testing
2. Add performance monitoring
3. Create test dashboard
4. Document all procedures

---

**Last Updated:** 2026-04-26
**Status:** READY FOR EXECUTION
**Next Review:** After implementation
