# HR Excel input wizard

`HR_Input_Wizard_v1.xlsx` is the phase-A input form for testing the SharePoint → HR
pipeline. It is macro-free and is designed to work in Excel Desktop and Excel for the
web.

## User flow

1. Open `BAT_DAU` and follow the numbered steps.
2. Enter employee identity data in `01_HO_SO`.
3. Enter assignment and compensation data in `02_CONG_VIEC`.
4. Resolve all errors shown in `03_KIEM_TRA` before submitting the workbook.

Yellow cells are editable. Gray formula cells are protected from accidental edits.
Sheet protection uses `hr-template`; it is an editing guard, not a security boundary.
The workbook contains no macros, credentials, external links, or employee records.

The ingestion contract reads the Excel Tables `tbl_hr_employee_profile` and
`tbl_hr_employment_assignment` by name and ignores rows with a blank employee code.
Do not rename those tables. Catalog values can be maintained in `DANH_MUC`.

## Regenerate

Install the isolated generator dependency, then provide reference workbooks containing
job-title and company catalogs. The generator reads only reusable catalog values; it
does not copy employee rows into the output.

```bash
python3 -m pip install --target /tmp/hr_excel_deps \
  -r apps/hr-operation/scripts/requirements-excel.txt
PYTHONPATH=/tmp/hr_excel_deps python3 \
  apps/hr-operation/scripts/generate_hr_input_workbook.py \
  --output apps/hr-operation/docs/templates/HR_Input_Wizard_v1.xlsx \
  --job-titles /path/to/Job_Titles_VI_EN.xlsx \
  --employee-master /path/to/DS_MIDOMAX_2026_Master.xlsx
```

The generated workbook requests a full formula recalculation when Excel opens it.
