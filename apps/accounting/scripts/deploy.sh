This is an example

# PROJECT MAP

## 1 SYSTEM OVERVIEW

App name
Cashflow

Purpose
Track personal cash flow.

Core capabilities

- import transactions
- track cash flow
- calculate profit/loss
- visualize portfolio

---

## 2 CORE USER FLOWS

Flow 1
Import transactions

Flow

Import button
→ upload CSV
→ validation
→ database update
→ table refresh

Flow 2
Manual transaction entry

Flow

Add transaction
→ form input
→ validation
→ save to DB
→ update cash flow

---

## 3 DATABASE STRUCTURE

tables

users
transactions
cash_flow
assets

relationships

users
→ transactions

transactions
→ assets

transactions
→ cash_flow

---

## 4 FRONTEND MODULES

pages

dashboard
transactions
assets

components

transaction_table
cash_flow_chart
import_modal

---

## 5 BACKEND MODULES

API

/import
/transactions
/cash_flow

---

## 6 EXTERNAL SERVICES

database
Supabase

deployment
Vercel

repo
GitHub