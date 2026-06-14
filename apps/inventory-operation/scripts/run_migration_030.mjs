#!/usr/bin/env node
// Run migration 030_fix_users_rls_select.sql via Supabase Management API SQL endpoint
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://peslmsctejmvkwzyohke.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.0Hq3F5mX5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';

const sql = readFileSync('apps/inventory-operation/supabase/migrations/030_fix_users_rls_select.sql', 'utf-8');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('🚀 Running migration 030_fix_users_rls_select.sql...');
  
  // Split by semicolons to run each statement separately
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let success = 0;
  let failed = 0;
  
  for (const stmt of statements) {
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      if (error) {
        // Try direct query instead
        const { error: queryError } = await supabase.from('_sql').select('*').limit(0);
        // Fallback: use raw SQL via fetch
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql: stmt + ';' })
        });
        if (!response.ok) {
          const text = await response.text();
          console.error(`❌ Statement failed: ${stmt.substring(0, 80)}...`);
          console.error(`   Error: ${text}`);
          failed++;
        } else {
          console.log(`✅ Statement executed: ${stmt.substring(0, 80)}...`);
          success++;
        }
      } else {
        console.log(`✅ Statement executed: ${stmt.substring(0, 80)}...`);
        success++;
      }
    } catch (err) {
      console.error(`❌ Statement failed: ${stmt.substring(0, 80)}...`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
