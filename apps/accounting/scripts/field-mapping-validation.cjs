/**
 * Field Mapping Validation Tool
 * 
 * This tool compares form fields with database schema
 * and reports missing or mismatched fields.
 * 
 * Usage: node field-mapping-validation.cjs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '../..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

// Form definitions (should be extracted from actual form components)
const FORM_DEFINITIONS = {
  TransactionList: {
    file: 'pages/Transactions/TransactionList.tsx',
    expected_fields: [
      'transaction_type',
      'transaction_date',
      'amount',
      'description',
      'customer_id',
      'bank_account_id',
      'branch_id',
      'reference_number'
    ]
  },
  CustomerForm: {
    file: 'pages/Customers/CustomerForm.tsx',
    expected_fields: [
      'customer_code',
      'full_name',
      'phone',
      'email',
      'address'
    ]
  },
  BankAccountForm: {
    file: 'pages/BankAccounts/BankAccountForm.tsx',
    expected_fields: [
      'account_name',
      'account_number',
      'bank_name'
    ]
  },
  BranchForm: {
    file: 'pages/Branches/BranchForm.tsx',
    expected_fields: [
      'name',
      'code',
      'address'
    ]
  }
};

// Database schema definitions (should match actual database)
const DATABASE_SCHEMA = {
  transactions: {
    fields: [
      'id',
      'transaction_code',
      'customer_id',
      'bank_account_id',
      'branch_id',
      'transaction_type',
      'amount',
      'description',
      'reference_number',
      'transaction_date',
      'created_by',
      'created_at',
      'updated_at'
    ],
    required: [
      'id',
      'transaction_code',
      'transaction_type',
      'amount',
      'transaction_date',
      'created_by'
    ]
  },
  customers: {
    fields: [
      'id',
      'customer_code',
      'full_name',
      'phone',
      'email',
      'address',
      'created_at',
      'updated_at'
    ],
    required: [
      'id',
      'customer_code',
      'full_name',
      'phone'
    ]
  },
  bank_accounts: {
    fields: [
      'id',
      'account_name',
      'account_number',
      'bank_name',
      'created_at',
      'updated_at'
    ],
    required: [
      'id',
      'account_name',
      'account_number',
      'bank_name'
    ]
  },
  branches: {
    fields: [
      'id',
      'name',
      'code',
      'address',
      'is_active',
      'created_at',
      'updated_at'
    ],
    required: [
      'id',
      'name',
      'code'
    ]
  }
};

// Mapping from forms to database tables
const FORM_TO_TABLE_MAPPING = {
  TransactionList: 'transactions',
  CustomerForm: 'customers',
  BankAccountForm: 'bank_accounts',
  BranchForm: 'branches'
};

function extractFormFields(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract form fields from useState or form object
    const formFields = [];
    
    // Look for useState with form fields
    const useStateMatch = content.match(/useState\(\{([^}]+)\}\)/);
    if (useStateMatch) {
      const fields = useStateMatch[1].split(',').map(f => f.trim().split(':')[0]);
      formFields.push(...fields);
    }
    
    // Look for form object definitions
    const formObjectMatch = content.match(/form\s*=\s*\{([^}]+)\}/);
    if (formObjectMatch) {
      const fields = formObjectMatch[1].split(',').map(f => f.trim().split(':')[0]);
      formFields.push(...fields);
    }
    
    // Remove duplicates
    return [...new Set(formFields)];
  } catch (e) {
    console.error(`Error reading file ${filePath}:`, e);
    return [];
  }
}

function validateFieldMapping() {
  console.log('🔍 Starting Field Mapping Validation...\n');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  for (const [formName, formDef] of Object.entries(FORM_DEFINITIONS)) {
    console.log(`\n📋 Validating form: ${formName}`);
    console.log('='.repeat(50));
    
    const filePath = path.join(SRC_DIR, formDef.file);
    
    if (!fs.existsSync(filePath)) {
      results.failed.push({
        form: formName,
        issue: `Form file not found: ${filePath}`,
        severity: 'CRITICAL'
      });
      console.log(`❌ CRITICAL: Form file not found: ${filePath}`);
      continue;
    }
    
    // Extract actual form fields
    const actualFormFields = extractFormFields(filePath);
    
    // Get expected database fields
    const tableName = FORM_TO_TABLE_MAPPING[formName];
    const dbSchema = DATABASE_SCHEMA[tableName];
    
    if (!dbSchema) {
      results.failed.push({
        form: formName,
        issue: `No database schema found for table: ${tableName}`,
        severity: 'CRITICAL'
      });
      console.log(`❌ CRITICAL: No database schema found for table: ${tableName}`);
      continue;
    }
    
    // Check for missing required fields
    console.log('\n  Checking required fields...');
    for (const requiredField of dbSchema.required) {
      if (requiredField === 'id' || requiredField === 'created_at' || requiredField === 'updated_at') {
        continue; // Skip auto-generated fields
      }
      
      const fieldInForm = actualFormFields.includes(requiredField);
      if (fieldInForm) {
        results.passed.push({
          form: formName,
          check: `Required field '${requiredField}' present in form`,
          severity: 'PASS'
        });
        console.log(`  ✅ Required field '${requiredField}' present in form`);
      } else {
        results.failed.push({
          form: formName,
          issue: `Required field '${requiredField}' missing from form`,
          severity: 'CRITICAL'
        });
        console.log(`  ❌ CRITICAL: Required field '${requiredField}' missing from form`);
      }
    }
    
    // Check for extra fields in form
    console.log('\n  Checking for extra fields...');
    const extraFields = actualFormFields.filter(f => !dbSchema.fields.includes(f));
    if (extraFields.length > 0) {
      results.warnings.push({
        form: formName,
        issue: `Extra fields in form: ${extraFields.join(', ')}`,
        severity: 'WARNING'
      });
      console.log(`  ⚠️  WARNING: Extra fields in form: ${extraFields.join(', ')}`);
    } else {
      console.log(`  ✅ No extra fields in form`);
    }
    
    // Check for missing optional fields
    console.log('\n  Checking optional fields...');
    const optionalDbFields = dbSchema.fields.filter(f => 
      !dbSchema.required.includes(f) && 
      f !== 'id' && 
      f !== 'created_at' && 
      f !== 'updated_at'
    );
    const missingOptionalFields = optionalDbFields.filter(f => !actualFormFields.includes(f));
    if (missingOptionalFields.length > 0) {
      results.warnings.push({
        form: formName,
        issue: `Optional fields missing from form: ${missingOptionalFields.join(', ')}`,
        severity: 'INFO'
      });
      console.log(`  ℹ️  INFO: Optional fields missing from form: ${missingOptionalFields.join(', ')}`);
    } else {
      console.log(`  ✅ All optional fields present in form`);
    }
    
    // Check for foreign key fields
    console.log('\n  Checking foreign key fields...');
    const foreignKeyFields = dbSchema.fields.filter(f => f.includes('_id') && f !== 'id');
    for (const fkField of foreignKeyFields) {
      const fieldInForm = actualFormFields.includes(fkField);
      if (fieldInForm) {
        results.passed.push({
          form: formName,
          check: `Foreign key field '${fkField}' present in form`,
          severity: 'PASS'
        });
        console.log(`  ✅ Foreign key field '${fkField}' present in form`);
      } else {
        results.failed.push({
          form: formName,
          issue: `Foreign key field '${fkField}' missing from form`,
          severity: 'CRITICAL'
        });
        console.log(`  ❌ CRITICAL: Foreign key field '${fkField}' missing from form`);
      }
    }
  }
  
  // Print summary
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 FIELD MAPPING VALIDATION SUMMARY');
  console.log('='.repeat(50));
  
  console.log(`\n✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n\n🚨 CRITICAL ISSUES:');
    results.failed.forEach(failure => {
      console.log(`  - ${failure.form}: ${failure.issue}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n\n⚠️  WARNINGS/INFO:');
    results.warnings.forEach(warning => {
      console.log(`  - ${warning.form}: ${warning.issue}`);
    });
  }
  
  // Exit with appropriate code
  if (results.failed.length > 0) {
    console.log('\n\n❌ Field mapping validation FAILED. Please fix critical issues before deployment.');
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.log('\n\n⚠️  Field mapping validation PASSED with warnings. Review warnings before deployment.');
    process.exit(0);
  } else {
    console.log('\n\n✅ Field mapping validation PASSED. Ready for deployment.');
    process.exit(0);
  }
}

// Run validation
validateFieldMapping().catch(error => {
  console.error('❌ Field mapping validation failed with exception:', error);
  process.exit(1);
});
