import pandas as pd
import numpy as np

def apply_transformations(df: pd.DataFrame, transformations: list) -> pd.DataFrame:
    """
    Applies a list of JSON-defined transformation rules to a DataFrame.
    This acts as a secure sandbox, preventing arbitrary code execution.
    
    Supported action types:
    - rename_columns: {"action": "rename_columns", "mapping": {"old_name": "new_name"}}
    - fillna: {"action": "fillna", "columns": ["col1", "col2"], "value": 0}
    - replace: {"action": "replace", "column": "col_name", "mapping": {"old_val": "new_val"}}
    - cast: {"action": "cast", "column": "col_name", "target_type": "int" | "float" | "str" | "datetime"}
    - drop_columns: {"action": "drop_columns", "columns": ["col1", "col2"]}
    - drop_nulls: {"action": "drop_nulls", "columns": ["col1", "col2"]}
    """
    df_clean = df.copy()
    
    for rule in transformations:
        action = rule.get("action")
        
        try:
            if action == "rename_columns":
                df_clean = df_clean.rename(columns=rule.get("mapping", {}))
                
            elif action == "fillna":
                cols = rule.get("columns", [])
                val = rule.get("value")
                for col in cols:
                    if col in df_clean.columns:
                        df_clean[col] = df_clean[col].fillna(val)
                        
            elif action == "replace":
                col = rule.get("column")
                mapping = rule.get("mapping", {})
                if col in df_clean.columns:
                    # Strip whitespace before replacing if string, or just use exact mapping
                    # Also replace exact matches
                    df_clean[col] = df_clean[col].replace(mapping)
                    
            elif action == "cast":
                col = rule.get("column")
                t_type = rule.get("target_type")
                if col in df_clean.columns:
                    if t_type == "int":
                        # Convert to numeric first (handles string representations like '15000'), then int
                        # Using Int64 allows NaN to co-exist with ints if any slip through
                        df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').astype('Int64')
                    elif t_type == "float":
                        df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce')
                    elif t_type == "str":
                        df_clean[col] = df_clean[col].astype(str)
                    elif t_type == "datetime":
                        df_clean[col] = pd.to_datetime(df_clean[col], errors='coerce')
                        
            elif action == "drop_columns":
                cols = rule.get("columns", [])
                df_clean = df_clean.drop(columns=[c for c in cols if c in df_clean.columns])
                
            elif action == "drop_nulls":
                cols = rule.get("columns", [])
                df_clean = df_clean.dropna(subset=[c for c in cols if c in df_clean.columns])
                
        except Exception as e:
            print(f"Failed to apply rule {rule}: {e}")
            # Continue with other rules, or could raise an error based on strictness requirements
            raise ValueError(f"Error applying {action} rule on data: {e}")
            
    return df_clean
