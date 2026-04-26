
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.-t-FKdUVQPY90ZypOFcKeYd-fCGzRcUHhtZZ0E18csQ';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function listPolicies() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'branches' });
  if (error) {
    // If RPC doesn't exist, try direct query on pg_policies
    const { data: policies, error: pError } = await supabase.from('pg_policies').select('*').eq('tablename', 'branches');
    if (pError) {
       console.log('Could not fetch policies via direct query (likely no permissions). trying another way...');
       const { data: raw, error: rError } = await supabase.from('branches').select('name, company_id');
       console.log('Sample branches with company_id:', JSON.stringify(raw, null, 2));
    } else {
       console.log('Policies:', JSON.stringify(policies, null, 2));
    }
  } else {
    console.log('Policies:', JSON.stringify(data, null, 2));
  }
}

listPolicies();
