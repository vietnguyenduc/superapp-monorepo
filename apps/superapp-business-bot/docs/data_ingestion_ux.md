# Telegram Business Bot: Data Ingestion UX & Implementation Plan

## 1. Executive Summary

This document specifies the Telegram-native, conversational User Experience (UX) flow and backend architecture for the Data Ingestion feature of the `superapp-business-bot`. 

To maximize operational efficiency and maintain a zero-dependency client footprint, the system relies strictly on Telegram-native components: text-based interactive messages, inline keyboards, and document uploads/downloads. Telegram WebApps/Webviews are explicitly avoided to ensure compatibility across all devices and fast response times.

The backend leverages **Pandas** as the primary data parsing and profiling engine and integrates with **Supabase (PostgREST)** for transactional database operations. The core design incorporates a **Human-in-the-Loop (HITL)** flow to resolve mapping ambiguities, data-type mismatches, and unique constraint conflicts before executing any writes.

---

## 2. Target Database Schemas & Mapping Strategy

The data ingestion feature imports tabular records into the database. Based on the Supabase migrations (`032_hr_payroll_schema.sql`), the target schemas are:

### 2.1 Target Table: `employees`
Stores employee profiles.
*   **`company_id`** (`UUID`, Required): Foreign key referencing `companies(id)`.
*   **`employee_code`** (`VARCHAR(50)`, Required): Natural identifier, unique per company (`UNIQUE(company_id, employee_code)`).
*   **`full_name`** (`VARCHAR(255)`, Required): The employee's full name.
*   **`base_salary`** (`NUMERIC(15, 2)`, Optional, Default: `0`): Base monthly salary.
*   **`status`** (`VARCHAR(50)`, Optional, Default: `'active'`): Operational state.
*   **`join_date`** (`DATE`, Optional): Employee's start date.
*   **`department_id`** (`UUID`, Optional): Foreign key referencing `departments(id)`.
*   **`user_id`** (`UUID`, Optional): Foreign key referencing `users(id)`.

### 2.2 Target Table: `payroll_items`
Stores line-item payroll records linked to a specific payroll run.
*   **`payroll_id`** (`UUID`, Required): Foreign key referencing `payrolls(id)`. Part of composite primary key.
*   **`employee_id`** (`UUID`, Required): Foreign key referencing `employees(id)`. Part of composite primary key.
*   **`base_salary`** (`NUMERIC(15, 2)`, Default: `0`).
*   **`standard_days`** (`NUMERIC(5, 2)`, Default: `0`).
*   **`actual_days`** (`NUMERIC(5, 2)`, Default: `0`).
*   **`ot_hours`** (`NUMERIC(5, 2)`, Default: `0`).
*   **`allowances`** (`NUMERIC(15, 2)`, Default: `0`).
*   **`deductions`** (`NUMERIC(15, 2)`, Default: `0`).
*   **`net_salary`** (`NUMERIC(15, 2)`, Default: `0`).

### 2.3 Ingestion Mapping Architecture
Source files (CSV, XLSX, or Google Sheets) have columns that may not match database column names exactly due to language variations (e.g., Vietnamese vs. English) or custom headers. The mapping engine must:
1.  Verify if columns match perfectly.
2.  Suggest mapping combinations using string similarity (Jaro-Winkler) and semantic matching.
3.  Request manual mapping overrides for ambiguous columns.

---

## 3. Telegram-Native UX Flow

### 3.1 Happy Path: CSV/XLSX Ingestion

This flow documents the interactions for a successful data import into the `employees` table.

#### Step 1: Ingestion Initiation
The user starts the ingestion by sending a `/ingest` command or directly uploading a file.

*   **User Action**: Uploads `salary_may_2026.xlsx` (24.5 KB) containing columns: `"Mã NV"`, `"Họ tên"`, `"Lương cứng"`, `"Ngày vào"`.
*   **Bot Message**:
    ```markdown
    📥 *DATA INGESTION ENGINE*

    I have received your file: `salary_may_2026.xlsx` (24.5 KB).

    Please select the destination table in the database:
    ```
*   **Inline Keyboard**:
    ```
    +------------------------------------+------------------------------------+
    | 👥 Employees (employees)           | 💰 Payroll Items (payroll_items)   |
    +------------------------------------+------------------------------------+
    | 🧾 Invoices (accounting_invoices)  | ❌ Cancel Ingestion                |
    +------------------------------------+------------------------------------+
    ```

#### Step 2: Schema Mapping Preview (AI Suggestion)
The user selects `👥 Employees (employees)`. The bot runs a dry-run profile of the columns using Pandas, matches column names to target columns, and prints the profile.

*   **User Action**: Clicks the `👥 Employees (employees)` button.
*   **Bot Message**:
    ```markdown
    🔍 *DATA PROFILING & SCHEMA MAPPING*

    *File*: `salary_may_2026.xlsx`
    *Target Table*: `employees`
    *Total Records Detected*: `45`

    *Proposed Schema Mapping:*
    • 🏷️ *Mã NV* ➔ `employee_code` (Match: 95%)
    • 👤 *Họ tên* ➔ `full_name` (Match: 98%)
    • 💵 *Lương cứng* ➔ `base_salary` (Match: 92%)
    • 📅 *Ngày vào* ➔ `join_date` (Match: 89%)

    *Data Quality Profile:*
    - `employee_code`: 45 non-null values (100% complete, no duplicates).
    - `full_name`: 45 non-null values (100% complete).
    - `base_salary`: 42 numeric values (3 empty values will default to `0`).
    - `join_date`: 45 valid dates (automatically formatted to `YYYY-MM-DD`).

    Do you approve this mapping and wish to execute the data import?
    ```
*   **Inline Keyboard**:
    ```
    +------------------------------------+------------------------------------+
    | ✅ Approve & Import                | ⚙️ Adjust Mapping                  |
    +------------------------------------+------------------------------------+
    | ❌ Cancel Ingestion                |                                    |
    +-------------------------------------------------------------------------+
    ```

#### Step 3: Execution & Confirmation Report
The user approves the mapping. The bot processes the transaction and returns a confirmation.

*   **User Action**: Clicks the `✅ Approve & Import` button.
*   **Bot Message** *(Displays a typing indicator for ~1.5s while executing database operations)*:
    ```markdown
    🎉 *DATA IMPORT SUCCESSFUL!*

    The data has been verified and written to the database.

    📊 *Execution Summary:*
    - *Destination Table*: `employees`
    - *Operation*: `UPSERT` (Insert new, update existing)
    - *Rows Processed*: `45`
    - *Successfully Inserted*: `42`
    - *Successfully Updated*: `3`
    - *Errors / Skipped*: `0`
    - *Reconciliation Sum*: `584,200,000 VND` (Total base_salary)

    🔍 *Database Sample (First 3 rows stored):*
    | Code | Name | Salary (VND) | Join Date |
    | :--- | :--- | :--- | :--- |
    | NV001 | Nguyen Van A | 15,000,000 | 2024-01-10 |
    | NV002 | Tran Thi B | 18,000,000 | 2023-05-15 |
    | NV003 | Le Van C | 12,000,000 | 2025-02-01 |

    🔗 *Audit Details:*
    - *Operator*: `trial_+84849698333@superapp.com`
    - *Timestamp*: `2026-06-14 03:22:45 UTC`
    - *Transaction ID*: `tx_8f9c2d1b`

    [View Live Records on Web Portal](https://vibecoding-cashflow-hr.vercel.app/employees)
    ```
*   **Inline Keyboard**:
    ```
    +------------------------------------+------------------------------------+
    | 📄 Download Detailed Log           | 🏠 Return to Main Menu             |
    +------------------------------------+------------------------------------+
    ```

---

### 3.2 Human-in-the-Loop Flow: Ambiguous Columns & Typos

When a column cannot be matched with high confidence, or multiple source columns map to the same database field, the bot interrupts execution and requests clarification.

*   **Scenario**: The user uploads an Excel file with columns: `"Mã"`, `"Họ Tên"`, `"Lương Thưởng"`, `"Trợ Cấp"`.
    - `"Lương Thưởng"` could map to `base_salary` or `allowances`.
    - `"Trợ Cấp"` could map to `allowances` or `deductions`.
    - `"Mã"` could map to `employee_code` or `department_id`.
*   **Bot Message**:
    ```markdown
    ⚠️ *SCHEMA MAPPING AMBIGUITIES DETECTED*

    I couldn't map some columns with high confidence. Please resolve the mapping conflicts below:

    1️⃣ File Column: *"Lương Thưởng"*
    Matches multiple target fields. Select correct mapping:
    ```
*   **Inline Keyboard**:
    ```
    +------------------+------------------+------------------+
    | 💵 base_salary   | 🎁 allowances    | ⏭️ Skip Column   |
    +------------------+------------------+------------------+
    ```

*   **User Action**: Clicks `💵 base_salary`.
*   **Bot Message** *(Updates the active message)*:
    ```markdown
    Mapped *"Lương Thưởng"* ➔ `base_salary` ✅

    2️⃣ File Column: *"Trợ Cấp"*
    Matches multiple target fields. Select correct mapping:
    ```
*   **Inline Keyboard**:
    ```
    +------------------+------------------+------------------+
    | 🎁 allowances    | ➖ deductions    | ⏭️ Skip Column   |
    +------------------+------------------+------------------+
    ```

*   **User Action**: Clicks `🎁 allowances`.
*   **Bot Message** *(Updates the active message)*:
    ```markdown
    Mapped *"Trợ Cấp"* ➔ `allowances` ✅

    3️⃣ File Column: *"Mã"*
    Matches multiple target fields. Select correct mapping:
    ```
*   **Inline Keyboard**:
    ```
    +------------------+------------------+------------------+
    | 🏷️ employee_code | 🏢 department_id | ⏭️ Skip Column   |
    +------------------+------------------+------------------+
    ```

*   **User Action**: Clicks `🏷️ employee_code`.
*   **Bot Message** *(Updates the active message to show resolution summary)*:
    ```markdown
    Mapped *"Mã"* ➔ `employee_code` ✅

    ---
    All fields have been successfully mapped!

    Would you like to view the final mapping summary and proceed?
    ```
*   **Inline Keyboard**:
    ```
    +------------------------------------+------------------------------------+
    | 📊 View Summary & Import           | ❌ Abort Ingestion                 |
    +------------------------------------+------------------------------------+
    ```

---

## 4. Edge Cases & Error Handling Strategies

### Case 1: Private or Locked Google Sheets
*   **Scenario**: The user submits a Google Sheets URL, but the bot's Service Account lacks read permissions (e.g. sheet not shared or enterprise sharing rules restrict external access).
*   **Error Detection**: Catch `gspread.exceptions.SpreadsheetNotFound` or `gspread.exceptions.APIError`.
*   **Bot Response**:
    ```markdown
    ❌ *GOOGLE SHEET IS PRIVATE / INACCESSIBLE*

    I cannot read the Google Sheet you provided. Please ensure it is shared correctly.

    🔧 *How to fix this:*
    1. Open your Google Sheet in a browser.
    2. Click the *Share* button in the top-right corner.
    3. Add the bot's Service Account email as a *Viewer*:
       `superapp-bot@vibecoding-project.iam.gserviceaccount.com`
    4. Send the Google Sheets link again.

    💡 *Note*: If your organization restricts external sharing, please export the sheet as a `.xlsx` or `.csv` file and upload it directly here.
    ```
    *(Note: The service account email is wrapped in a monospace code block, allowing users to copy it with a single tap on mobile devices.)*

### Case 2: Missing Required Database Columns
*   **Scenario**: The source file is missing required columns (e.g. `employee_code` or `full_name` for `employees`).
*   **Error Detection**: Pre-flight mapping checks fail to locate matches for required non-nullable fields.
*   **Bot Response**:
    ```markdown
    ❌ *MISSING REQUIRED COLUMNS*

    I cannot import data into the `employees` table because key required columns are missing from the source file.

    • *Missing Required Fields:*
      - 🔴 `employee_code` (Mã nhân viên)
      - 🔴 `full_name` (Họ và tên)

    • *Columns found in your file:*
      - `[Ngày sinh, Lương cứng, Số điện thoại]`

    👉 Please add the missing columns to your file and try again. You can download a standard template using the button below.
    ```
*   **Inline Keyboard**:
    ```
    +------------------------------------+------------------------------------+
    | 📥 Download Template (.xlsx)       | ❌ Cancel Ingestion                |
    +------------------------------------+------------------------------------+
    ```

### Case 3: Mixed or Dirty Data Types in Numeric Columns
*   **Scenario**: A column mapped to a numeric field (e.g., `base_salary`) contains text like `"Thỏa thuận"`, `"N/A"`, or complex currency formatting like `"15.5tr"`.
*   **Error Detection**: Pandas parsing identifies non-coercible values in columns mapped to numeric DB types.
*   **Bot Response**:
    ```markdown
    ⚠️ *DATA TYPE MISMATCH DETECTED*

    In column *"Lương cứng"*, I found invalid non-numeric values in 3 rows:
    - *Row 12*: `'Thỏa thuận'`
    - *Row 28*: `'N/A'`
    - *Row 35*: `'15.5tr'`

    How should these values be handled?
    ```
*   **Inline Keyboard**:
    ```
    +--------------------+--------------------+--------------------+
    | 0️⃣ Set Invalid to 0| ⏭️ Skip Affected Rows| ❌ Cancel Import   |
    +--------------------+--------------------+--------------------+
    ```

### Case 4: Unsupported File Format or Excessive File Size
*   **Scenario**: The user uploads a file with an unsupported extension (e.g., `.pdf`, `.zip`) or a file exceeding the size limit of 10MB.
*   **Error Detection**: Check the MIME type, file extension, and `file_size` parameter from Telegram's message object.
*   **Bot Response**:
    ```markdown
    ❌ *FILE TYPE OR SIZE NOT SUPPORTED*

    I can only process tabular files within standard boundaries.

    - *Supported Formats*: `.xlsx`, `.xls`, `.csv`
    - *Maximum File Size*: `10 MB`

    Your file: `employees_scanned.pdf` (12.4 MB)

    👉 Please convert your document to a supported format, verify it is under 10MB, and upload it again.
    ```

### Case 5: Database Constraint Violation (Unique Code Conflicts)
*   **Scenario**: The import contains `employee_code` values that already exist in the database for the active company.
*   **Error Detection**: Execute a dry-run insert inside a database transaction, catching Postgres unique violation error (`23505`).
*   **Bot Response**:
    ```markdown
    ⚠️ *DUPLICATE RECORD CONFLICT*

    I found *4 employee codes* in your file that already exist in the database:
    - `NV002` (Nguyen Van A)
    - `NV005` (Tran Thi B)
    - `NV012` (Pham Van C)
    - `NV015` (Le Thi D)

    How would you like to resolve these conflicts?
    ```
*   **Inline Keyboard**:
    ```
    +------------------------------------+------------------------------------+
    | 🔄 Overwrite (Upsert)              | ⏭️ Skip Duplicates                 |
    +------------------------------------+------------------------------------+
    | ❌ Abort Import                    |                                    |
    +-------------------------------------------------------------------------+
    ```

---

## 5. Output & Confidence Verification Report

To provide assurance to the operator, the bot outputs a validation report containing three primary components:

### 5.1 Reconciliation Hash Totals
The system calculates the arithmetic sum of numeric fields (e.g., `base_salary` or `allowances`) in the source file and compares it directly with the sum of the rows successfully written to the database.
*   **Example Output**:
    `Reconciliation Sum: 584,200,000 VND (Source File) vs 584,200,000 VND (Database) - MATCH ✅`

### 5.2 First-N Database Preview
A Markdown table preview displaying the first 3 rows of the newly imported data, fetched via a separate SELECT query immediately after committing the transaction. This verifies that the database write succeeded and that the data is not corrupted.

### 5.3 Traceability & Audit Metadata
Each import registers:
-   An audit timestamp (UTC).
-   The email address of the active operator.
-   A unique transaction reference ID (`tx_xxxxxxxx`).
-   A link directly navigating to the correct workspace view on the web portal.

---

## 6. Refined Backend Implementation Plan

The backend architecture is structured to support stateful multi-step interactions over a stateless bot framework.

### 6.1 State Management & Session Lifecycle
To avoid memory exhaustion and eliminate the risk of session loss in stateless, serverless, or load-balanced environments, the bot persists active session states in a Postgres-backed table (`temp_ingestion_sessions`) or a Redis cache with a 30-minute TTL, rather than local files.
*   **Storage Location**: Database table (`temp_ingestion_sessions`) or Redis key-value storage (`ingest:<session_id>`).
*   **Lifecycle**:
    1.  *Created* when a file is uploaded.
    2.  *Updated* with column mappings, cleaning strategies, and validation states.
    3.  *Deleted* upon completion, cancellation, or session timeout (30-minute TTL).

```
[User File Upload] ---> [Create Session Table/Redis]
                              |
                              v
                   [Map Schema & Validate] <---+
                              |                | (HITL Ambiguity Loop)
                              v                |
                   [Wait for User Selection] --+
                              |
                              v
                   [PostgREST Bulk Transaction]
                              |
                              v
                  [Delete Session Table/Redis & Exit]
```

### 6.2 Phase 1: Core Engine & Basic Parsing (Sub-modules)

#### 1. File Parser (`core/ingestion/files.py`)
Downloads files via the Telegram Bot API and loads them into a Pandas DataFrame.
*   Runs CPU-bound parser methods inside a separate thread using `asyncio.to_thread` to prevent blocking the single-threaded asyncio event loop.
*   Uses `pd.read_excel(..., engine='openpyxl')` for spreadsheet parsing.
*   Uses `pd.read_csv(...)` for CSV files.
*   Enforces file size validations prior to downloading.

#### 2. Google Sheets Parser (`core/ingestion/gsheets.py`)
Fetches data from Google Sheets links.
*   Uses `gspread` and `gspread-dataframe` to load the sheet into a Pandas DataFrame.
*   Wraps connection attempts in `try/except` blocks to handle permission errors.

#### 3. AI Mapper & Profiler (`core/ingestion/profiler.py`)
Profiles columns and suggests schema mappings.
*   Runs similarity calculations and data profiling inside a separate thread using `asyncio.to_thread` to prevent event loop blocking.
*   Calculates string similarity scores (Jaro-Winkler) for headers.
*   Determines data-types and tracks missing values.
*   Verifies required target columns (`employee_code`, `full_name`) are present.

### 6.3 Phase 2: Telegram Bot Integration & PostgREST Transactions (Sub-modules)

#### 1. Ingestion Session Manager (`core/ingestion/session.py`)
*   Handles loading, updating, and clearing session states stored in Redis or the database (`temp_ingestion_sessions`).
*   Executes automated TTL eviction/cleanup (30-minute TTL) for expired sessions.

#### 2. Telegram Bot Handlers (`core/ingestion/handlers.py`)
*   Implements message handlers for files and URL inputs.
*   Registers callback query handlers for table selection, manual column mapping, duplicate resolution, and execution confirmation.
*   Uses message editing (`edit_message_text`) to update user options dynamically.

#### 3. Database Execution Engine (`core/ingestion/database.py`)
*   Converts clean Pandas DataFrames into JSON bulk payloads.
*   Invokes the custom PostgreSQL RPC function `check_ingest_constraints(payload jsonb)` to perform transaction-safe dry-run constraint checks (e.g. unique constraints like `23505`) and rolls back via exceptions/savepoints.
*   Performs database writes via Supabase REST endpoints.
*   Utilizes the `Prefer: resolution=merge-duplicates` header for upsert operations.

---

## 7. Architectural Challenges & Production Mitigations

During review and stress-testing, four primary architectural risks were identified. The following mitigations are built into the production system design:

### 7.1 Stateless Session Storage Risk
*   **Challenge**: Storing session data in local files (`projects/<project_name>/ingest_<session_id>.json`) assumes a stateful server. In stateless environments (e.g., Supabase Edge Functions or load-balanced VPS groups), sequential requests from the same user session may hit different instances, resulting in silent import failures or lost sessions.
*   **Mitigation**: Move state persistence to a Postgres-backed table (`temp_ingestion_sessions`) or a centralized Redis cache with a 30-minute Time-To-Live (TTL). The session manager loads state based on the session ID regardless of which server instance receives the request.

### 7.2 PostgREST Dry-Run Limitations
*   **Challenge**: PostgREST uses stateless HTTP transactions, meaning a client cannot run standard stateful database transactions (e.g., `BEGIN`, run validations, then `ROLLBACK`) across multiple HTTP requests to verify constraints before committing.
*   **Mitigation**: Implement a custom PostgreSQL RPC function `check_ingest_constraints(payload jsonb)` that performs validations inside an isolated database savepoint/exception block. It checks for constraints (such as unique key violations - `23505`), collects conflict details, and then rolls back the operations to prevent dirty writes while returning detailed validation feedback.

### 7.3 Synchronous Event Loop Blocking
*   **Challenge**: Running CPU-heavy parsing (via Pandas), string similarity matching (Jaro-Winkler), and data regex cleaning directly within standard single-threaded Telegram callback handler loops causes event loop blockages of 10–15 seconds for large files (e.g., a 10MB CSV with 100k rows). This blocks all other bot interactions, creating a denial of service (DoS) for all users.
*   **Mitigation**: Offload all CPU-bound operations in the file parser (`core/ingestion/files.py`) and AI profiler (`core/ingestion/profiler.py`) to worker threads using Python's `asyncio.to_thread` (or `loop.run_in_executor`), ensuring the main asyncio event loop remains fully responsive.

### 7.4 Enterprise Google Drive Sharing Restrictions
*   **Challenge**: Corporate Workspace accounts with strict external sharing policies reject adding the bot's service account (`superapp-bot@vibecoding-project.iam.gserviceaccount.com`), blocking users from importing data directly via Google Sheets links.
*   **Mitigation**: Enhance Case 1's error message with an explicit fallback prompt instructing the user to export the sheet as a `.xlsx` or `.csv` file and upload it directly.

---

## 8. Verification and Testing Strategy

To ensure correctness and prevent regressions, the ingestion engine is verified using three testing tiers:

1.  **Unit Tests (`tests/ingestion/test_parsers.py`)**:
    *   Verify CSV, XLSX, and Google Sheets parsing logic.
    *   Validate column matching algorithms and similarity scoring.
    *   Verify file size constraints and type validation.
2.  **Integration Tests (`tests/ingestion/test_db_transactions.py`)**:
    *   Test bulk inserts and upserts to a mock Supabase database schema.
    *   Verify duplicate key conflict handling and Postgres constraint checks.
    *   Confirm reconciliation hash calculations are mathematically exact.
3.  **UI/UX Dry Runs (`tests/ingestion/test_bot_flows.py`)**:
    *   Mock Telegram's `Message` and `CallbackQuery` objects.
    *   Validate the state-machine transitions across all happy paths and the 5 critical edge cases.
