import asyncio
import json
from pathlib import Path
import sys

# Add the apps/superapp-business-bot to sys.path so we can import core
bot_dir = Path(__file__).parent.parent
sys.path.insert(0, str(bot_dir))

from tools import clean_and_preview_data, insert_to_supabase

def main():
    print("\n--- Testing Phase 2: JSON Rule Cleaning Engine ---")
    
    xlsx_path = bot_dir / "test_data" / "dirty_hr.xlsx"
    
    # Simulate AI generating JSON rules from user prompt
    rules = [
        {"action": "rename_columns", "mapping": {"Emp_ID": "employee_id", "Name": "full_name"}},
        {"action": "replace", "column": "Salary", "mapping": {"Mười lăm ngàn": 15000}},
        {"action": "fillna", "columns": ["Salary"], "value": 0},
        {"action": "cast", "column": "Salary", "target_type": "int"},
        {"action": "replace", "column": "Department", "mapping": {"Sale": "Sales", " Sa les ": "Sales", " HR ": "HR"}},
        {"action": "drop_columns", "columns": ["Date_of_Birth"]}
    ]
    
    # 1. Clean and Preview
    print("\n[AI Action] Running clean_and_preview_data tool...")
    preview_json = clean_and_preview_data("excel", str(xlsx_path), rules)
    preview = json.loads(preview_json)
    
    if preview.get("status") == "success":
        print("[SUCCESS] Clean successful!")
        profile = preview["new_profile"]
        
        print(f"\nNew Profile Summary: {profile['summary']}")
        for col in profile["columns"]:
            print(f"Col: {col['name']:<15} | Type: {col['type']:<8} | Nulls: {col['null_count']} | Uniques: {col['unique_count']}")
            
        print("\nPreview Sample (First 2 rows):")
        for row in profile["sample"][:2]:
            print(row)
    else:
        print(f"[ERROR] Clean failed: {preview.get('message')}")
        return

    # 2. Insert
    print("\n[AI Action] User approves. Running insert_to_supabase tool...")
    insert_result_json = insert_to_supabase("excel", str(xlsx_path), rules, "employees")
    insert_result = json.loads(insert_result_json)
    
    if insert_result.get("status") == "success":
        print(f"[SUCCESS] Insert successful! Message: {insert_result['message']}")
    else:
        print(f"[ERROR] Insert failed: {insert_result.get('message')}")

if __name__ == "__main__":
    main()
