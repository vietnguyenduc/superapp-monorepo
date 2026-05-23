const fs = require('fs');

async function main() {
  const data = JSON.parse(fs.readFileSync('C:/Users/Lenovo ThinkBook 14/.gemini/antigravity/brain/3caf0b7b-48ce-4677-af80-5a3c062d4601/.system_generated/steps/301/output.txt', 'utf-8'));
  const policiesJsonStr = data.result.match(/<untrusted-data[^>]*>\n([\s\S]*?)\n<\/untrusted-data/)[1];
  const policies = JSON.parse(policiesJsonStr);

  let sql = '-- Fix auth_rls_initplan issues by wrapping auth.uid() in scalar subqueries\n\n';

  for (const pol of policies) {
    // Only process those that have auth.uid() without SELECT
    const qual = pol.polqual || '';
    const withcheck = pol.polwithcheck || '';
    
    // We only care about instances of auth.uid() that are NOT immediately preceded by SELECT (with optional spaces)
    // A simple regex: (?<!SELECT\s+)auth\.uid\(\)
    const hasRawUid = /(?<!SELECT\s+(?:auth\.uid\(\)\s+AS\s+uid|auth\.uid\(\)))(?:auth\.uid\(\)|auth\.jwt\(\))/i.test(qual) || 
                      /(?<!SELECT\s+(?:auth\.uid\(\)\s+AS\s+uid|auth\.uid\(\)))(?:auth\.uid\(\)|auth\.jwt\(\))/i.test(withcheck);
                      
    if (hasRawUid) {
      sql += `DROP POLICY IF EXISTS "${pol.polname}" ON public."${pol.table_name}";\n`;
      
      let cmdMap = {
        'r': 'SELECT',
        'a': 'INSERT',
        'w': 'UPDATE',
        'd': 'DELETE',
        '*': 'ALL'
      };
      let cmd = cmdMap[pol.polcmd] || 'ALL';
      
      sql += `CREATE POLICY "${pol.polname}" ON public."${pol.table_name}" FOR ${cmd}\n`;
      
      if (pol.polqual) {
        let newQual = pol.polqual.replace(/(?<!SELECT\s+(?:auth\.uid\(\)\s+AS\s+uid|auth\.uid\(\)))(auth\.uid\(\)|auth\.jwt\(\))/gi, '(select $1)');
        sql += `USING (${newQual})\n`;
      }
      if (pol.polwithcheck) {
        let newWithCheck = pol.polwithcheck.replace(/(?<!SELECT\s+(?:auth\.uid\(\)\s+AS\s+uid|auth\.uid\(\)))(auth\.uid\(\)|auth\.jwt\(\))/gi, '(select $1)');
        sql += `WITH CHECK (${newWithCheck})\n`;
      }
      
      sql = sql.trim() + ';\n\n';
    }
  }

  fs.writeFileSync('c:/Vibecoding/superapp-monorepo/supabase/migrations/025_fix_rls_initplan.sql', sql);
  console.log('Migration generated successfully.');
}

main().catch(console.error);
