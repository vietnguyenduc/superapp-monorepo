
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.-t-FKdUVQPY90ZypOFcKeYd-fCGzRcUHhtZZ0E18csQ';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkDetails() {
  const { data, error } = await supabase.from('branches').select('*');
  console.log('Branches:', JSON.stringify(data, null, 2));
}

checkDetails();
