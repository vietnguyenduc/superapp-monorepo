
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.-t-FKdUVQPY90ZypOFcKeYd-fCGzRcUHhtZZ0E18csQ';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkColumns() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'customers' });
  if (error) {
    // Try a dummy insert and catch error
    const { error: iError } = await supabase.from('customers').insert({ id: '00000000-0000-0000-0000-000000000000', full_name: 'Test' });
    console.log('Insert error (gives clues about columns):', iError);
  } else {
    console.log('Columns:', data);
  }
}

checkColumns();
