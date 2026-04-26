
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.-t-FKdUVQPY90ZypOFcKeYd-fCGzRcUHhtZZ0E18csQ';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_info', { t_name: 'customers' });
  if (error) {
    // Alternative: query information_schema if enabled
    const { data: cols, error: cError } = await supabase.from('customers').select('*').limit(0);
    console.log('Columns from empty select:', cols);
  } else {
    console.log('Table Info:', data);
  }
}

checkSchema();
