import gspread
import pandas as pd
import asyncio
from google.oauth2.service_account import Credentials
import os
import re

async def parse_google_sheet(url: str, credentials_path: str = "service_account.json") -> pd.DataFrame:
    """
    Connects to a Google Sheet using the provided URL and extracts it into a Pandas DataFrame.
    Runs synchronously but offloaded to a thread to prevent event loop blocking.
    """
    def _parse():
        # Validate that credentials file exists
        if not os.path.exists(credentials_path):
            raise FileNotFoundError(f"Google Service Account credentials not found at {credentials_path}. Please create one and place it in the bot directory.")
            
        scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly', 'https://www.googleapis.com/auth/drive.readonly']
        credentials = Credentials.from_service_account_file(credentials_path, scopes=scopes)
        
        # Authorize client
        gc = gspread.authorize(credentials)
        
        # Open sheet
        try:
            # We can open by URL
            sh = gc.open_by_url(url)
            worksheet = sh.sheet1
            
            # Fetch all records
            all_records = worksheet.get_all_records()
            return pd.DataFrame(all_records)
            
        except gspread.exceptions.APIError as e:
            if "PERMISSION_DENIED" in str(e):
                raise PermissionError("The bot's service account does not have permission to view this Google Sheet. Please share it with the service account email.")
            raise e
        except Exception as e:
            raise e
            
    df = await asyncio.to_thread(_parse)
    return df
