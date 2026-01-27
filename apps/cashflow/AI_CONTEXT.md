# AI Context File - Cashflow App

> **Purpose**: This file helps AI assistants (Claude, GPT, Copilot, etc.) understand the project context quickly. Update this file after significant changes.
> 
> **Last Updated**: 2026-01-27
> **Updated By**: Development Team

---

## 🎯 Project Overview

**Cashflow** is a cash flow management application for businesses to track income, expenses, customer debts, and financial transactions across multiple branches.

### Tech Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Charts**: Recharts
- **i18n**: react-i18next (Vietnamese/English)
- **State**: React hooks + Context API

### Key Directories
```
apps/cashflow/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components (Dashboard, Customers, etc.)
│   ├── services/       # API/Database services
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   └── locales/        # i18n translation files
```

---

## 📋 Current State & Active Work

### Recently Completed
- [x] CashFlowChart component with dynamic time range filters (Day, Week, Month, Quarter, Year)
- [x] Dynamic subtitle based on selected filter
- [x] Data aggregation to prevent duplicate X-axis labels
- [x] Mock data system with separate files (mockData.ts, sampleData.ts)
- [x] Added chart data export functionality (CSV and JSON formats)
- [x] Enhanced tooltip with percentage changes between periods
- [x] Improved responsive display of bank account names in BalanceByBankChart
- [x] Fixed data inconsistency in yearly visualization
- [x] Enhanced sample data to cover multiple time periods
- [x] Dashboard metrics now show all offices (renamed from "branches")
- [x] Renamed "Chi nhánh" to "Văn phòng" throughout the application
- [x] Reordered transaction list table to place transaction date as leftmost column
- [x] Implemented functional "Add New Transaction" button with form modal

### In Progress
- [ ] Refine MetricsCard component for better number formatting
- [ ] Improve data consistency between visualizations and actual transaction data
- [ ] Implement sticky columns in customer list
- [ ] Add debt badge to customer list
- [ ] Implement responsive column hiding for customer list

### Known Issues
- After updating branch/office terminology, you may need to clear localStorage to see changes:
  ```js
  localStorage.removeItem("cashflow_transactions")
  localStorage.removeItem("cashflow_bank_accounts")
  ```

---

## 🏗️ Architecture Decisions

### Data Layer
- **Current**: Mock data services in `services/database.ts`
- **Mock Data**: Separated into `mockData.ts` (static) and `sampleData.ts` (generated)
- **Future**: Will connect to Supabase backend

### Dashboard Metrics Structure
```typescript
databaseService.dashboard.getDashboardMetrics(branchId?, timeRange)
// Returns: { data: DashboardMetrics, error: null }
// Note: branchId is now optional to show all offices
```

### Time Range Filters
| Filter | Data Shown | X-Axis Format |
|--------|-----------|---------------|
| day | Last 30 days | DD/MM |
| week | Last 12 weeks | W1, W2, ... |
| month | Last 12 months | Month name |
| quarter | By quarter | Q1 2024 |
| year | All years | 2024 |

---

## ⚠️ Important Rules & Constraints

### DO
- ✅ Use TypeScript strict mode
- ✅ Follow existing code patterns
- ✅ Use i18n for all user-facing text
- ✅ Keep mock data in separate files for easy management
- ✅ Update this file after significant changes

### DON'T
- ❌ Hardcode Vietnamese text (use i18n)
- ❌ Delete or modify existing translation keys without checking usage
- ❌ Change the databaseService interface without updating all consumers
- ❌ Add new dependencies without documenting in this file

---

## 🔧 Common Tasks

### Starting Development
```bash
cd c:\Vibecoding\superapp-monorepo
npm run dev --workspace=cashflow
# App runs at http://localhost:5180 (or next available port)
```

### Adding New Mock Data
1. Edit `services/mockData.ts` for static data
2. Edit `services/sampleData.ts` for generated data
3. Update `services/database.ts` to use new data

### Adding Translations
1. Add keys to `locales/en/translation.json`
2. Add Vietnamese translations to `locales/vi/translation.json`
3. Use `t("key.path")` in components

---

## 📝 Session Notes

### Session 2026-01-27 (Evening)
**Goal**: Enhance Customer and Transaction UI
**Changes Made**:
- Updated dashboard metrics to show all offices (removed branch filter)
- Renamed "branch" terminology to "office" in UI labels and data
- Reordered transaction list table to place transaction date as leftmost column
- Implemented functional "Add New Transaction" button with form modal

**Features Added**:
1. **All-Office Dashboard View**: Dashboard now shows metrics for all offices instead of filtering by logged-in user's office
2. **Consistent Terminology**: Changed "Chi nhánh" to "Văn phòng" throughout the application
3. **Improved Transaction List**: Transaction date now appears as the leftmost column for better readability
4. **Transaction Creation**: Added complete form modal for creating new transactions with validation

**Next Steps**:
1. Implement sticky columns in customer list
2. Add debt badge to customer list
3. Implement responsive column hiding for customer list

### Session 2026-01-26 (Evening)
**Goal**: Fix data visualization issues and improve bank account display
**Changes Made**:
- Improved responsive display of bank account names in BalanceByBankChart
- Fixed data inconsistency in yearly visualization (limited to 2024 data only)
- Enhanced sample data to cover multiple time periods
- Fixed number formatting in transaction summary
- Ensured real data is used instead of hardcoded values

**Features Added**:
1. **Responsive Bank Account Labels**: Bank account names now display properly with dynamic sizing and truncation based on available space
2. **Accurate Data Visualization**: Yearly view now only shows actual transaction years (2024) instead of fabricated 5-year history
3. **Enhanced Sample Data**: Added more comprehensive sample data with seasonal patterns and year-over-year trends
4. **Improved MetricsCard**: Now uses actual data values instead of pre-formatted strings

**Next Steps**:
1. Further refine MetricsCard component for better number formatting
2. Continue improving data consistency between visualizations and actual transaction data
3. Consider adding more realistic transaction data for better testing

### Session 2026-01-24 (Evening)
**Goal**: Enhance CashFlowChart for testing
**Changes Made**:
- Added data export functionality with CSV and JSON options
- Enhanced tooltip with percentage changes between periods
- Fixed TypeScript type definitions for better code quality
- Added proper null/undefined handling in percentage calculations

**Features Added**:
1. **Chart Data Export**: Users can now export chart data in CSV or JSON format with a dropdown menu
2. **Enhanced Tooltips**: Added percentage change indicators (▲/▼) to show trends between periods
3. **TypeScript Improvements**: Added proper typing for waterfallData and other objects

### Session 2026-01-24 (Morning)
**Goal**: Refine CashFlowChart filters and fix data display
**Changes Made**:
- Created `sampleData.ts` for generating 4 months of sample data
- Created `mockData.ts` for static dashboard mock data
- Updated CashFlowChart to aggregate data by time range
- Added dynamic subtitle based on filter selection
- **FIXED**: `database.ts` export structure - added `dashboardService` object and `databaseService` export

**Fix Applied**:
The issue was that `database.ts` had a standalone function instead of a service object, and was missing the `databaseService` export. Fixed by:
1. Converting `getDashboardMetrics` function to `dashboardService` object
2. Adding `export const databaseService = { dashboard, customers, transactions, bankAccounts, branches }`

---

## 🤝 For New AI Assistants

When starting a new session:
1. **Read this file first** to understand context
2. **Check "Current State"** section for active work
3. **Review "Important Rules"** before making changes
4. **Update "Session Notes"** after significant changes

### Quick Context Prompt
```
I'm working on the Cashflow app in a monorepo. Please read AI_CONTEXT.md 
in apps/cashflow/ for project context before making changes.
```
