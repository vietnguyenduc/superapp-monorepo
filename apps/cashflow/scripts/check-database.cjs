const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCustomerIds() {
  console.log('Checking customer_id in transactions...\n');
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id, 
      transaction_code, 
      customer_id, 
      transaction_type, 
      amount, 
      transaction_date,
      customers!customer_id (full_name, customer_code)
    `)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total transactions found: ${data.length}`);
  
  if (data.length > 0) {
    console.log('\nRecent transactions:');
    console.table(data);
    
    const nullCount = data.filter(t => t.customer_id === null).length;
    const nullNameCount = data.filter(t => !t.customers?.full_name).length;
    console.log(`\nTransactions with null customer_id: ${nullCount}/${data.length}`);
    console.log(`Transactions without customer full_name: ${nullNameCount}/${data.length}`);
  } else {
    console.log('No transactions found in database');
  }
}

async function checkBranchesSchema() {
  console.log('\nChecking branches schema...\n');
  
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Branches table columns:', Object.keys(data[0]));
  } else {
    console.log('No branches found');
  }
}

async function checkTransactionTypeConstraint() {
  console.log('\nChecking transaction_type constraint...\n');
  
  const { data, error } = await supabase.rpc('get_constraint_definition', {
    table_name: 'transactions',
    constraint_name: 'transactions_transaction_type_check'
  });
  
  if (error) {
    console.error('RPC not available, trying direct query...');
  } else {
    console.log('Constraint definition:', data);
  }
}

async function main() {
  await checkCustomerIds();
  await checkBranchesSchema();
  await checkTransactionTypeConstraint();
}

main().catch(console.error);
