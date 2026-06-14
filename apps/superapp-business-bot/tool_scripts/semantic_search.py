import os
import ast
import re

def _search_python_ast(filepath: str, query: str) -> str:
    """Uses Python's built-in AST to find classes or functions."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            source = f.read()
        tree = ast.parse(source, filename=filepath)
        
        matches = []
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                if query.lower() in node.name.lower():
                    kind = "Class" if isinstance(node, ast.ClassDef) else "Function"
                    matches.append(f"[{kind}] {node.name} (Line {node.lineno})")
        
        if matches:
            return f"Found in {filepath}:\n" + "\n".join(matches)
        return ""
    except Exception as e:
        return f"Error parsing {filepath}: {e}"

def _search_js_regex(filepath: str, query: str) -> str:
    """Uses regex to find classes or functions in JS/TS files."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        matches = []
        # Matches: class X, function Y, const Z = () =>, etc.
        patterns = [
            (r'class\s+([A-Za-z0-9_]+)', 'Class'),
            (r'function\s+([A-Za-z0-9_]+)', 'Function'),
            (r'(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>', 'ArrowFunction'),
            (r'(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*function', 'FunctionExpression')
        ]
        
        for idx, line in enumerate(lines):
            line_str = line.strip()
            for pattern, kind in patterns:
                for match in re.finditer(pattern, line_str):
                    name = match.group(1)
                    if query.lower() in name.lower():
                        matches.append(f"[{kind}] {name} (Line {idx + 1})")
                        
        if matches:
            return f"Found in {filepath}:\n" + "\n".join(matches)
        return ""
    except Exception as e:
        return f"Error parsing {filepath}: {e}"

def semantic_search(args: dict) -> str:
    """
    Search for a specific class or function name in a directory.
    Uses AST for Python and regex for JS/TS/React.
    """
    query = args.get("query", "")
    directory = args.get("dirpath", ".")
    
    if not query:
        return "Error: 'query' parameter is required."
        
    results = []
    
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or '__pycache__' in root or '.next' in root:
            continue
            
        for file in files:
            filepath = os.path.join(root, file)
            if file.endswith('.py'):
                res = _search_python_ast(filepath, query)
                if res and not res.startswith("Error"):
                    results.append(res)
            elif file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                res = _search_js_regex(filepath, query)
                if res and not res.startswith("Error"):
                    results.append(res)
                    
    if not results:
        return f"No semantic matches found for '{query}' in {directory}."
        
    return "\n\n".join(results)
