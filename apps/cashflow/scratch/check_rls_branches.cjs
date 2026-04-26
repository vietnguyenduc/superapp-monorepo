
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.-t-FKdUVQPY90ZypOFcKeYd-fCGzRcUHhtZZ0E18csQ';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkRLS() {
  const { data, error } = await supabase.from('pg_policies').select('*');
  if (data) {
    const branchPolicies = data.filter(p => p.tablename === 'branches');
    console.log('Branch Policies:', JSON.stringify(branchPolicies, null, 2));
  } else {
    console.log('Error fetching policies:', error);
  }
}

checkRLS();
