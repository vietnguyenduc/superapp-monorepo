import json
import sys
from pathlib import Path

# Add the apps/superapp-business-bot to sys.path so we can import core
bot_dir = Path(__file__).parent.parent
sys.path.insert(0, str(bot_dir))

from tools import export_report_csv

def main():
    print("\n--- Testing Phase 3: Export Report CSV ---")
    
    xlsx_path = bot_dir / "test_data" / "dirty_hr.xlsx"
    
    rules = [
        {"action": "rename_columns", "mapping": {"Emp_ID": "employee_id", "Name": "full_name"}},
        {"action": "replace", "column": "Salary", "mapping": {"Mười lăm ngàn": 15000}},
        {"action": "fillna", "columns": ["Salary"], "value": 0},
        {"action": "cast", "column": "Salary", "target_type": "int"},
        {"action": "replace", "column": "Department", "mapping": {"Sale": "Sales", " Sa les ": "Sales", " HR ": "HR"}},
        {"action": "drop_columns", "columns": ["Date_of_Birth"]}
    ]
    
    args = {
        "source_type": "excel",
        "path_or_url": str(xlsx_path),
        "rules": rules,
        "output_filename": "test_export_cleaned.csv"
    }
    
    print("\n[AI Action] Running export_report_csv tool...")
    result = export_report_csv(args)
    print(result)

if __name__ == "__main__":
    main()
