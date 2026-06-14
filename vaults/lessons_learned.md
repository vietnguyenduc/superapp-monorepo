﻿# Lessons Learned

This file serves as the active knowledge repository for the Core Governance AI Engine. It records engineering heuristics, user preferences, and repeating bugs.

---

## 📜 HIẾN PHÁP DỰ ÁN (Tôn Chỉ Cao Nhất — 2026-06-13)

> Chi tiết đầy đủ tại `.agent/memory/CONSTITUTION.md`

**Nguyên Tắc I — Xây Đúng Hơn Sửa Đúng:**
- Build right > Fix right. Nền móng sai → sửa cái này hỏng cái kia.
- Simplicity wins — đơn giản nhất giải quyết được = tốt nhất.
- Sustainability > cleverness — code phải dễ hiểu 6 tháng sau.
- Pragmatic, not perfectionist — ship được, đo được, rồi refine.
- NEVER patch a wrong foundation. NEVER thêm complexity vào complexity.

**Nguyên Tắc II — Testing Là Nghệ Thuật & Điểm Mạnh Nhất:**
- Test 5 chiều bắt buộc: Spec → Flow → UI/UX → Function → Data
- Phối hợp agentic: Agent điều phối + `/browser` + `/teamwork` + plan rõ ràng
- Evidence-based: screenshot, console log, query result — không test bằng đọc code
- Feature chưa test đủ UI + Function + Data = CHƯA XONG

---

## Daily Learnings
- **[2026-06-04]**: Initialized Global Vault for knowledge extraction and cross-context registry.
- **[2026-06-13]**: Implemented Hierarchical Context Compression (HCC) — `/compress` + `/session` commands cho cả 2 Telegram bots để chống context overflow.
- **[2026-06-13]**: Nhúng Hiến Pháp Dự Án vào tất cả điểm chạm: SDK (`.agent/`), Telegram Agent, Business Bot, Global Vault.

## Future Prompt Handling Adjustments
- Enforce 3-tier pipeline validation for every prompt.
- Cross-reference global registry for contextual completeness.

## Daily Learnings
- **[2026-06-14]**: RLS Infinite Recursion Fix — All policies ON `public.users` that self-reference `FROM public.users` cause infinite recursion. Fix by using `auth.jwt() -> 'user_metadata' ->> 'role'` instead. Applied to migrations 002, 005, 008, 030.
- **[2026-06-14]**: Telegram Bot ReadTimeout & 502 Errors — Transient network issues cause polling crashes. Auto-recovery via `infinity_polling()` works but has ~30s gap. Recommend increasing timeout to 45s.
- **[2026-06-14]**: Gemini API Free Tier Quota (20 req/day) — After exhaustion, `run_visual_audit` and memory vault fail silently. Need quota-aware routing or paid tier upgrade.
- **[2026-06-15]**: Telegram Bot 409 Conflict Error — 75 occurrences in last 1000 log lines. Caused by multiple bot instances polling the same token simultaneously. Root cause: zombie processes from previous bot restarts not properly killed. Fix: always kill ALL Python processes before restarting, or use a PID lock file.
- **[2026-06-15]**: Playwright Screenshot Testing Framework — Successfully built multi-agent framework with 5 scripts (port_manager, scan_routes, generate_test_script, batch_runner, analyze_results). Key lesson: always use `.mjs` files instead of inline `-e` to avoid PowerShell escaping issues. Batch runner can test 6 apps sequentially with port management.
- **[2026-06-15]**: Responsive UI/UX Fix Pattern — For iPad (768px) responsive issues: (1) Sidebar width: `w-60 lg:w-64 xl:w-72` instead of fixed `w-80`, (2) Cards grid: `grid-cols-2 md:grid-cols-4`, (3) Table: hide secondary columns on mobile + horizontal scroll, (4) Navigation: hide text on `sm:` breakpoint, show only icons.
