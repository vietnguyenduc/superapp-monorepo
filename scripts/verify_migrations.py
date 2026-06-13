#!/usr/bin/env python3
"""Verify all SQL migration files have valid syntax."""
import os
import sys
import re

MIGRATIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'supabase', 'migrations')

def check_sql_syntax(filepath):
    """Basic SQL syntax check - verifies file is not empty and has valid structure."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    errors = []
    
    # Check file is not empty
    if not content.strip():
        errors.append("File is empty")
    
    # Check for basic SQL keywords
    sql_keywords = ['CREATE', 'ALTER', 'DROP', 'INSERT', 'UPDATE', 'DELETE', 'SELECT', 'GRANT', 'REVOKE']
    has_keyword = any(re.search(r'\b' + kw + r'\b', content, re.IGNORECASE) for kw in sql_keywords)
    if not has_keyword:
        errors.append("No SQL statements found")
    
    # Check for unterminated strings
    lines = content.split('\n')
    in_string = False
    string_char = None
    for i, line in enumerate(lines, 1):
        # Skip comments
        stripped = line.strip()
        if stripped.startswith('--') or stripped.startswith('/*'):
            continue
        
        for char in line:
            if char in ("'", '"') and not in_string:
                in_string = True
                string_char = char
            elif char == string_char and in_string:
                in_string = False
                string_char = None
    
    if in_string:
        errors.append("Unterminated string literal")
    
    # Check for balanced parentheses
    paren_count = 0
    for char in content:
        if char == '(':
            paren_count += 1
        elif char == ')':
            paren_count -= 1
        if paren_count < 0:
            errors.append("Unbalanced parentheses: too many closing parens")
            break
    
    if paren_count > 0:
        errors.append("Unbalanced parentheses: too many opening parens")
    
    return errors

def main():
    if not os.path.exists(MIGRATIONS_DIR):
        print(f"❌ Migrations directory not found: {MIGRATIONS_DIR}")
        sys.exit(1)
    
    files = sorted(os.listdir(MIGRATIONS_DIR))
    sql_files = [f for f in files if f.endswith('.sql')]
    
    print(f"Found {len(sql_files)} SQL migration files\n")
    
    passed = 0
    failed = 0
    
    for f in sql_files:
        filepath = os.path.join(MIGRATIONS_DIR, f)
        errors = check_sql_syntax(filepath)
        
        if errors:
            print(f"❌ {f}")
            for err in errors:
                print(f"   - {err}")
            failed += 1
        else:
            print(f"✅ {f}")
            passed += 1
    
    print(f"\n{'='*50}")
    print(f"Results: {passed} passed, {failed} failed out of {len(sql_files)} files")
    
    if failed > 0:
        sys.exit(1)
    else:
        print("All migrations verified successfully!")

if __name__ == '__main__':
    main()
