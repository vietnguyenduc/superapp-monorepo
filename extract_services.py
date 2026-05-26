import re

def remove_block(text, start_pattern):
    match = re.search(start_pattern, text)
    if not match:
        return text
    
    start_idx = match.start()
    
    brace_idx = text.find('{', start_idx)
    if brace_idx == -1:
        return text
        
    brace_count = 1
    i = brace_idx + 1
    in_string = False
    string_char = None
    
    while i < len(text) and brace_count > 0:
        c = text[i]
        
        # Simple string handling (ignores regex literals and comments but good enough for these blocks)
        if c in ('"', "'", '`'):
            if not in_string:
                in_string = True
                string_char = c
            elif c == string_char and text[i-1] != '\\':
                in_string = False
        
        elif not in_string:
            if c == '{':
                brace_count += 1
            elif c == '}':
                brace_count -= 1
                
        i += 1
        
    if brace_count == 0:
        end_idx = i
        if end_idx < len(text) and text[end_idx] == ';':
            end_idx += 1
        return text[:start_idx] + text[end_idx:]
    
    return text

file_path = "apps/cashflow/src/services/database.ts"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Remove the inline services
text = remove_block(text, r"const\s+customerService\s*=\s*\{")
text = remove_block(text, r"const\s+transactionService\s*=\s*\{")
text = remove_block(text, r"const\s+branchService\s*=\s*\{")
text = remove_block(text, r"const\s+bankAccountService\s*=\s*\{")

# We also need to add the imports at the top
imports = """
import { customerService } from './customerService';
import { transactionService } from './transactionService';
import { branchService } from './branchService';
import { bankAccountService } from './bankAccountService';
"""

# add imports after the last import in the file
import_end = text.rfind("import ")
if import_end != -1:
    newline_after = text.find("\\n", import_end)
    if newline_after == -1: newline_after = import_end
    text = text[:newline_after+1] + imports + text[newline_after+1:]
else:
    text = imports + text

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)
print("Successfully removed blocks and added imports.")
