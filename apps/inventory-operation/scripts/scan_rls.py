import re, os, glob

migrations_dir = "supabase/migrations"
files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))

print("=" * 80)
print("RLS INFINITE RECURSION SCAN")
print("=" * 80)

for fpath in files:
    fname = os.path.basename(fpath)
    with open(fpath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    # Find all CREATE POLICY statements on users table
    policy_pattern = re.compile(
        r'CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+public\.\s*"?users"?\s+'
        r'FOR\s+(SELECT|ALL|INSERT|UPDATE|DELETE)\s+'
        r'(?:TO\s+[^)]+)?\s*'
        r'(?:USING|WITH CHECK)\s*\(',
        re.IGNORECASE | re.DOTALL
    )
    
    for match in policy_pattern.finditer(content):
        policy_name = match.group(1)
        action = match.group(2)
        
        # Find the full policy body
        start = match.start()
        depth = 0
        end = start
        for i in range(start, len(content)):
            if content[i] == '(':
                depth += 1
            elif content[i] == ')':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        
        policy_body = content[start:end]
        
        # Check for self-referencing SELECT on users table
        if re.search(r'FROM\s+public\.\s*"?users"?', policy_body, re.IGNORECASE):
            print(f"\nRED INFINITE RECURSION RISK in {fname}")
            print(f"   Policy: {policy_name} (FOR {action})")
            subquery_match = re.search(
                r'(FROM\s+public\.\s*"?users"?[^;)]+)',
                policy_body, re.IGNORECASE
            )
            if subquery_match:
                print(f"   Self-referencing: ...{subquery_match.group(1)[:100]}...")
        else:
            if re.search(r'check_user_role|get_user_company_id', policy_body, re.IGNORECASE):
                print(f"\nYELLOW POTENTIAL INDIRECT RECURSION in {fname}")
                print(f"   Policy: {policy_name} (FOR {action})")
                print(f"   Uses helper function that may query users table")

print("\n" + "=" * 80)
print("SCAN COMPLETE")
print("=" * 80)
