---
app: hr-operation
doc_type: OVERVIEW
generated: true
---

# hr-operation — Overview

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Purpose

HR & Payroll 3P (Position-Person-Performance): employees, departments, contracts, shifts, attendance, leave, payroll, KPIs.

- **Local port:** 5177
- **Production domain:** `hr.appforyou.xyz`
- **Vercel project:** `hr-operation`

## Tech stack

- React 18 + TypeScript 5.8 + Vite 8
- Tailwind CSS (Apple-inspired design tokens from `@superapp/theme`)
- Supabase cloud (`peslmsctejmvkwzyohke`) via `@superapp/shared-utils` `createApiClient`
- Shared auth / company context from `@superapp/iam`

## Key dependencies

- @repo/types
- @repo/ui
- @supabase/supabase-js
- @superapp/iam
- @superapp/shared-utils
- react
- react-beautiful-dnd
- react-dom
- react-dropzone
- react-i18next
- react-router-dom

## Main pages

- `AttendancePage`
- `EmployeeDirectory`
- `HRSettings`
- `LeaveManagement`
- `Manual/Manual`
- `PayrollManagement`
- `PerformanceDashboard`
- `ShiftManagement`

## Main services

- `hrService`

## Related Supabase tables

- `attendance_logs`
- `branches`
- `companies`
- `departments`
- `employee_kpis`
- `employee_shifts`
- `employees`
- `hr_settings`
- `key_results`
- `kpi_cycles`
- `leave_requests`
- `objectives`
- `payroll_items`
- `payrolls`
- `positions`
- `shifts`
- `users`

## Quick links

- `apps/hr-operation/docs/ARCHITECTURE.md` — structure & routing
- `apps/hr-operation/docs/DATA-MODEL.md` — tables & relationships
- `apps/hr-operation/docs/API.md` — service / API surface
- `apps/hr-operation/docs/AI-CONTEXT.md` — agent gotchas & tasks
- `apps/hr-operation/docs/CHANGELOG.md` — recent changes

