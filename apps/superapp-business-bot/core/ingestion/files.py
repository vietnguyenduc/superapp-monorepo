import pandas as pd
import asyncio
import io

async def parse_file(file_content: bytes, file_name: str) -> pd.DataFrame:
    """
    Parses a CSV or Excel file into a Pandas DataFrame using asyncio.to_thread 
    to prevent blocking the main event loop.
    """
    def _parse():
        # Identify the file extension
        ext = file_name.split('.')[-1].lower()
        if ext == 'csv':
            return pd.read_csv(io.BytesIO(file_content))
        elif ext in ['xlsx', 'xls']:
            return pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
        else:
            raise ValueError(f"Unsupported file format: {ext}")
            
    # Run the synchronous pandas parser in a separate thread
    df = await asyncio.to_thread(_parse)
    return df
