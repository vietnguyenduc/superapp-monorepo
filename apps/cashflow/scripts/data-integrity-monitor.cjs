/**
 * Data Integrity Monitoring Script
 * 
 * This script monitors data integrity by checking:
 * - Foreign key relationships
 * - Orphaned records
 * - Null violations
 * - Unique constraint violations
 * 
 * Usage: node data-integrity-monitor.cjs
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://peslmsctejmvkwzyohke.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MzY2MTMsImV4cCI6MjA1MDQxMjYxM30.5W0v5R5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Monitor results
const monitorResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to log result
function logResult(checkName, status, message, severity = 'INFO') {
  const result = { check: checkName, status, message, severity };
  
  if (status === 'PASS') {
    monitorResults.passed.push(result);
    console.log(`✅ ${checkName}: ${message}`);
  } else if (status === 'FAIL') {
    monitorResults.failed.push(result);
    console.log(`❌ ${checkName}: ${message}`);
  } else {
    monitorResults.warnings.push(result);
    console.log(`⚠️  ${checkName}: ${message}`);
  }
}

// Check 1: Foreign Key Relationships
async function checkForeignKeyRelationships() {
  console.log('\n🔍 Check 1: Foreign Key Relationships');
  console.log('='.repeat(50));
  
  try {
    // Check transactions.customer_id references customers.id
    const { data: orphanedTransactions, error: txError } = await supabase
      .from('transactions')
      .select('id, customer_id')
      .not('customer_id', 'is', null)
      .not('customer_id', 'in', `(select id from customers)`);
    
    if (txError) {
      logResult('FK: Transactions.customer_id → Customers.id', 'FAIL', `Error: ${txError.message}`, 'CRITICAL');
      return;
    }
    
    if (orphanedTransactions && orphanedTransactions.length > 0) {
      logResult('FK: Transactions.customer_id → Customers.id', 'FAIL', 
        `${orphanedTransactions.length} orphaned transactions found`, 'CRITICAL');
      console.log(`  Orphaned transaction IDs: ${orphanedTransactions.map(t => t.id).slice(0, 5).join(', ')}...`);
    } else {
      logResult('FK: Transactions.customer_id → Customers.id', 'PASS', 'No orphaned transactions');
    }
    
    // Check transactions.bank_account_id references bank_accounts.id
    const { data: orphanedBankTransactions, error: bankError } = await supabase
      .from('transactions')
      .select('id, bank_account_id')
      .not('bank_account_id', 'is', null)
      .not('bank_account_id', 'in', `(select id from bank_accounts)`);
    
    if (bankError) {
      logResult('FK: Transactions.bank_account_id → BankAccounts.id', 'FAIL', `Error: ${bankError.message}`, 'CRITICAL');
      return;
    }
    
    if (orphanedBankTransactions && orphanedBankTransactions.length > 0) {
      logResult('FK: Transactions.bank_account_id → BankAccounts.id', 'FAIL',
        `${orphanedBankTransactions.length} orphaned transactions found`, 'CRITICAL');
    } else {
      logResult('FK: Transactions.bank_account_id → BankAccounts.id', 'PASS', 'No orphaned transactions');
    }
    
    // Check transactions.branch_id references branches.id
    const { data: orphanedBranchTransactions, error: branchError } = await supabase
      .from('transactions')
      .select('id, branch_id')
      .not('branch_id', 'is', null)
      .not('branch_id', 'in', `(select id from branches)`);
    
    if (branchError) {
      logResult('FK: Transactions.branch_id → Branches.id', 'FAIL', `Error: ${branchError.message}`, 'CRITICAL');
      return;
    }
    
    if (orphanedBranchTransactions && orphanedBranchTransactions.length > 0) {
      logResult('FK: Transactions.branch_id → Branches.id', 'FAIL',
        `${orphanedBranchTransactions.length} orphaned transactions found`, 'CRITICAL');
    } else {
      logResult('FK: Transactions.branch_id → Branches.id', 'PASS', 'No orphaned transactions');
    }
  } catch (e) {
    logResult('Foreign Key Relationships', 'FAIL', `Exception: ${e.message}`, 'CRITICAL');
  }
}

// Check 2: Null Violations for Required Fields
async function checkNullViolations() {
  console.log('\n🔍 Check 2: Null Violations for Required Fields');
  console.log('='.repeat(50));
  
  try {
    // Check transactions with null required fields
    const requiredFields = ['transaction_code', 'transaction_type', 'amount', 'transaction_date', 'created_by'];
    
    for (const field of requiredFields) {
      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .is(field, null);
      
      if (error) {
        logResult(`Null check: transactions.${field}`, 'FAIL', `Error: ${error.message}`, 'CRITICAL');
        continue;
      }
      
      if (data && data.length > 0) {
        logResult(`Null check: transactions.${field}`, 'FAIL',
          `${data.length} records with null ${field}`, 'CRITICAL');
      } else {
        logResult(`Null check: transactions.${field}`, 'PASS', 'No null violations');
      }
    }
    
    // Check customers with null required fields
    const customerRequiredFields = ['customer_code', 'full_name', 'phone'];
    
    for (const field of customerRequiredFields) {
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .is(field, null);
      
      if (error) {
        logResult(`Null check: customers.${field}`, 'FAIL', `Error: ${error.message}`, 'CRITICAL');
        continue;
      }
      
      if (data && data.length > 0) {
        logResult(`Null check: customers.${field}`, 'FAIL',
          `${data.length} records with null ${field}`, 'CRITICAL');
      } else {
        logResult(`Null check: customers.${field}`, 'PASS', 'No null violations');
      }
    }
  } catch (e) {
    logResult('Null Violations', 'FAIL', `Exception: ${e.message}`, 'CRITICAL');
  }
}

// Check 3: Unique Constraint Violations
async function checkUniqueViolations() {
  console.log('\n🔍 Check 3: Unique Constraint Violations');
  console.log('='.repeat(50));
  
  try {
    // Check duplicate customer_code
    const { data: duplicateCustomerCodes, error: customerCodeError } = await supabase
      .from('customers')
      .select('customer_code')
      .not('customer_code', 'is', null);
    
    if (customerCodeError) {
      logResult('Unique: customers.customer_code', 'FAIL', `Error: ${customerCodeError.message}`, 'CRITICAL');
      return;
    }
    
    if (duplicateCustomerCodes) {
      const codeCounts = {};
      duplicateCustomerCodes.forEach(c => {
        codeCounts[c.customer_code] = (codeCounts[c.customer_code] || 0) + 1;
      });
      
      const duplicates = Object.entries(codeCounts).filter(([code, count]) => count > 1);
      
      if (duplicates.length > 0) {
        logResult('Unique: customers.customer_code', 'FAIL',
          `${duplicates.length} duplicate customer codes found`, 'CRITICAL');
        console.log(`  Duplicate codes: ${duplicates.map(([code]) => code).slice(0, 5).join(', ')}...`);
      } else {
        logResult('Unique: customers.customer_code', 'PASS', 'No duplicate customer codes');
      }
    }
    
    // Check duplicate transaction_code
    const { data: duplicateTxCodes, error: txCodeError } = await supabase
      .from('transactions')
      .select('transaction_code')
      .not('transaction_code', 'is', null);
    
    if (txCodeError) {
      logResult('Unique: transactions.transaction_code', 'FAIL', `Error: ${txCodeError.message}`, 'CRITICAL');
      return;
    }
    
    if (duplicateTxCodes) {
      const codeCounts = {};
      duplicateTxCodes.forEach(t => {
        codeCounts[t.transaction_code] = (codeCounts[t.transaction_code] || 0) + 1;
      });
      
      const duplicates = Object.entries(codeCounts).filter(([code, count]) => count > 1);
      
      if (duplicates.length > 0) {
        logResult('Unique: transactions.transaction_code', 'FAIL',
          `${duplicates.length} duplicate transaction codes found`, 'CRITICAL');
      } else {
        logResult('Unique: transactions.transaction_code', 'PASS', 'No duplicate transaction codes');
      }
    }
  } catch (e) {
    logResult('Unique Constraints', 'FAIL', `Exception: ${e.message}`, 'CRITICAL');
  }
}

// Check 4: Data Consistency
async function checkDataConsistency() {
  console.log('\n🔍 Check 4: Data Consistency');
  console.log('='.repeat(50));
  
  try {
    // Check if all transactions with customer_id have corresponding customer
    const { data: txWithCustomer, error: txError } = await supabase
      .from('transactions')
      .select('customer_id')
      .not('customer_id', 'is', null);
    
    if (txError) {
      logResult('Consistency: Transaction-Customer relationship', 'FAIL', `Error: ${txError.message}`, 'CRITICAL');
      return;
    }
    
    if (txWithCustomer && txWithCustomer.length > 0) {
      const customerIds = txWithCustomer.map(t => t.customer_id);
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .in('id', customerIds);
      
      if (customerError) {
        logResult('Consistency: Transaction-Customer relationship', 'FAIL', `Error: ${customerError.message}`, 'CRITICAL');
        return;
      }
      
      const existingCustomerIds = new Set(customers?.map(c => c.id) || []);
      const missingCustomerIds = customerIds.filter(id => !existingCustomerIds.has(id));
      
      if (missingCustomerIds.length > 0) {
        logResult('Consistency: Transaction-Customer relationship', 'FAIL',
          `${missingCustomerIds.length} transactions reference non-existent customers`, 'CRITICAL');
      } else {
        logResult('Consistency: Transaction-Customer relationship', 'PASS', 'All customer references valid');
      }
    }
  } catch (e) {
    logResult('Data Consistency', 'FAIL', `Exception: ${e.message}`, 'CRITICAL');
  }
}

// Check 5: Data Volume Monitoring
async function checkDataVolume() {
  console.log('\n🔍 Check 5: Data Volume Monitoring');
  console.log('='.repeat(50));
  
  try {
    // Count records in each table
    const { count: txCount, error: txError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (txError) {
      logResult('Volume: Transactions count', 'FAIL', `Error: ${txError.message}`, 'CRITICAL');
      return;
    }
    
    logResult('Volume: Transactions count', 'PASS', `${txCount} transactions`);
    
    const { count: customerCount, error: customerError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (customerError) {
      logResult('Volume: Customers count', 'FAIL', `Error: ${customerError.message}`, 'CRITICAL');
      return;
    }
    
    logResult('Volume: Customers count', 'PASS', `${customerCount} customers`);
    
    const { count: bankCount, error: bankError } = await supabase
      .from('bank_accounts')
      .select('*', { count: 'exact', head: true });
    
    if (bankError) {
      logResult('Volume: Bank accounts count', 'FAIL', `Error: ${bankError.message}`, 'CRITICAL');
      return;
    }
    
    logResult('Volume: Bank accounts count', 'PASS', `${bankCount} bank accounts`);
  } catch (e) {
    logResult('Data Volume', 'FAIL', `Exception: ${e.message}`, 'CRITICAL');
  }
}

// Run all checks
async function runAllChecks() {
  console.log('🔍 Starting Data Integrity Monitoring...\n');
  console.log('='.repeat(50));
  
  await checkForeignKeyRelationships();
  await checkNullViolations();
  await checkUniqueViolations();
  await checkDataConsistency();
  await checkDataVolume();
  
  // Print summary
  console.log('\n\n' + '='.repeat(50));
  console.log('📊 DATA INTEGRITY MONITORING SUMMARY');
  console.log('='.repeat(50));
  
  console.log(`\n✅ Passed: ${monitorResults.passed.length}`);
  console.log(`❌ Failed: ${monitorResults.failed.length}`);
  console.log(`⚠️  Warnings: ${monitorResults.warnings.length}`);
  
  const criticalIssues = monitorResults.failed.filter(f => f.severity === 'CRITICAL');
  
  if (criticalIssues.length > 0) {
    console.log('\n\n🚨 CRITICAL ISSUES:');
    criticalIssues.forEach(issue => {
      console.log(`  - ${issue.check}: ${issue.message}`);
    });
  }
  
  if (monitorResults.warnings.length > 0) {
    console.log('\n\n⚠️  WARNINGS:');
    monitorResults.warnings.forEach(warning => {
      console.log(`  - ${warning.check}: ${warning.message}`);
    });
  }
  
  // Exit with appropriate code
  if (criticalIssues.length > 0) {
    console.log('\n\n❌ CRITICAL data integrity issues found. Please fix immediately.');
    process.exit(1);
  } else if (monitorResults.failed.length > 0) {
    console.log('\n\n⚠️  Data integrity issues found. Please review and fix.');
    process.exit(1);
  } else {
    console.log('\n\n✅ Data integrity check PASSED. System is healthy.');
    process.exit(0);
  }
}

// Run monitoring
runAllChecks().catch(error => {
  console.error('❌ Data integrity monitoring failed with exception:', error);
  process.exit(1);
});
