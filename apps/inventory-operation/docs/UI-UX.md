---
app: inventory-operation
doc_type: UI-UX
generated: true
---

# inventory-operation — UI/UX Guide

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

## Accessibility

- Use `<label>` with `htmlFor`.
- Color is not the only indicator for status.
- Keyboard focus visible on all interactive elements.

## See also

- `apps/cashflow/docs/APPLE-HIG-UIUX-GUIDE.md`

