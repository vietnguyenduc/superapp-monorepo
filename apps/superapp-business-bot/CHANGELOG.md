# Changelog — superapp-business-bot

## [Unreleased] — 2026-06-17

### Added
- `/chi` — Quick expense entry (cashflow module)
- `/thu` — Quick income entry (cashflow module)
- `/tạo_đơn` — Quick sales order creation (sales module)
- `/nhập_kho` — Quick inventory inbound (inventory module)
- `/xuất_kho` — Quick inventory outbound (inventory module)
- `/xin_nghỉ` — Quick leave request (HR module)
- `/accounting_report` — Generate accounting report via AI
- `/cashflow_report` — Generate cashflow report via AI
- `/hr_report` — Generate HR/attendance report via AI
- `/sales_report` — Generate sales report via AI
- `/inventory_report` — Generate inventory report via AI
- `/approve_user` — Admin: approve user and assign role
- `/user_list` — Admin: list all registered users
- `/logout` — Clear session and app state
- `/uat_test` — UAT role simulation for admins
- `/sync` — Git fetch + checkout viet + pull --rebase
- `/update` — Now uses branch `viet` with auto-stash and conflict recovery
- Smoke test suite (`tests/smoke_test.py`) with mock Telegram handlers

### Changed
- `/update` command: added auto-stash, conflict handling (rebase -> merge fallback)
- Extracted `_git_sync_viet()` helper for shared git operations

### Fixed
- Report commands referenced in UI but missing handler implementations
- Quick data-entry commands missing (users could see menu but not execute)
