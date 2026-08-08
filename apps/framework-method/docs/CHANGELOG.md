# Framework Method — Changelog

## 2026-08-07

- Added `PRD-framework-method.md` locking the 4-step flow (Khối → Nhận ra → Đưa khuôn → Bám) and 6 product decisions.
- Documented `fm_*` data model: `fm_blocks` as 5 life domains, `fm_daily_tasks` with carry-over, `fm_block_stats` for all-time insight, `fm_templates`/`fm_template_sections` for Builder, `fm_sessions` for drafts/non-linear flow, `fm_apply_plans`/`fm_track` per-task.
- Noted existing `fm_blocks` (template content) will be renamed/merged to avoid collision with the new life-domain `fm_blocks`.
- Updated `AI-CONTEXT.md` to point to the PRD as the source of truth for flow decisions.

## 2026-08-06

- Initial app scaffold with 9 screens (Dashboard, Overview, Step, Actions, Evening, Calendar, History, Builder).
- Pixel-level redesign to match provided design screenshots.
- Shared auth integration with `@superapp/iam` and shared Supabase client.
- Theme provider with dark/light mode.
- Tailwind design system: Inter font, blue primary, violet accent, rounded-2xl cards.
- Supabase migration for `fm_*` tables with RLS and published-template read policy.
- Registered app in `AppSwitcher` components, `packages/shared-utils/src/app-urls.ts`, and `apps/superapp-business-bot/config/settings.json`.
- Vercel config and README added.
