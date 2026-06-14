"""Test rollback safety for Supabase SQL migration files.

This script verifies that each migration file has a corresponding
rollback (down) migration, or at minimum can be safely reversed.

For each migration file, it checks:
1. If a corresponding rollback file exists (e.g. 001_initial_schema.down.sql)
2. If the migration contains only additive changes (CREATE TABLE, CREATE INDEX, etc.)
   which are safe to roll back via DROP
3. If destructive operations (DROP, ALTER COLUMN DROP) are present, flag as risky
"""
import os
import re
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), '..', 'migrations')

# SQL operations that are safe to auto-rollback (can be reversed with DROP)
ADDITIVE_OPS = [
    'CREATE TABLE', 'CREATE INDEX', 'CREATE VIEW', 'CREATE FUNCTION',
    'CREATE POLICY', 'CREATE TRIGGER', 'CREATE SEQUENCE', 'CREATE TYPE',
    'CREATE EXTENSION', 'CREATE SCHEMA', 'CREATE DOMAIN',
    'ALTER TABLE ADD COLUMN', 'ALTER TABLE ADD CONSTRAINT',
    'ALTER TABLE ADD', 'GRANT', 'COMMENT ON',
]

# SQL operations that are destructive and risky to rollback
DESTRUCTIVE_OPS = [
    'DROP TABLE', 'DROP INDEX', 'DROP VIEW', 'DROP FUNCTION',
    'DROP POLICY', 'DROP TRIGGER', 'DROP SEQUENCE', 'DROP TYPE',
    'DROP EXTENSION', 'DROP SCHEMA', 'DROP DOMAIN',
    'ALTER TABLE DROP COLUMN', 'ALTER TABLE DROP CONSTRAINT',
    'ALTER TABLE DROP', 'ALTER COLUMN DROP',
    'ALTER COLUMN SET DATA TYPE', 'ALTER COLUMN TYPE',
    'RENAME TO', 'RENAME COLUMN',
]


def classify_migration(content: str) -> dict:
    """Classify a migration file as additive, destructive, or mixed."""
    result = {
        'additive_ops': [],
        'destructive_ops': [],
        'has_rollback_comment': False,
        'is_safe': True,
        'risk_level': 'low',
    }

    # Check for rollback comments
    if re.search(r'--\s*rollback|--\s*down|--\s*revert', content, re.IGNORECASE):
        result['has_rollback_comment'] = True

    # Check for BEGIN/COMMIT transaction blocks
    has_begin = bool(re.search(r'\bBEGIN\b', content, re.IGNORECASE))
    has_commit = bool(re.search(r'\bCOMMIT\b', content, re.IGNORECASE))
    result['has_transaction'] = has_begin and has_commit

    # Scan for operations
    for op in ADDITIVE_OPS:
        if re.search(rf'\b{re.escape(op)}\b', content, re.IGNORECASE):
            result['additive_ops'].append(op)

    for op in DESTRUCTIVE_OPS:
        if re.search(rf'\b{re.escape(op)}\b', content, re.IGNORECASE):
            result['destructive_ops'].append(op)

    # Determine risk level
    if result['destructive_ops']:
        result['is_safe'] = False
        result['risk_level'] = 'high'
    elif result['has_rollback_comment']:
        result['risk_level'] = 'low'
    elif result['has_transaction']:
        result['risk_level'] = 'low'  # Transaction can be rolled back
    else:
        result['risk_level'] = 'medium'

    return result


def main():
    if not os.path.isdir(MIGRATIONS_DIR):
        print(f'ERROR: Migrations directory not found: {MIGRATIONS_DIR}')
        sys.exit(1)

    sql_files = sorted([f for f in os.listdir(MIGRATIONS_DIR) if f.endswith('.sql')])
    if not sql_files:
        print('ERROR: No SQL files found')
        sys.exit(1)

    print(f'Testing rollback safety for {len(sql_files)} SQL migration files...')
    print()

    # Check for rollback files
    rollback_files = set()
    for f in sql_files:
        base = f.replace('.sql', '.down.sql')
        if base in sql_files:
            rollback_files.add(f)

    results = []
    for fname in sql_files:
        fpath = os.path.join(MIGRATIONS_DIR, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()

        has_rollback = fname in rollback_files
        classification = classify_migration(content)

        results.append({
            'file': fname,
            'has_rollback': has_rollback,
            'size': os.path.getsize(fpath),
            **classification,
        })

    # Print results
    safe_count = 0
    risky_count = 0
    for r in results:
        status_icon = '✅' if r['risk_level'] == 'low' else ('⚠️' if r['risk_level'] == 'medium' else '❌')
        rollback_icon = '📄' if r['has_rollback'] else '  '
        print(f'{status_icon} {rollback_icon} {r["file"]} ({r["size"]:,} bytes)')
        print(f'   Risk: {r["risk_level"].upper()} | Additive: {len(r["additive_ops"])} ops | Destructive: {len(r["destructive_ops"])} ops')

        if r['has_rollback']:
            print(f'   ✅ Has rollback file')
        if r['has_rollback_comment']:
            print(f'   📝 Has rollback comment')
        if r['has_transaction']:
            print(f'   🔄 Wrapped in transaction')
        if r['destructive_ops']:
            print(f'   ⚠️  Destructive ops: {", ".join(r["destructive_ops"][:3])}')
            if len(r['destructive_ops']) > 3:
                print(f'       ... and {len(r["destructive_ops"]) - 3} more')

        if r['risk_level'] == 'low':
            safe_count += 1
        else:
            risky_count += 1

        print()

    print('=' * 60)
    print(f'SUMMARY: {len(results)} files checked')
    print(f'  ✅ Safe (low risk):     {safe_count}')
    print(f'  ⚠️  Medium risk:         {len([r for r in results if r["risk_level"] == "medium"])}')
    print(f'  ❌ High risk:           {len([r for r in results if r["risk_level"] == "high"])}')
    print(f'  📄 Has rollback file:   {len(rollback_files)}')
    print()

    # Recommendations
    high_risk = [r for r in results if r['risk_level'] == 'high']
    if high_risk:
        print('RECOMMENDATIONS:')
        for r in high_risk:
            print(f'  - Create rollback file for {r["file"]} (contains destructive ops)')
        print()

    if risky_count == 0:
        print('🎉 All migrations are safe to rollback!')
    else:
        print(f'⚠️  {risky_count} migration(s) need attention for safe rollback.')


if __name__ == '__main__':
    main()
