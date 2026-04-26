/**
 * Schema Verification Automation Script
 * 
 * This script verifies database schema matches expected structure
 * and alerts on any discrepancies.
 * 
 * Usage: node schema-verification.cjs
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://peslmsctejmvkwzyohke.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MzY2MTMsImV4cCI6MjA1MDQxMjYxM30.5W0v5R5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K';

// Expected schema definitions
const EXPECTED_SCHEMA = {
  transactions: {
    required_fields: [
      'id',
      'transaction_code',
      'transaction_type',
      'amount',
      'transaction_date',
      'created_by'
    ],
    foreign_keys: [
      { field: 'customer_id', references: 'customers.id', nullable: true },
      { field: 'bank_account_id', references: 'bank_accounts.id', nullable: true },
      { field: 'branch_id', references: 'branches.id', nullable: true }
    ],
    constraints: [
      { type: 'PRIMARY KEY', field: 'id' },
      { type: 'UNIQUE', field: 'transaction_code' }
    ]
  },
  customers: {
    required_fields: [
      'id',
      'customer_code',
      'full_name',
      'phone'
    ],
    foreign_keys: [],
    constraints: [
      { type: 'PRIMARY KEY', field: 'id' },
      { type: 'UNIQUE', field: 'customer_code' }
    ]
  },
  bank_accounts: {
    required_fields: [
      'id',
      'account_name',
      'account_number',
      'bank_name'
    ],
    foreign_keys: [],
    constraints: [
      { type: 'PRIMARY KEY', field: 'id' },
      { type: 'UNIQUE', field: 'account_number' }
    ]
  },
  branches: {
    required_fields: [
      'id',
      'name',
      'code'
    ],
    foreign_keys: [],
    constraints: [
      { type: 'PRIMARY KEY', field: 'id' },
      { type: 'UNIQUE', field: 'code' }
    ]
  }
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getTableSchema(tableName) {
  try {
    const { data, error } = await supabase
      .rpc('get_table_schema', { table_name: tableName });
    
    if (error) {
      console.error(`Error getting schema for ${tableName}:`, error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error(`Exception getting schema for ${tableName}:`, e);
    return null;
  }
}

async function verifySchema() {
  console.log('🔍 Starting Schema Verification...\n');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  for (const [tableName, expected] of Object.entries(EXPECTED_SCHEMA)) {
    console.log(`\n📋 Verifying table: ${tableName}`);
    console.log('='.repeat(50));
    
    // Get actual schema from database
    const actualSchema = await getTableSchema(tableName);
    
    if (!actualSchema) {
      results.failed.push({
        table: tableName,
        issue: 'Could not retrieve schema from database',
        severity: 'CRITICAL'
      });
      console.log(`❌ CRITICAL: Could not retrieve schema for ${tableName}`);
      continue;
    }
    
    // Verify required fields
    console.log('\n  Checking required fields...');
    for (const field of expected.required_fields) {
      const fieldExists = actualSchema.columns.some(col => col.column_name === field);
      if (fieldExists) {
        const isNullable = actualSchema.columns.find(col => col.column_name === field).is_nullable === 'YES';
        if (isNullable) {
          results.warnings.push({
            table: tableName,
            issue: `Required field '${field}' is nullable`,
            severity: 'WARNING'
          });
          console.log(`  ⚠️  WARNING: Required field '${field}' is nullable`);
        } else {
          results.passed.push({
            table: tableName,
            check: `Required field '${field}' exists and is NOT NULL`,
            severity: 'PASS'
          });
          console.log(`  ✅ Required field '${field}' exists and is NOT NULL`);
        }
      } else {
        results.failed.push({
          table: tableName,
          issue: `Required field '${field}' is missing`,
          severity: 'CRITICAL'
        });
        console.log(`  ❌ CRITICAL: Required field '${field}' is missing`);
      }
    }
    
    // Verify foreign keys
    console.log('\n  Checking foreign keys...');
    for (const fk of expected.foreign_keys) {
      const fkExists = actualSchema.foreign_keys.some(
        actualFk => actualFk.column_name === fk.field && actualFk.referenced_table === fk.references
      );
      if (fkExists) {
        results.passed.push({
          table: tableName,
          check: `Foreign key '${fk.field}' references '${fk.references}'`,
          severity: 'PASS'
        });
        console.log(`  ✅ Foreign key '${fk.field}' references '${fk.references}'`);
      } else {
        results.failed.push({
          table: tableName,
          issue: `Foreign key '${fk.field}' referencing '${fk.references}' is missing`,
          severity: 'CRITICAL'
        });
        console.log(`  ❌ CRITICAL: Foreign key '${fk.field}' referencing '${fk.references}' is missing`);
      }
    }
    
    // Verify constraints
    console.log('\n  Checking constraints...');
    for (const constraint of expected.constraints) {
      if (constraint.type === 'PRIMARY KEY') {
        const pkExists = actualSchema.constraints.some(
          c => c.constraint_type === 'PRIMARY KEY' && c.column_name === constraint.field
        );
        if (pkExists) {
          results.passed.push({
            table: tableName,
            check: `PRIMARY KEY on '${constraint.field}'`,
            severity: 'PASS'
          });
          console.log(`  ✅ PRIMARY KEY on '${constraint.field}'`);
        } else {
          results.failed.push({
            table: tableName,
            issue: `PRIMARY KEY on '${constraint.field}' is missing`,
            severity: 'CRITICAL'
          });
          console.log(`  ❌ CRITICAL: PRIMARY KEY on '${constraint.field}' is missing`);
        }
      } else if (constraint.type === 'UNIQUE') {
        const uniqueExists = actualSchema.constraints.some(
          c => c.constraint_type === 'UNIQUE' && c.column_name === constraint.field
        );
        if (uniqueExists) {
          results.passed.push({
            table: tableName,
            check: `UNIQUE constraint on '${constraint.field}'`,
            severity: 'PASS'
          });
          console.log(`  ✅ UNIQUE constraint on '${constraint.field}'`);
        } else {
          results.failed.push({
            table: tableName,
            issue: `UNIQUE constraint on '${constraint.field}' is missing`,
            severity: 'CRITICAL'
          });
          console.log(`  ❌ CRITICAL: UNIQUE constraint on '${constraint.field}' is missing`);
        }
      }
    }
  }
  
  // Print summary
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  
  console.log(`\n✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n\n🚨 CRITICAL ISSUES:');
    results.failed.forEach(failure => {
      console.log(`  - ${failure.table}: ${failure.issue}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => {
      console.log(`  - ${warning.table}: ${warning.issue}`);
    });
  }
  
  // Exit with appropriate code
  if (results.failed.length > 0) {
    console.log('\n\n❌ Schema verification FAILED. Please fix critical issues before deployment.');
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.log('\n\n⚠️  Schema verification PASSED with warnings. Review warnings before deployment.');
    process.exit(0);
  } else {
    console.log('\n\n✅ Schema verification PASSED. Ready for deployment.');
    process.exit(0);
  }
}

// Run verification
verifySchema().catch(error => {
  console.error('❌ Schema verification failed with exception:', error);
  process.exit(1);
});
