
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.-t-FKdUVQPY90ZypOFcKeYd-fCGzRcUHhtZZ0E18csQ';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkUser() {
  const { data: users, error } = await supabase.from('users').select('*').eq('email', 'vietnguyenduccp@gmail.com');
  console.log('User:', JSON.stringify(users, null, 2));
}

checkUser();
