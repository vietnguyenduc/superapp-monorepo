# AI Context File - Cashflow App

> **Purpose**: This file helps AI assistants (Claude, GPT, Copilot, etc.) understand the project context quickly. Update this file after significant changes.
> 
> **Last Updated**: 2026-02-07
> **Updated By**: Development Team

---

## 🚨 **CRITICAL RULES FOR AI ASSISTANTS**

### File Operations - READ BEFORE EDITING
**⚠️ NEVER use `write_to_file` for existing files!**

1. **ALWAYS Read First**: Before editing any file, use `read_file` to understand current content
2. **Use Edit Tools**: For existing files, use `edit` or `multi_edit` - NEVER `write_to_file`
3. **Check File Existence**: If unsure if file exists, use `find_by_name` or `list_dir` first
4. **Context Matters**: Read surrounding code to understand context before making changes

### Common Mistakes to Avoid:
- ❌ Creating new files when they already exist
- ❌ Using `write_to_file` on existing files (corrupts them)
- ❌ Making edits without reading the current content
- ❌ Assuming file structure without verification

### Correct Workflow:
1. `read_file` → Understand current state
2. `edit`/`multi_edit` → Make targeted changes
3. Verify with `read_file` if needed

---

## 🎯 Project Overview

**Cashflow** is a cash flow management application for businesses to track income, expenses, customer debts, and financial transactions across multiple branches.

### Tech Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Charts**: Recharts (waterfall chart for cash flow visualization)
- **i18n**: react-i18next (Vietnamese/English)
- **State**: React hooks + Context API
- **Data Storage**: localStorage (temporary, will migrate to Supabase)

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
- [x] **Mobile-First Design**: Complete mobile optimization for all components
- [x] **Dark Mode Implementation**: Full dark mode support with toggle in settings
- [x] **Customer Table Redesign**: Moved GD button to bottom, improved mobile layout
- [x] **TopCustomers Cards**: Restructured to prevent overflow, better mobile spacing
- [x] **Balance Chart Improvements**: Removed Y-axis title, improved data labels
- [x] **Settings Menu Mobile Fix**: Horizontal scroll tabs, responsive layout
- [x] **Language Consistency**: Fixed English text to Vietnamese throughout app
- [x] **CSS Loading Issues**: Resolved 500 errors, restarted dev server properly
- [x] CashFlowChart component with dynamic time range filters (Day, Week, Month, Quarter, Year)
- [x] Dynamic subtitle based on selected filter
- [x] Data aggregation to prevent duplicate X-axis labels
- [x] **Responsive Chart Balance**: Fixed mobile/desktop balance for bank account chart
- [x] **Realistic Mock Data**: Enhanced sampleData.ts with realistic ups and downs between periods
- [x] **Dark Mode Full Implementation**: Added dark mode to Dashboard, CustomerList, TransactionList, Reports pages
- [x] **Customer Page Layout Fix**: Fixed weird desktop layout from aggressive mobile optimization
- [x] **File Operation Process Fix**: Added critical rules to prevent file corruption mistakes
- [x] **Enhanced Theme System**: Comprehensive theme overhaul with unified coding patterns
- [x] **Mobile Spacing Improvements**: Better spacing and alignments in TopCustomers mobile layout
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
- [x] Improved number formatting with flexible M/B suffixes (1.1B instead of 1001.2M)
- [x] Added thousand separators for all numbers in UI
- [x] Right-aligned comparison numbers in metrics cards
- [x] Optimized CashFlowChart styling in no-balance mode
- [x] Improved connector lines with dotted style and thinner stroke
- [x] Enhanced Y-axis scaling for better delta visualization
- [x] Normalized branch names consistently across all components
- [x] **CRITICAL: Settings Functionality Restoration**: Restored complete Settings page with all original features
- [x] **Complete Dark Mode Fix**: Fixed all dark mode issues including component classes and business colors
- [x] **File Safety System**: Implemented comprehensive file operation safety rules and memory system

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

### Branch Strategy (NEW)
- **Personal Branch**: Work in personal branch "viet" instead of directly to origin/main
- **Workflow**: Commit to "viet" branch → merge to origin/main later
- **Collaboration**: Each team member has their own personal branch

### DO
- ✅ Use TypeScript strict mode
- ✅ Follow existing code patterns
- ✅ Use i18n for all user-facing text
- ✅ Keep mock data in separate files for easy management
- ✅ Update this file after significant changes
- ✅ Work in personal branch "viet" before merging to main
- ✅ Test mobile responsiveness for all changes
- ✅ Ensure dark mode compatibility

### DON'T
- ❌ Hardcode Vietnamese text (use i18n)
- ❌ Delete or modify existing translation keys without checking usage
- ❌ Change the databaseService interface without updating all consumers
- ❌ Add new dependencies without documenting in this file
- ❌ Commit directly to origin/main
- ❌ Ignore mobile responsiveness
- ❌ Break dark mode functionality

---

## 🔧 Common Tasks

### Starting Development
```bash
cd c:\Vibecoding\superapp-monorepo
npm run dev --workspace=cashflow
# App runs at http://localhost:5174 (or next available port)
```

### Branch Workflow
```bash
git checkout viet
# Make changes
git add .
git commit -m "description"
git push origin viet
# Later: merge to main via PR or merge command
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

## � Common Issues & Solutions

### Cascade Tool Issues
- **Empty Code Changes**: When Cascade can't generate non-empty changes, check if the file exists and the exact text matches
- **File Already Exists**: When trying to create files that exist (like postcss.config.cjs), use edit tool instead
- **CSS Loading Errors**: If CSS files return 500 errors, restart dev server after killing all node processes

### Development Server Issues
- **Port Conflicts**: Kill all node processes with `taskkill /F /IM node.exe` then restart
- **CSS 500 Errors**: Clear browser cache, hard refresh (Ctrl+F5), or restart dev server
- **Wrong Port**: Check vite.config.ts for correct port (currently 5174)

### Mobile Development
- **Always Test**: Check mobile view in browser dev tools for all changes
- **Dark Mode**: Ensure all components work in both light and dark modes
- **Touch Targets**: Minimum 44px for mobile touch targets

---

## �� Session Notes

### Session 2026-02-07 (Afternoon)
**Goal**: Dark mode cleanup, dashboard UI polish, settings actions, and language consistency
**Changes Made**:
- Fixed remaining dark mode white blocks across import, customer, dashboard, and settings UI
- Increased chart contrast for CashFlowChart and BalanceByBankChart
- Improved RecentTransactions layout (date emphasis, mobile alignment, spacing, and icons)
- Implemented edit/delete for branches (offices) in Settings
- Corrected branch percentage calculation to use total portfolio
- Adjusted MetricsCard gradients/borders in dark mode
- Added missing i18n key for customer import title
- Widened sidebar + increased icon/text sizes and add button sizing/visibility

**Lessons Learned / Guidance**:
1. **Sidebar width sync**: Keep Layout sidebar container widths in sync with Sidebar width to avoid clipped add buttons.
2. **Dark mode audits**: Scan all cards, tables, and modals for `bg-white` without `dark:` equivalents.
3. **i18n gaps**: Missing translation keys show raw strings; add new keys to both `vi.json` and `en.json`.
4. **Branch % logic**: Use totals across all offices when showing portfolio share (not per-office totals).

**Next Steps**:
1. Continue checking for untranslated strings in Vietnamese mode
2. Review duplicate translation keys in `vi.json`/`en.json`

### Session 2026-02-05 (Morning)
**Goal**: Mobile Optimization and Dark Mode Implementation
**Changes Made**:
- Complete mobile-first redesign of all components
- Implemented full dark mode with system-wide CSS variables
- Fixed customer table layout issues
- Resolved CSS loading errors
- Fixed language inconsistencies

**Features Added**:
1. **Mobile-First Design**: All components now responsive with proper mobile layouts
2. **Dark Mode**: Complete dark mode implementation with toggle in settings
3. **Customer Table Redesign**: Moved action buttons to bottom, improved mobile spacing
4. **TopCustomers Cards**: Restructured to prevent overflow, better mobile hierarchy
5. **Balance Chart Improvements**: Removed Y-axis title, improved data label readability
6. **Settings Mobile Fix**: Horizontal scroll tabs, responsive sections
7. **Language Consistency**: Fixed English text to Vietnamese throughout app

**Technical Details**:
1. **Dark Mode Implementation**:
   - Added `dark:` classes throughout all components
   - Implemented CSS custom properties for dark theme
   - Added localStorage persistence for theme preference
   - Enhanced scrollbar styling for dark mode
2. **Mobile Optimizations**:
   - Responsive column visibility in tables
   - Larger touch targets and better spacing
   - Improved text sizing and contrast
   - Better button layouts for mobile screens
3. **Layout Improvements**:
   - Customer table: moved GD button to bottom with vertical layout
   - TopCustomers: card-based layout with debt amounts at bottom
   - Settings: horizontal scroll tabs with mobile-friendly labels

**Common Issues Encountered**:
1. **CSS Loading Errors**: 500 errors resolved by restarting dev server
2. **Cascade Tool Issues**: Empty changes when files don't exist or text doesn't match exactly
3. **Language Inconsistencies**: Fixed English text in navigation and tooltips

**Next Steps**:
1. Continue testing mobile responsiveness across all pages
2. Further optimize dark mode contrast ratios
3. Implement remaining accessibility improvements

### Session 2026-01-28 (Evening)
**Goal**: Refine CashFlowChart styling and normalize branch names
**Changes Made**:
- Enhanced CashFlowChart styling in no-balance mode
- Improved connector lines with dotted style and thinner stroke
- Fixed Y-axis scaling to better visualize transaction deltas
- Normalized branch names consistently across all components

**Features Added**:
1. **Optimized No-Balance Mode**: Adjusted bar sizing and spacing for better readability when balance bars are hidden
2. **Improved Connector Styling**: Changed connector lines to dotted style with 1px stroke width
3. **Enhanced Y-Axis Scaling**: Offset base and running totals to zoom Y-axis into deltas without altering outstanding balance values
4. **Consistent Branch Naming**: Updated all components to dynamically load branch names from database service and normalize them (replacing "Chi nhánh" with "Văn phòng")

**Technical Details**:
1. **CashFlowChart.tsx**:
   - Dynamic bar sizing based on data count
   - Preserved connector lines in no-balance mode
   - Offset Y-axis scaling for better visualization
   - Maintained actual outstanding balance values while improving visual display
2. **TransactionList.tsx & RecentTransactions.tsx**:
   - Replaced hardcoded branch maps with dynamic loading from database service
   - Added normalization logic to ensure consistent naming
   - Preserved fallback to default map for backward compatibility

**Next Steps**:
1. Further optimize CashFlowChart performance with large datasets
2. Continue improving data consistency between visualizations

### Session 2026-01-27 (Evening - Update 2)
**Goal**: Improve Number Formatting and UI Alignment
**Changes Made**:
- Enhanced number formatting utilities with flexible M/B suffixes
- Added thousand separators for all numbers in UI
- Right-aligned comparison numbers in metrics cards

**Features Added**:
1. **Smart Number Formatting**: Numbers now display with appropriate K/M/B suffixes based on magnitude (1.1B instead of 1001.2M)
2. **Consistent Thousand Separators**: All numbers now display with thousand separators for better readability
3. **Improved UI Alignment**: Comparison numbers in metrics cards are now right-aligned for better visual hierarchy

**Next Steps**:
1. Implement sticky columns in customer list
2. Add debt badge to customer list
3. Implement responsive column hiding for customer list

### Session 2026-01-27 (Evening - Update 1)
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
5. **Always test mobile responsiveness** for all changes
6. **Work in "viet" branch** before merging to main

### Quick Context Prompt
```
I'm working on the Cashflow app in a monorepo. Please read AI_CONTEXT.md 
in apps/cashflow/ for project context before making changes.
I'm working in the "viet" branch and need to ensure mobile responsiveness
and dark mode compatibility for all changes.
```
