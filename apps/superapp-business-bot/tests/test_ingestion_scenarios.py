import asyncio
import json
from pathlib import Path
import sys

# Add the apps/superapp-business-bot to sys.path so we can import core
bot_dir = Path(__file__).parent.parent
sys.path.insert(0, str(bot_dir))

from core.ingestion.files import parse_file
from core.ingestion.profiler import profile_dataframe

async def test_csv_happy_path():
    print("\n--- Testing Scenario 1: Clean CSV ---")
    csv_path = bot_dir / "test_data" / "clean_sales.csv"
    with open(csv_path, "rb") as f:
        content = f.read()
        
    df = await parse_file(content, "clean_sales.csv")
    profile = profile_dataframe(df)
    
    print(f"Total Rows: {profile['summary']['total_rows']}")
    for col in profile['columns']:
        print(f"Col: {col['name']} | Type: {col['type']} | Nulls: {col['null_count']}")

async def test_excel_dirty_path():
    print("\n--- Testing Scenario 2: Dirty Excel ---")
    xlsx_path = bot_dir / "test_data" / "dirty_hr.xlsx"
    with open(xlsx_path, "rb") as f:
        content = f.read()
        
    df = await parse_file(content, "dirty_hr.xlsx")
    profile = profile_dataframe(df)
    
    print(f"Total Rows: {profile['summary']['total_rows']}")
    for col in profile['columns']:
        warning = "<-- MIXED/DIRTY!" if col['type'] == 'object' and col['name'] == 'Salary' else ""
        null_warning = "<-- HAS NULLS!" if col['null_count'] > 0 else ""
        print(f"Col: {col['name']:<15} | Type: {col['type']:<8} | Nulls: {col['null_count']} {warning} {null_warning}")
        if col['name'] == 'Department':
            print(f"    Unique count (potential typos): {col['unique_count']}")

async def main():
    try:
        await test_csv_happy_path()
        await test_excel_dirty_path()
        print("\nAll tests executed successfully.")
    except Exception as e:
        print(f"\nError during testing: {e}")

if __name__ == "__main__":
    asyncio.run(main())
