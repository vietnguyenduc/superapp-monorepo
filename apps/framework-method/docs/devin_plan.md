# devin_plan — framework-method UI/UX + data polish

## Goal
Make `apps/framework-method` match the provided mockups and the original concept: users choose/mix templates in the builder, run them step-by-step each day, reflect, review/update the same day, and see real metrics on the Dashboard.

## What is already done
- Template → Step → Block nested model persisted to `localStorage`.
- Overview / Steps / Actions / Evening / History / Review flows work.
- Step page now renders every block as an open card with content + reflection input, hint, status, and finalize button.
- Calendar page has day/week/month/quarter views grouped into `framework`, `actions`, `reflections`.
- Builder can create/edit templates, add steps/blocks, set reflection question/placeholder/hint, publish.
- Desktop horizontal nav and mobile bottom nav include Calendar/Builder.
- Default language set to Vietnamese; trial mode works via `?trial_preview=true`.

## Remaining work
1. **Builder mobile/layout polish**
   - Make the template selector, step list, and block editor usable on small screens.
   - Add a clear "Publish / Save as new template" flow and avoid auto-save confusion.
   - Allow reordering templates and mixing templates into a "Daily Mix".
2. **Dashboard metrics from real data**
   - Compute streak from `progress.sessions` dates.
   - Compute 7-day completion trend from `sessions`.
   - List active frameworks with actual progress.
3. **Calendar visual polish**
   - Ensure event dots appear on dates and selected-date detail uses real data.
   - Make day/week/quarter views match mockup spacing.
4. **Overview/Dashboard mockup alignment**
   - Tighten spacing, typography, and button styles per mockups.
   - Keep dark/light mode consistent.
5. **.devinignore + environment blueprint**
   - Add `.devinignore` with build/cache dirs to reduce token waste.
   - Update repo blueprint so future sessions don't need to rediscover env.
6. **Final verification**
   - Run `type-check`, `test`, `build`.
   - Test full flow on local preview.
   - Manual Vercel preview → single PR to `main`.

## Non-goals
- No backend/Supabase persistence yet (localStorage only for trial).
- No new dependencies.
- No PR until local preview is approved.

## Execution order
1. Dashboard metrics (real data).
2. Overview + Dashboard visual alignment.
3. Builder mobile & Daily Mix.
4. Calendar polish.
5. `.devinignore` + blueprint.
6. Build/test + local preview + Vercel preview + PR.

## Branch / commit rule
- Single branch `devin/current-feature`.
- Each file refactor committed with `[skip ci]`.
- One final PR to `main` after Vercel preview approval.
