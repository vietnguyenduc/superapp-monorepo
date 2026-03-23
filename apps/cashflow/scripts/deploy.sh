# PROJECT MAP

## 1 SYSTEM OVERVIEW

App name
Portfolio Tracker

Purpose
Track personal investment portfolio.

Core capabilities

- import transactions
- track holdings
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
→ update holdings

---

## 3 DATABASE STRUCTURE

tables

users
transactions
holdings
assets

relationships

users
→ transactions

transactions
→ assets

transactions
→ holdings

---

## 4 FRONTEND MODULES

pages

dashboard
transactions
assets

components

transaction_table
portfolio_chart
import_modal

---

## 5 BACKEND MODULES

API

/import
/transactions
/holdings

---

## 6 EXTERNAL SERVICES

database
Supabase

deployment
Vercel

repo
GitHub