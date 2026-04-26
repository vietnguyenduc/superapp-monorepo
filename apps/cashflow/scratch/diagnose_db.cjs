
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.-t-FKdUVQPY90ZypOFcKeYd-fCGzRcUHhtZZ0E18csQ';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function diagnose() {
  console.log('--- DIAGNOSING BRANCHES ---');
  const { data: branches, error: bError } = await supabase.from('branches').select('*');
  console.log('Branches count:', branches?.length || 0);
  console.log('Branches:', JSON.stringify(branches, null, 2));
  
  console.log('\n--- DIAGNOSING CUSTOMERS ---');
  const { count: cCount, error: cError } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  console.log('Total Customers count:', cCount || 0);
  
  console.log('\n--- DIAGNOSING TRANSACTION TYPES ---');
  const { data: types, error: tError } = await supabase.from('transaction_types').select('*');
  console.log('Types:', JSON.stringify(types, null, 2));
}

diagnose();
