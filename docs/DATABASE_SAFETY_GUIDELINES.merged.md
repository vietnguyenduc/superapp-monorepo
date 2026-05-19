# Database Safety Guidelines

**CRITICAL:** These guidelines MUST be followed for ALL database operations to prevent data integrity violations.

## 🚨 CORE PRINCIPLES

### 1. Data Integrity is Sacred
- Never compromise data integrity for convenience
- User data is sacred - never arbitrarily modify without explicit request
- All changes must be intentional, verifiable, and reversible

### 2. Verification Before Assumption
- Never assume schema structure - always verify with actual database
- Never assume field exists - always check schema first
- Never assume data type - always verify in schema
- Never assume relationship - always check foreign keys

### 3. Safety First for Mass Operations
- Never perform mass updates without backup
- Never update ALL records without specific WHERE clause
- Always test on single record before mass operation
- Always have rollback plan ready

### 4. Complete Field Coverage
- Forms must include ALL database fields
- No missing fields between form and database
- No orphaned data in database
- All relationships must be explicit

## 🔍 MANDATORY PRE-OPERATION STEPS

### Step 1: Schema Inspection (NON-NEGOTIABLE)

**Before ANY code change, you MUST:**

```typescript
// Use MCP Supabase tools to inspect schema
const tables = await mcp5_list_tables({
  project_id: "peslmsctejmvkwzyohke",
  schemas: ["public"],
  verbose: true
});

// Verify the table structure
const tableDetails = await mcp5_list_tables({
  project_id: "peslmsctejmvkwzyohke",
  schemas: ["public"],
  verbose: true
});
```

**What to check:**
- [ ] All required fields (NOT NULL)
- [ ] All foreign key fields and their referenced tables
- [ ] Data types for each field
- [ ] Default values
- [ ] Constraints (UNIQUE, CHECK, etc.)
- [ ] Relationship constraints (CASCADE, SET NULL, etc.)

### Step 2: Form-to-Database Mapping

**Create explicit mapping document:**

```markdown
## Form Field Mapping

### Transaction Form
| Form Field | Database Field | Type | Required | Notes |
|-----------|----------------|------|----------|-------|
| customerSelect | customer_id | UUID | YES | FK to customers.id |
| accountSelect | bank_account_id | UUID | YES | FK to bank_accounts.id |
| branchSelect | branch_id | UUID | YES | FK to branches.id |
| transactionType | transaction_type | enum | YES | From transaction_types table |
| amount | amount | numeric | YES | Positive for payment, negative for charge |
| transactionDate | transaction_date | date | YES | ISO format |
| description | description | text | NO | Optional |
```

**Verification checklist:**
- [ ] ALL database fields have corresponding form fields
- [ ] ALL form fields have corresponding database fields
- [ ] Data types match
- [ ] Required fields are validated in form
- [ ] Foreign keys have dropdown selectors

### Step 3: Foreign Key Safety

**For EVERY foreign key field:**

```typescript
// ❌ WRONG - Arbitrary assignment
const transaction = {
  customer_id: '22dab687-eb15-4692-9c5f-1d46b7af98c8' // Arbitrary ID
};

// ✅ CORRECT - User selection
const transaction = {
  customer_id: formData.customer_id // From user dropdown selection
};
```

**Requirements:**
- [ ] Foreign key fields MUST have dropdown/select
- [ ] Dropdown MUST load data from referenced table
- [ ] Display user-friendly name (customer name, not ID)
- [ ] Store the ID as the value
- [ ] Verify referenced record exists before save
- [ ] Handle NULL explicitly if field is optional

### Step 4: Mass Update Safety

**Before ANY mass update:**

```sql
-- ❌ WRONG - Updates ALL records
UPDATE transactions SET customer_id = 'some-id';

-- ✅ CORRECT - Updates only specific records
UPDATE transactions SET customer_id = 'some-id' 
WHERE id = 'specific-transaction-id';
```

**Safety checklist:**
- [ ] ALWAYS use WHERE clause with specific conditions
- [ ] Count affected rows before executing: `SELECT COUNT(*) FROM table WHERE conditions`
- [ ] Test on single record first
- [ ] Create rollback SQL script
- [ ] Test rollback script
- [ ] Only proceed if count is reasonable

## 📋 SPECIFIC TABLE RULES

### Transactions Table

**Required Fields:**
- `customer_id`: UUID, FK to customers.id
- `bank_account_id`: UUID, FK to bank_accounts.id
- `branch_id`: UUID, FK to branches.id
- `transaction_type`: enum (payment, charge, adjustment, refund)
- `amount`: numeric
- `transaction_date`: date
- `created_by`: UUID (auto-populated from auth)

**Form Requirements:**
- Customer dropdown (loads from customers table)
- Bank account dropdown (loads from bank_accounts table)
- Branch dropdown (loads from branches table)
- Transaction type dropdown (loads from transaction_types table)
- Amount input (number validation)
- Date picker
- Description textarea (optional)

**CRITICAL:**
- NEVER manually assign `created_by` - always use auth user
- NEVER hardcode customer_id - always from user selection
- NEVER hardcode bank_account_id - always from user selection
- NEVER hardcode branch_id - always from user selection

### Customers Table

**Required Fields:**
- `customer_code`: text, UNIQUE
- `full_name`: text
- `phone`: text

**Form Requirements:**
- Customer code input (auto-generate or user input)
- Full name input
- Phone input (format validation)
- Email input (optional, format validation)
- Address textarea (optional)

**CRITICAL:**
- customer_code MUST be unique
- Validate uniqueness before insert
- Use server-side duplicate check (not just client-side)

### Bank Accounts Table

**Required Fields:**
- `account_name`: text
- `account_number`: text, UNIQUE
- `bank_name`: text

**Form Requirements:**
- Account name input
- Account number input
- Bank name input

**CRITICAL:**
- account_number MUST be unique
- Validate uniqueness before insert

### Branches Table

**Required Fields:**
- `name`: text
- `code`: text, UNIQUE

**Form Requirements:**
- Name input
- Code input

**CRITICAL:**
- code MUST be unique
- Validate uniqueness before insert

## 🚫 FORBIDDEN OPERATIONS

### 1. Mass Updates Without WHERE Clause

```sql
-- ❌ FORBIDDEN
UPDATE transactions SET customer_id = 'some-id';

-- ✅ REQUIRED
UPDATE transactions SET customer_id = 'some-id' 
WHERE id = 'specific-id';
```

### 2. Arbitrary Foreign Key Assignment

```typescript
// ❌ FORBIDDEN
const transaction = {
  customer_id: '22dab687-eb15-4692-9c5f-1d46b7af98c8' // Arbitrary
};

// ✅ REQUIRED
const transaction = {
  customer_id: formData.customer_id // User selection
};
```

### 3. Schema Assumptions

```typescript
// ❌ FORBIDDEN
// Assuming customer_id exists in transactions table

// ✅ REQUIRED
// Verify schema first
const schema = await checkSchema('transactions');
console.log('customer_id exists:', schema.fields.includes('customer_id'));
```

### 4. Missing Form Fields

```typescript
// ❌ FORBIDDEN
const form = {
  amount: 1000,
  transaction_type: 'payment'
  // Missing customer_id, bank_account_id, branch_id
};

// ✅ REQUIRED
const form = {
  customer_id: formData.customer_id,
  bank_account_id: formData.bank_account_id,
  branch_id: formData.branch_id,
  transaction_type: formData.transaction_type,
  amount: formData.amount
};
```

### 5. Hardcoded Values

```typescript
// ❌ FORBIDDEN
const transaction = {
  customer_id: '22dab687-eb15-4692-9c5f-1d46b7af98c8'
};

// ✅ REQUIRED
const transaction = {
  customer_id: selectedCustomer.id
};
```

## ✅ REQUIRED OPERATIONS

### 1. Schema Verification

**Before ANY code change:**

```typescript
// Use MCP Supabase tools
const tables = await mcp5_list_tables({
  project_id: "peslmsctejmvkwzyohke",
  schemas: ["public"],
  verbose: true
});
```

### 2. Field Mapping

**Create mapping document:**

```markdown
## Field Mapping
Form Field -> Database Field -> Type -> Required
```

### 3. Foreign Key Dropdowns

**For ALL foreign key fields:**

```typescript
<select value={formData.customer_id} onChange={handleCustomerChange}>
  <option value="">Select Customer</option>
  {customers.map(c => (
    <option key={c.id} value={c.id}>{c.name}</option>
  ))}
</select>
```

### 4. Testing with Real Data

**Before deployment:**

```typescript
// Test insert
const testTransaction = await createTransaction(testData);
console.log('Created:', testTransaction);

// Verify in database
const dbCheck = await mcp5_execute_sql({
  project_id: "peslmsctejmvkwzyohke",
  query: `SELECT * FROM transactions WHERE id = '${testTransaction.id}'`
});
```

### 5. Rollback Planning

**For mass operations:**

```sql
-- Rollback script
UPDATE transactions 
SET customer_id = NULL 
WHERE customer_id = 'new-customer-id';
```

## 🔍 POST-OPERATION VERIFICATION

### After INSERT

```typescript
// Verify record exists
const verify = await mcp5_execute_sql({
  project_id: "peslmsctejmvkwzyohke",
  query: `SELECT * FROM transactions WHERE id = '${newId}'`
});

// Check all fields saved correctly
console.log('customer_id:', verify.data[0].customer_id);
console.log('bank_account_id:', verify.data[0].bank_account_id);
console.log('branch_id:', verify.data[0].branch_id);
```

### After UPDATE

```typescript
// Verify only intended fields changed
const before = await getTransaction(id);
await updateTransaction(id, updates);
const after = await getTransaction(id);

// Check unchanged fields
console.log('customer_id unchanged:', before.customer_id === after.customer_id);
console.log('amount changed:', before.amount !== after.amount);
```

### After DELETE

```typescript
// Verify record deleted
const verify = await mcp5_execute_sql({
  project_id: "peslmsctejmvkwzyohke",
  query: `SELECT * FROM transactions WHERE id = '${deletedId}'`
});

console.log('Record deleted:', verify.data.length === 0);

// Check cascade effects
const related = await mcp5_execute_sql({
  project_id: "peslmsctejmvkwzyohke",
  query: `SELECT * FROM related_table WHERE transaction_id = '${deletedId}'`
});
```

## 🚨 EMERGENCY PROCEDURES

### If You Realize You Made a Critical Mistake

1. **STOP IMMEDIATELY**
   - Don't make more changes
   - Don't try to "fix it" without understanding

2. **ASSESS THE DAMAGE**
   - What was affected?
   - How many records?
   - What is the impact?

3. **ROLLBACK IF POSSIBLE**
   - Use your rollback script
   - Restore from backup if available
   - Document the rollback

4. **NOTIFY THE USER IMMEDIATELY**
   - Be transparent about what happened
   - Explain the impact
   - Provide recovery plan

5. **DOCUMENT THE MISTAKE**
   - What happened?
   - Why did it happen?
   - How to prevent recurrence?

6. **PREVENT RECURRENCE**
   - Update checklists
   - Update guidelines
   - Add validation
   - Improve procedures

## 📞 CONTACT INFORMATION

For database-related questions or concerns:
- Review DATABASE_OPERATIONS_CHECKLIST.md
- Check critical memory entries
- Verify with actual database schema using MCP tools

---

**Last Updated:** 2026-04-26
**Version:** 1.0
**Status:** MANDATORY for all database operations
