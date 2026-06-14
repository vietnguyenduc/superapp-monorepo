#!/usr/bin/env node
// Run raw SQL on Supabase via REST API using service_role key
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://peslmsctejmvkwzyohke.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc2xtc2N0ZWptdmt3enlvaGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ2NjYxMiwiZXhwIjoyMDg2MDQyNjEyfQ.0Hq3F5mX5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q';

const sql = readFileSync('apps/inventory-operation/supabase/migrations/030_fix_users_rls_select.sql', 'utf-8');

async function main() {
  console.log('🚀 Running migration 030_fix_users_rls_select.sql via REST API...\n');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('\n--'));
  
  let success = 0;
  let failed = 0;
  
  for (const stmt of statements) {
    const fullStmt = stmt + ';';
    console.log(`Executing: ${fullStmt.substring(0, 100)}...`);
    
    try {
      // Use Supabase REST API with service_role key
      // The /rest/v1/ endpoint allows raw SQL via the "query" parameter
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query: fullStmt })
      });
      
      if (!response.ok) {
        const text = await response.text();
        // Check if it's a "already exists" warning (non-critical)
        if (text.includes('already exists') || text.includes('42710') || text.includes('42P07')) {
          console.log(`  ⚠️  Already exists (non-critical): ${text.substring(0, 100)}`);
          success++;
        } else {
          console.error(`  ❌ Failed: ${text.substring(0, 200)}`);
          failed++;
        }
      } else {
        console.log(`  ✅ Success`);
        success++;
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${success} succeeded, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
