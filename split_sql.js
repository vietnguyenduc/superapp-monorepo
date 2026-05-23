const fs = require('fs');
const sql = fs.readFileSync('c:/Vibecoding/superapp-monorepo/supabase/migrations/025_fix_rls_initplan.sql', 'utf8');
const stmts = sql.split('\n\n');
const mid = Math.floor(stmts.length / 2);
fs.writeFileSync('c:/Vibecoding/superapp-monorepo/025_p1.sql', stmts.slice(0, mid).join('\n\n'));
fs.writeFileSync('c:/Vibecoding/superapp-monorepo/025_p2.sql', stmts.slice(mid).join('\n\n'));
console.log('Done splitting');
