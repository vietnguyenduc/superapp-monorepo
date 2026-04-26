
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peslmsctejmvkwzyohke.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.-t-FKdUVQPY90ZypOFcKeYd-fCGzRcUHhtZZ0E18csQ';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testMapping() {
  const { data: branchData, error } = await supabase
    .from("branches")
    .select("id, name, code, address, phone, email, manager_id, company_id, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  console.log('Raw data count:', branchData.length);
  
  const mapped = branchData
    .filter((b) => b.is_active !== false)
    .map((branch) => {
      const name = String(branch.name || branch.branch_name || "").trim();
      const code = String(branch.code || branch.id || "").trim();
      const result = [name, code].filter(Boolean).join(" - ");
      console.log(`Mapped: "${result}" (ID: ${branch.id})`);
      return result;
    })
    .filter(Boolean);

  console.log('Final mapped count:', mapped.length);
}

testMapping();
