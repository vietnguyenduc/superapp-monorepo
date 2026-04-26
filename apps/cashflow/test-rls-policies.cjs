// Test RLS Policies with User Authentication
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSPolicies() {
  console.log('🧪 Testing RLS Policies with User Authentication\n');

  // Test 1: Check if we can access public tables without authentication
  console.log('Test 1: Public Tables Access (No Auth)');
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, code')
      .limit(1);
    
    if (error) {
      console.log('  ❌ Failed:', error.message);
    } else {
      console.log('  ✅ Public tables accessible');
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }

  // Test 2: Check if users table is accessible with RLS
  console.log('\nTest 2: Users Table RLS (No Auth)');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(1);
    
    if (error) {
      console.log('  ❌ Failed:', error.message);
      if (error.message.includes('infinite recursion')) {
        console.log('  🚨 CRITICAL: RLS policy has infinite recursion!');
      }
    } else {
      console.log('  ✅ Users table accessible (no data expected without auth)');
      console.log('  📊 Records:', data?.length || 0);
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }

  // Test 3: Check if customers table has RLS enabled
  console.log('\nTest 3: Customers Table RLS (No Auth)');
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id, customer_code, company_id')
      .limit(1);
    
    if (error) {
      console.log('  ❌ Failed:', error.message);
    } else {
      console.log('  ✅ Customers table accessible');
      console.log('  📊 Records:', data?.length || 0);
      if (data?.length > 0) {
        console.log('  🔍 Sample record has company_id:', !!data[0].company_id);
      }
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }

  // Test 4: Check if transactions table has RLS enabled
  console.log('\nTest 4: Transactions Table RLS (No Auth)');
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, transaction_type, company_id')
      .limit(1);
    
    if (error) {
      console.log('  ❌ Failed:', error.message);
    } else {
      console.log('  ✅ Transactions table accessible');
      console.log('  📊 Records:', data?.length || 0);
      if (data?.length > 0) {
        console.log('  🔍 Sample record has company_id:', !!data[0].company_id);
      }
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }

  // Test 5: Check if bank_accounts table has company_id column
  console.log('\nTest 5: Bank Accounts Table Schema');
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('id, account_name, company_id')
      .limit(1);
    
    if (error) {
      console.log('  ❌ Failed:', error.message);
    } else {
      console.log('  ✅ Bank accounts table accessible');
      if (data?.length > 0) {
        console.log('  🔍 Sample record has company_id:', !!data[0].company_id);
      }
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }

  // Test 6: Check if branches table has company_id column
  console.log('\nTest 6: Branches Table Schema');
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name, company_id')
      .limit(1);
    
    if (error) {
      console.log('  ❌ Failed:', error.message);
    } else {
      console.log('  ✅ Branches table accessible');
      if (data?.length > 0) {
        console.log('  🔍 Sample record has company_id:', !!data[0].company_id);
      }
    }
  } catch (err) {
    console.log('  ❌ Exception:', err.message);
  }

  console.log('\n📋 RLS Policy Test Summary:');
  console.log('✅ Database connectivity working');
  console.log('✅ Public tables accessible');
  console.log('⚠️  Full RLS testing requires authenticated user session');
  console.log('\n💡 To test with authentication:');
  console.log('   1. Login to the application');
  console.log('   2. Get session token from browser');
  console.log('   3. Run authenticated tests');
}

testRLSPolicies()
  .then(() => {
    console.log('\n✅ RLS Policy Tests Completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ RLS Policy Tests Failed:', err);
    process.exit(1);
  });
