# Data Ingestion UX Flow & Refined Implementation Plan

## 1. Executive Summary
This document designs a Telegram-native, conversational UX flow and refined backend architecture for the Data Ingestion feature of the `superapp-business-bot`. By leveraging Pandas as the parsing engine and designing a robust, human-in-the-loop interaction loop using Telegram inline buttons and Markdown tables, the bot can securely ingest dirty CSV/XLSX files and Google Sheets into Supabase tables (such as `employees` and `payroll_items`).

---

## 2. Target Database Schemas & Mapping Strategy
Based on the Supabase database migrations (specifically `032_hr_payroll_schema.sql` and `packages/types/src/database.types.ts`), the data ingestion feature must support mapping unstructured source files into clean database relations.

### Target Table: `employees`
- **`company_id`** (UUID, Required, Foreign Key to `companies(id)`)
- **`employee_code`** (VARCHAR(50), Required, Unique per company) -> Primary natural key for matching.
- **`full_name`** (VARCHAR(255), Required)
- **`base_salary`** (NUMERIC(15, 2), Optional, Default: 0)
- **`status`** (VARCHAR(50), Optional, Default: 'active')
- **`join_date`** (DATE, Optional)
- **`department_id`** (UUID, Optional, Foreign Key to `departments(id)`)
- **`user_id`** (UUID, Optional, Foreign Key to `users(id)`)

### Target Table: `payroll_items`
- **`payroll_id`** (UUID, Required, Foreign Key to `payrolls(id)`) -> Part of unique composite key.
- **`employee_id`** (UUID, Required, Foreign Key to `employees(id)`) -> Part of unique composite key.
- **`base_salary`** (NUMERIC(15, 2), Default: 0)
- **`standard_days`** (NUMERIC(5, 2), Default: 0)
- **`actual_days`** (NUMERIC(5, 2), Default: 0)
- **`ot_hours`** (NUMERIC(5, 2), Default: 0)
- **`allowances`** (NUMERIC(15, 2), Default: 0)
- **`deductions`** (NUMERIC(15, 2), Default: 0)
- **`net_salary`** (NUMERIC(15, 2), Default: 0)

---

## 3. Telegram-Native UX Flow
This flow operates strictly using Telegram Markdown text formatting and inline buttons, avoiding WebApps/Webviews to maximize performance and integration simplicity.

### 3.1 Happy Path: CSV/XLSX Ingestion
This script outlines the back-and-forth messages for a successful import into the `employees` table.

#### Step 1: Ingestion Initiation
The user starts the ingestion by sending a file or typing the `/ingest` command.
* **User**: Uploads file `salary_may_2026.xlsx` (with columns: "Mã NV", "Họ tên", "Lương cứng", "Ngày vào")
* **Bot**:
```markdown
📥 **DATA INGESTION ENGINE**

I have received your file: `salary_may_2026.xlsx` (24.5 KB).

Please select the destination table in the database:
```
* **Inline Buttons**:
  - `👥 Employees (employees)` | `💰 Payroll Items (payroll_items)`
  - `🧾 Invoices (accounting_invoices)` | `❌ Cancel Ingestion`

---

#### Step 2: Schema Mapping Preview (AI Suggestion)
The user selects `👥 Employees (employees)`. The bot runs a dry-run profile of the columns using Pandas, matches column names to target columns, and prints the profile.
* **User**: Clicks `👥 Employees (employees)`
* **Bot**:
```markdown
🔍 **DATA PROFILING & SCHEMA MAPPING**

File: `salary_may_2026.xlsx`
Target: `employees`
Total Rows: `45`

**Proposed Schema Mapping:**
• 🏷️ **Mã NV** ➔ `employee_code` (Match: 95%)
• 👤 **Họ tên** ➔ `full_name` (Match: 98%)
• 💵 **Lương cứng** ➔ `base_salary` (Match: 92%)
• 📅 **Ngày vào** ➔ `join_date` (Match: 89%)

**Data Quality Profile:**
- `employee_code`: 45 non-null values (100% complete, no duplicates).
- `full_name`: 45 non-null values (100% complete, all text).
- `base_salary`: 42 numeric values (3 empty values will default to `0`).
- `join_date`: 45 valid dates (auto-formatted to `YYYY-MM-DD`).

Do you approve this mapping and wish to execute the data import?
```
* **Inline Buttons**:
  - `✅ Approve & Import`
  - `⚙️ Adjust Mapping`
  - `❌ Cancel Ingestion`

---

#### Step 3: Execution & Confirmation Report
* **User**: Clicks `✅ Approve & Import`
* **Bot**: *(Displays typing indicator for 1.5s while executing the transaction)*
```markdown
🎉 **DATA IMPORT SUCCESSFUL!**

The data has been verified and securely written to the database.

📊 **Execution Summary:**
- **Destination Table**: `employees`
- **Action**: `UPSERT` (Insert new, update existing)
- **Rows Processed**: `45`
- **Successfully Inserted**: `42`
- **Successfully Updated**: `3`
- **Errors / Skipped**: `0`
- **Reconciliation Sum**: `584,200,000 VND` (Total base_salary)

🔍 **Database Sample (First 3 rows stored):**
| Code | Name | Salary (VND) | Join Date |
| :--- | :--- | :--- | :--- |
| NV001 | Nguyen Van A | 15,000,000 | 2024-01-10 |
| NV002 | Tran Thi B | 18,000,000 | 2023-05-15 |
| NV003 | Le Van C | 12,000,000 | 2025-02-01 |

🔗 **Audit Details:**
- **Operator**: `trial_+84849698333@superapp.com`
- **Timestamp**: `2026-06-14 03:22:45 UTC`
- **Transaction ID**: `tx_8f9c2d1b`

[View Live Records on Web Portal](https://vibecoding-cashflow-hr.vercel.app/employees)
```
* **Inline Buttons**:
  - `📄 Download Detailed Log`
  - `🏠 Return to Main Menu`

---

### 3.2 Human-in-the-Loop Flow: Ambiguous Columns & Typos
If a column cannot be matched with high confidence, or if multiple columns could match the same field, the bot intercepts execution and requests human clarification.

* **Scenario**: The Excel file has columns: "Mã", "Họ Tên", "Lương Thưởng", "Trợ Cấp".
  - "Lương Thưởng" could match `base_salary` or `allowances`.
  - "Trợ Cấp" could match `allowances` or `deductions`.
  - The column "Mã" could match `employee_code` or `department_id` (foreign key lookup).
* **Bot**:
```markdown
⚠️ **SCHEMA MAPPING AMBIGUITIES DETECTED**

I couldn't map some columns with high confidence. Please resolve the mapping conflicts below:

1. File Column: **"Lương Thưởng"**
Matches database fields:
```
* **Inline Buttons**:
  - `💵 base_salary` | `🎁 allowances` | `⏭️ Skip Column`

*(User clicks `💵 base_salary`)*
* **Bot**:
```markdown
Mapped **"Lương Thưởng"** ➔ `base_salary` ✅

2. File Column: **"Trợ Cấp"**
Matches database fields:
```
* **Inline Buttons**:
  - `🎁 allowances` | `➖ deductions` | `⏭️ Skip Column`

*(User clicks `🎁 allowances`)*
* **Bot**:
```markdown
Mapped **"Trợ Cấp"** ➔ `allowances` ✅

3. File Column: **"Mã"**
Matches database fields:
```
* **Inline Buttons**:
  - `🏷️ employee_code` | `🏢 department_id` | `⏭️ Skip Column`

*(User clicks `🏷️ employee_code`)*
* **Bot**:
```markdown
Mapped **"Mã"** ➔ `employee_code` ✅

---
All fields mapped. Would you like to view the final mapping summary and proceed?
```
* **Inline Buttons**:
  - `📊 View Summary & Import`
  - `❌ Abort Ingestion`

---

## 4. Edge Cases & Error Handling Strategies
To achieve a "bulletproof" UX, the system must anticipate and cleanly resolve common user errors.

### Case 1: Private or Locked Google Sheets
* **Problem**: The user submits a Google Sheets URL, but it requires authentication, or the service account does not have read permissions.
* **Bot Detection**: Catch `gspread.exceptions.SpreadsheetNotFound` or `gspread.exceptions.APIError`.
* **Bot Action**: Stop the ingestion, log the warning, and display copy-pastable instructions.
* **Fallback Message**:
```markdown
❌ **GOOGLE SHEET IS PRIVATE**

I cannot access the Google Sheet link you provided. This is usually because the sheet's sharing settings restrict access.

🔧 **How to grant access:**
1. Open your Google Sheet in a browser.
2. Click the **Share** button in the top-right corner.
3. Paste the bot's Service Account email and set permission to **Viewer**:
   `superapp-bot@vibecoding-project.iam.gserviceaccount.com`
4. Send the Google Sheets link again.
```

### Case 2: Missing Required Database Columns
* **Problem**: The source file does not contain fields that can be mapped to required database columns (e.g. `employee_code` or `full_name` for the `employees` table).
* **Bot Detection**: Validate mapped columns against schema requirements before proceeding.
* **Bot Action**: Output the missing required columns, list the columns found in the file, and offer a template download.
* **Fallback Message**:
```markdown
❌ **MISSING REQUIRED COLUMNS**

I cannot proceed with importing to the `employees` table because required columns are missing.

• **Missing required fields**:
  - 🔴 `employee_code` (Mã nhân viên)
  - 🔴 `full_name` (Họ và tên)

• **Columns found in your file**:
  - `[Ngày sinh, Lương cứng, Số điện thoại]`

👉 Please add the missing columns to your file and try again. You can download a standard template using the button below.
```
* **Inline Buttons**:
  - `📥 Download Template (.xlsx)`
  - `❌ Cancel Ingestion`

### Case 3: Mixed or Dirty Data Types in Numeric Columns
* **Problem**: A column mapped to a numeric field (e.g. `base_salary`) contains text values like "Thỏa thuận", "N/A", or currency formats with spaces and characters ("15,000,000 VND").
* **Bot Detection**: Pandas parses the column and finds values that fail numeric coercion.
* **Bot Action**: Intercept and offer cleaning strategies via inline options.
* **Fallback Message**:
```markdown
⚠️ **DATA TYPE MISMATCH DETECTED**

In column **"Lương cứng"** (expected numbers), I found invalid values in 3 rows:
- **Row 12**: `'Thỏa thuận'`
- **Row 28**: `'N/A'`
- **Row 35**: `'15.5tr'`

Please choose how you would like me to handle these:
```
* **Inline Buttons**:
  - `0️⃣ Set Invalid to 0` | `⏭️ Skip Affected Rows` | `❌ Cancel Import`

### Case 4: Unsupported File Format or Excessive File Size
* **Problem**: User uploads a file of type `.pdf`, `.zip`, or a spreadsheet larger than 10MB.
* **Bot Detection**: Inspect MIME type, file extension, and `file_size` headers from Telegram's file object before downloading.
* **Bot Action**: Refuse to download/process, displaying constraints.
* **Fallback Message**:
```markdown
❌ **FILE NOT SUPPORTED**

Sorry, I can only process standard tabular files.

- **Allowed Formats**: `.xlsx`, `.xls`, `.csv`
- **Max File Size**: `10 MB`

Your file: `employees_scanned.pdf` (12.4 MB)

👉 Please convert your file to `.xlsx` or `.csv`, ensure it is under 10MB, and upload it again.
```

### Case 5: Database Constraint Violation (Unique Code Conflicts)
* **Problem**: The file contains `employee_code` values that already exist in the database (violating the `UNIQUE(company_id, employee_code)` constraint).
* **Bot Detection**: Attempt a dry-run insert inside a database transaction, catching Postgres unique violation error (`23505`).
* **Bot Action**: Flag the conflict rows and let the user decide whether to overwrite (upsert) or skip them.
* **Fallback Message**:
```markdown
⚠️ **DUPLICATE RECORD CONFLICT**

I found **4 employee codes** in your file that already exist in the database:
- `NV002` (Nguyen Van A)
- `NV005` (Tran Thi B)
- `NV012` (Pham Van C)
- `NV015` (Le Thi D)

How would you like to resolve these conflicts?
```
* **Inline Buttons**:
  - `🔄 Overwrite (Upsert)` | `⏭️ Skip Duplicates` | `❌ Abort Import`

---

## 5. Output & Confidence Verification Report
To guarantee user satisfaction, the bot outputs a structured report after execution. The core features that build confidence are:

1. **Reconciliation Hash Totals**:
   - For numeric columns (like `base_salary`), the bot calculates the sum of all values in the source file and compares it to the sum of the newly inserted/updated rows in the database.
   - For example: `Source File Sum: 120,500,000 VND` vs `DB Written Sum: 120,500,000 VND`. If they match, it verifies that no numeric data was corrupted or lost.
2. **First-N Database Preview**:
   - The bot runs a SELECT query immediately after committing the transaction to fetch the first 3 rows of the newly imported records, outputting them in a Markdown table.
   - This provides immediate visual confirmation that the data is successfully saved and readable.
3. **Transaction Details & Traceability**:
   - Output of a unique Transaction ID, the email of the authenticated operator, and timestamps.
   - Deep link directly to the web application so the user can verify the results in their browser.

---

## 6. Refined Backend Implementation Plan
The backend ingestion pipeline is split into Phase 1 (Core Engine & Schema Mapping) and Phase 2 (Advanced Logic & State Management).

### Phase 1: Core Engine & Basic Parsing
* **Goal**: Build the parsing engines and mapping logic using `pandas`, `openpyxl`, and `gspread`.
* **Sub-modules**:
  1. **Google Sheets Parser (`core/ingestion/gsheets.py`)**:
     - Configures connection to Google Drive API using a Service Account JSON.
     - Reads the Google Sheet into a Pandas DataFrame using `gspread` and `gspread-dataframe`.
  2. **Local File Parser (`core/ingestion/files.py`)**:
     - Downloads Excel/CSV files received via Telegram.
     - Uses `pd.read_excel(..., engine='openpyxl')` for XLSX/XLS and `pd.read_csv(...)` for CSV.
  3. **AI Mapper & Profiler (`core/ingestion/profiler.py`)**:
     - Infers schema types: checks for nulls, infers types (int, float, date, object).
     - Column Matching algorithm: Computes similarity scores between source column names and target schema attributes (using Jaro-Winkler or Levenshtein distance, combined with LLM prompting for low-confidence matches).
     - Validation Runner: Verifies required fields are mapped.

### Phase 2: Session State, Interactive Bot Handlers & Database Transactions
* **Goal**: Implement Telegram interactive dialogs, state management, and robust DB operations.
* **Sub-modules**:
  1. **Ingestion Session Manager (`core/ingestion/session.py`)**:
     - Manages multi-step state per user/chat.
     - Stores temporary DataFrames and mapping state in JSON file cache under `projects/<project_name>/ingest_<session_id>.json` to prevent memory bloat on large files.
  2. **Telegram Handlers (`core/ingestion/handlers.py`)**:
     - Registers callback handlers to process table selection, column mapping choices, cleaning strategy overrides, and import approval.
     - Implements dynamic keyboard updates (e.g. updating the button text to show checked fields).
  3. **Database Execution Engine (`core/ingestion/database.py`)**:
     - Maps the cleaned Pandas DataFrame into JSON payloads.
     - Executes inserts/upserts using Supabase PostgREST bulk requests.
     - Wraps calls to ensure atomic execution (all rows succeed or rollback).
