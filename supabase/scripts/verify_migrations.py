"""Verify all SQL migration files for basic syntax errors."""
import os, re, sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), '..', 'migrations')
def check_sql_syntax(filepath):
    errors = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    total_open = content.count('(')
    total_close = content.count(')')
    if total_open != total_close:
        errors.append(f'  FILE: Total parenthesis mismatch (open={total_open}, close={total_close}, diff={abs(total_open-total_close)})')
    lines = content.split('\n')
    in_dollar_tag = False
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        if '' in stripped:
            dc = stripped.count('')
            if dc % 2 == 1:
                in_dollar_tag = not in_dollar_tag
            continue
        if in_dollar_tag:
            continue
        sq_count = stripped.count("'")
        if sq_count % 2 != 0:
            errors.append(f'  Line {i}: Unterminated string (odd number of quotes: {sq_count})')
    required_keywords = ['CREATE', 'ALTER', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'GRANT', 'REVOKE', 'TRUNCATE', 'SELECT']
    has_action = any(re.search(rf'\b{kw}\b', content, re.IGNORECASE) for kw in required_keywords)
    if not has_action and len(content.strip()) > 50:
        errors.append('  WARNING: No SQL action keywords found')
    return errors
def main():
    if not os.path.isdir(MIGRATIONS_DIR):
        print('ERROR: Migrations directory not found')
        sys.exit(1)
    sql_files = sorted([f for f in os.listdir(MIGRATIONS_DIR) if f.endswith('.sql')])
    if not sql_files:
        print('ERROR: No SQL files found')
        sys.exit(1)
    print(f'Verifying {len(sql_files)} SQL migration files...')
    print()
    total_errors = 0
    for fname in sql_files:
        fpath = os.path.join(MIGRATIONS_DIR, fname)
        errors = check_sql_syntax(fpath)
        if errors:
            total_errors += len(errors)
            print(f'FAIL: {fname} - {len(errors)} issue(s):')
            for err in errors:
                print(err)
        else:
            size = os.path.getsize(fpath)
            print(f'OK: {fname} ({size:,} bytes)')
    print()
    print('=' * 50)
    if total_errors == 0:
        print(f'ALL {len(sql_files)} SQL files - syntax OK!')
    else:
        print(f'Found {total_errors} issue(s) across {len(sql_files)} files')
        sys.exit(1)
if __name__ == '__main__':
    main()
