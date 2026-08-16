---
app: cashflow
doc_type: UI-UX
generated: true
---

# cashflow — UI/UX Guide

> **Auto-generated skeleton.** Edit this file when the app changes; run `python3 tools/doc-audit/generate_app_docs.py` to regenerate missing files.


## Design system

- Apple-inspired: clean cards, generous spacing, subtle shadows, rounded corners.
- Dark mode supported via Tailwind `dark:` variants and `@superapp/theme` tokens.
- Vietnamese-first labels; keep action buttons short and explicit.

## Common patterns

- **Primary action:** high-contrast button (`bg-blue-600`, `text-white`).
- **Secondary action:** outlined button (`border-gray-300`, `bg-white`).
- **Danger:** red text / border.
- **Tables:** `@repo/ui` `DataTable` with mobile card view + desktop table view.
- **Forms:** labels above fields, inline validation, disabled submit until valid.
- **Feedback:** toast notifications, inline `ErrorBoundary`, no raw `alert()` in production code.

## Responsive rules

- Stack filters vertically on mobile.
- Keep modals within viewport; verify `z-index` against top navigation.
- Test at 390×844 and 768×1024 viewports.

## Table UX rule

Whenever a page shows a data table, the user must be able to scroll through rows while still seeing:
1. **The search/filter bar** — compact and reachable (can be a single input or a collapsed chip bar; keep it sticky at the top).
2. **The table header** — frozen/sticky so columns remain identifiable.

Implementation pattern:
- Wrap the table in a container with `overflow-auto` and `max-h-[calc(100vh - <offset>)]`.
- Add `sticky top-0` to every `<th>`; leftmost columns also `sticky left-0` if horizontal scroll is expected.
- Make the filter/search card `sticky top-0 z-20` with a translucent background (`bg-white/95 dark:bg-gray-800/95 backdrop-blur`) so it floats above content while scrolling.
- Keep scrolling smooth: avoid nested `overflow` containers that fight each other; use one scrollable table container.

Examples:
- `CustomerList` filter card is sticky; `CustomerTable` already uses `sticky top-0` headers and `max-h` scroll.
- `TransactionList` table container uses `overflow-auto max-h-[calc(100vh-260px)]` and all header cells are `sticky top-0` (date + customer columns also `sticky left-0`).
- `OpeningBalanceTab` import preview table uses `max-h-64 overflow-auto` with `sticky top-0` headers.

## Accessibility

- Use `<label>` with `htmlFor`.
- Color is not the only indicator for status.
- Keyboard focus visible on all interactive elements.

## See also

- `apps/cashflow/docs/APPLE-HIG-UIUX-GUIDE.md`

