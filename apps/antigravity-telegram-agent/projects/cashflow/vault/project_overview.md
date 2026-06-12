# Cashflow App - Project Overview

## Project Vision
Xây dựng ứng dụng quản lý dòng tiền (cashflow) và công nợ cho doanh nghiệp SME, với khả năng nhập liệu hàng loạt, phân quyền chi tiết và báo cáo real-time.

## Core Features
- Quản lý khách hàng và giao dịch (customers, transactions)
- Import khách hàng / giao dịch hàng loạt (Excel/CSV)
- Dashboard với metric cards và biểu đồ
- Role-based access control (Admin, Branch Manager, Staff)
- Multi-branch management
- Multi-tenancy với `company_id`
- Cấu hình loại giao dịch động (màu sắc, math factor)

## Technology Stack
- **Frontend:** React 18 + TypeScript + TailwindCSS + Vite
- **Backend:** Supabase (PostgreSQL 15 + Auth + RLS)
- **Charts:** Recharts
- **I18n:** react-i18next (en / vi)
- **Deployment:** Vercel
- **Edge Functions:** Supabase (create-user trigger)

## Architecture Pattern
- Service Layer Pattern (`databaseService` tập trung CRUD)
- Context API cho global state (`AuthContext`, `TransactionTypeContext`)
- Offline fallback: `trialMockStore.ts` + localStorage cho demo mode

## Development Philosophy
- Domain-driven design
- Type-first development (database.types.ts là source of truth)
- Single source of truth cho transaction types (không hardcoded fallback)
- Migrations cho mọi thay đổi schema
