import pandas as pd
import json

def profile_dataframe(df: pd.DataFrame, max_rows: int = 5) -> dict:
    """
    Profiles a Pandas DataFrame and extracts metadata for the AI Agent to review.
    """
    # Number of rows and columns
    total_rows = len(df)
    total_cols = len(df.columns)
    
    # Column details
    columns_profile = []
    for col in df.columns:
        col_type = str(df[col].dtype)
        null_count = int(df[col].isna().sum())
        
        # Determine unique count for text to catch typos
        unique_count = None
        if pd.api.types.is_object_dtype(df[col]) or pd.api.types.is_string_dtype(df[col]):
            unique_count = int(df[col].nunique())
            
        columns_profile.append({
            "name": str(col),
            "type": col_type,
            "null_count": null_count,
            "unique_count": unique_count
        })
        
    # Get a sample of the data (first max_rows)
    # Fill NaN with None so it's valid JSON
    sample_data = df.head(max_rows).replace({float('nan'): None}).to_dict(orient='records')
    
    return {
        "summary": {
            "total_rows": total_rows,
            "total_columns": total_cols
        },
        "columns": columns_profile,
        "sample": sample_data
    }
