const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMultiTenancy() {
  console.log('=== Multi-Tenancy Database State Check ===\n');

  // 1. Check companies table
  console.log('1. Checking companies table...');
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*');
  
  if (companiesError) {
    console.error('Error fetching companies:', companiesError);
  } else {
    console.log(`Found ${companies.length} companies:`);
    companies.forEach(c => console.log(`  - ${c.id}: ${c.name}`));
  }
  console.log('');

  // 2. Check customers table with company_id
  console.log('2. Checking customers table with company_id...');
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, customer_code, full_name, company_id');
  
  if (customersError) {
    console.error('Error fetching customers:', customersError);
  } else {
    console.log(`Found ${customers.length} customers:`);
    const companyGroups = {};
    customers.forEach(c => {
      if (!companyGroups[c.company_id]) {
        companyGroups[c.company_id] = [];
      }
      companyGroups[c.company_id].push(c);
    });
    
    Object.entries(companyGroups).forEach(([companyId, custs]) => {
      console.log(`  Company ${companyId || 'NULL'}: ${custs.length} customers`);
      custs.slice(0, 3).forEach(c => console.log(`    - ${c.customer_code}: ${c.full_name}`));
      if (custs.length > 3) console.log(`    ... and ${custs.length - 3} more`);
    });
  }
  console.log('');

  // 3. Check transactions table with company_id
  console.log('3. Checking transactions table with company_id...');
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('id, amount, transaction_date, company_id')
    .limit(20);
  
  if (transactionsError) {
    console.error('Error fetching transactions:', transactionsError);
  } else {
    console.log(`Found ${transactions.length} transactions (sample):`);
    const companyGroups = {};
    transactions.forEach(t => {
      if (!companyGroups[t.company_id]) {
        companyGroups[t.company_id] = [];
      }
      companyGroups[t.company_id].push(t);
    });
    
    Object.entries(companyGroups).forEach(([companyId, txs]) => {
      console.log(`  Company ${companyId || 'NULL'}: ${txs.length} transactions`);
      txs.slice(0, 2).forEach(t => console.log(`    - ${t.transaction_date}: ${t.amount}`));
    });
  }
  console.log('');

  // 4. Check transaction_types table with company_id
  console.log('4. Checking transaction_types table with company_id...');
  const { data: transactionTypes, error: typesError } = await supabase
    .from('transaction_types')
    .select('id, name, company_id');
  
  if (typesError) {
    console.error('Error fetching transaction types:', typesError);
  } else {
    console.log(`Found ${transactionTypes.length} transaction types:`);
    const companyGroups = {};
    transactionTypes.forEach(t => {
      if (!companyGroups[t.company_id]) {
        companyGroups[t.company_id] = [];
      }
      companyGroups[t.company_id].push(t);
    });
    
    Object.entries(companyGroups).forEach(([companyId, types]) => {
      console.log(`  Company ${companyId || 'NULL'}: ${types.length} types`);
      types.forEach(t => console.log(`    - ${t.name}`));
    });
  }
  console.log('');

  // 5. Check bank_accounts table with company_id
  console.log('5. Checking bank_accounts table with company_id...');
  const { data: bankAccounts, error: accountsError } = await supabase
    .from('bank_accounts')
    .select('id, account_name, company_id');
  
  if (accountsError) {
    console.error('Error fetching bank accounts:', accountsError);
  } else {
    console.log(`Found ${bankAccounts.length} bank accounts:`);
    const companyGroups = {};
    bankAccounts.forEach(a => {
      if (!companyGroups[a.company_id]) {
        companyGroups[a.company_id] = [];
      }
      companyGroups[a.company_id].push(a);
    });
    
    Object.entries(companyGroups).forEach(([companyId, accounts]) => {
      console.log(`  Company ${companyId || 'NULL'}: ${accounts.length} accounts`);
      accounts.forEach(a => console.log(`    - ${a.account_name}`));
    });
  }
  console.log('');

  // 6. Check branches table with company_id
  console.log('6. Checking branches table with company_id...');
  const { data: branches, error: branchesError } = await supabase
    .from('branches')
    .select('id, name, company_id');
  
  if (branchesError) {
    console.error('Error fetching branches:', branchesError);
  } else {
    console.log(`Found ${branches.length} branches:`);
    const companyGroups = {};
    branches.forEach(b => {
      if (!companyGroups[b.company_id]) {
        companyGroups[b.company_id] = [];
      }
      companyGroups[b.company_id].push(b);
    });
    
    Object.entries(companyGroups).forEach(([companyId, brs]) => {
      console.log(`  Company ${companyId || 'NULL'}: ${brs.length} branches`);
      brs.forEach(b => console.log(`    - ${b.name}`));
    });
  }
  console.log('');

  // 7. Check users table for Kien Trung Phan, Nguyen Van An
  console.log('7. Checking users table...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, role, company_id');
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
  } else {
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`  - ${u.email || u.full_name || u.id}: role=${u.role}, company_id=${u.company_id}`);
    });
    
    // Search for specific names
    const targetUsers = users.filter(u => {
      const nameMatch = u.full_name && (u.full_name.toLowerCase().includes('kien') || u.full_name.toLowerCase().includes('an'));
      const emailMatch = u.email && (u.email.toLowerCase().includes('kien') || u.email.toLowerCase().includes('an'));
      return nameMatch || emailMatch;
    });
    console.log(`\n  Users matching 'Kien' or 'An': ${targetUsers.length}`);
    targetUsers.forEach(u => console.log(`    - ${u.email || u.full_name}: role=${u.role}, company_id=${u.company_id}`));
  }
  console.log('');

  // 8. Test filtering by company_id
  console.log('8. Testing filtering by company_id...');
  if (companies && companies.length > 0) {
    const testCompanyId = companies[0].id;
    console.log(`  Filtering customers by company_id=${testCompanyId}...`);
    const { data: filteredCustomers, error: filterError } = await supabase
      .from('customers')
      .select('*')
      .eq('company_id', testCompanyId);
    
    if (filterError) {
      console.error('  Error filtering:', filterError);
    } else {
      console.log(`  Found ${filteredCustomers.length} customers for company ${testCompanyId}`);
    }
  }
  console.log('');

  console.log('=== Check Complete ===');
}

testMultiTenancy().catch(console.error);
