---
name: apple-design-guidelines
description: Apple Human Interface Guidelines distilled for Superapp UI/UX. Use when designing or reviewing screens, components, colors, typography, buttons, tables, forms, navigation, feedback, accessibility, dark mode, and responsive behavior.
---

# Apple Design Guidelines for Superapp UI/UX

> Source: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)  
> Full index with abstracts and direct links: [references/hig-index.md](references/hig-index.md)

## When to use this skill

- Adding a new page, modal, form, table, button, or navigation element in any Superapp.
- Reviewing a PR that touches UI/UX or styling.
- Choosing colors, icons, typography, spacing, or interaction states.
- Fixing layout, contrast, dark-mode, right-to-left, or accessibility issues.

## Core design principles

Apple's HIG is organized around principles that apply to web apps as well as native apps:

1. **Purpose** — Make something meaningful. Focus on what matters most to the user.
2. **Agency** — Let people do things their own way. Keep them informed and make mistakes easy to recover from.
3. **Responsibility** — Act in people's best interest. Protect privacy, be transparent, keep data safe.
4. **Familiarity** — Build on what people already know. Use established patterns consistently.
5. **Flexibility** — Adapt to diverse contexts, devices, input methods, and abilities.
6. **Simplicity** — Be clear and direct. Remove the unnecessary; every element should earn its place.
7. **Craft** — Care about every detail. UI reflects how much we care about the experience.
8. **Delight** — Make it human. Aim for satisfying, enriching interactions.

## Foundations

### Color

- Use color to communicate status and feedback, not just decoration.
- Maintain sufficient contrast against both light and dark backgrounds.
- Use semantic colors consistently: success/green, warning/yellow, error/red, info/blue.
- In Cashflow, positive debt is **red** and credit/overpayment is **green**; keep this mapping everywhere.
- Always test with Dark Mode and high-contrast modes.

### Typography

- Use a clear hierarchy: title, subtitle, body, caption, metadata.
- Avoid all-caps for body text; use sentence case for labels.
- Keep line length readable; wrap long labels with `line-clamp` or `break-words`.
- Monospace is for codes/IDs (e.g. `CUST0001`), not for names or amounts.

### Layout

- Leave enough whitespace; crowded UIs feel harder to use.
- Align related elements; use grids and consistent spacing (4/8 pt base).
- Make the primary action visually dominant; keep secondary actions neutral.
- Use `sticky` headers/columns for wide tables so context stays visible while scrolling.

### Icons and SF Symbols

- Prefer simple, familiar icons; label them if meaning is not obvious.
- Use consistent icon style (stroke width, fill, size) across the app.
- Avoid using platform-specific metaphors that don't translate to web.

### Dark Mode

- Avoid pure black; use dark grays (`gray-900`) so shadows/hierarchy remain visible.
- Invert text contrast: `text-white` on dark surfaces, `text-gray-900` on light.
- Test color semantics (red/green) in both modes for accessibility.

### Accessibility & Inclusion

- Minimum touch target: **44 x 44 pt** (≈ 44 CSS px on touch devices).
- Use `aria-label`, focus rings, and keyboard navigation.
- Support screen-reader text for icon-only buttons.
- Avoid relying on color alone to convey meaning; add labels/icons.
- Respect right-to-left (RTL) layouts for Arabic/Hebrew users.

## Patterns

### Navigation and search

- Keep navigation predictable: persistent sidebar/top bar, visible current location.
- Search should be forgiving (case-insensitive, diacritic-insensitive, clearable).
- Breadcrumbs or back buttons help users know where they are.

### Lists and tables

- Show the most important column first and keep it sticky when scrolling horizontally.
- Use a top synchronized scrollbar or keep columns narrow enough to fit.
- Right-align numbers, left-align text; use monospaced digits for amounts.
- Provide empty states and loading states.

### Data entry

- Group related fields; use clear labels and inline validation.
- Show helpful error messages near the field, not only in a top banner.
- Use the right control for the data: toggle for boolean, picker for options, text field for free text.
- Avoid asking for data you don't need.

### Feedback and loading

- Confirm actions immediately (toast, inline checkmark, progress indicator).
- Show loading states for async work; don't leave the UI frozen.
- For destructive actions, require a confirmation step.

### Modality

- Use modals/sheets for focused, short tasks; dismissible via backdrop or Cancel.
- Don't nest modals; use the main view or a dedicated page for complex flows.
- Preserve context: if the user cancels, return them to the previous state unchanged.

### Onboarding

- Teach by doing, not by long tutorials.
- Show empty states as opportunities to create the first item.
- Let experienced users skip or dismiss onboarding.

## Components

### Buttons

- Use the shared `Button` component (`apps/cashflow/src/components/UI/Button.tsx`).
- `variant="primary"` for the single main action (blue-teal gradient, white text).
- `variant="secondary"` for utility/export/import actions (white/gray, dark text).
- Keep prominent buttons to one or two per view.
- Assign destructive role (red) only to actions that delete/destroy data.
- Provide a visible pressed/hover/disabled state.

### Text fields

- Use a clear label; placeholder is not a substitute for a label.
- Show validation inline and on blur where possible.
- Use `type` and input modes appropriate for the data (number, date, tel).

### Toggles

- Use for binary settings, not for actions that take effect immediately if ambiguous.
- Label the toggle with what is enabled when it is on.

### Alerts

- Explain the problem, the consequence, and the action clearly.
- Use descriptive button labels (e.g. "Delete customer" instead of "OK").
- Avoid alerts for expected, non-critical events; use toast/banner instead.

### Charts

- Choose the right chart for the message (trend, comparison, composition).
- Label axes, provide legends, and handle negative/zero values gracefully.
- Keep colors consistent with the app's semantic palette.

## Superapp-specific checklist

Before merging any UI/UX change, confirm:

- [ ] Buttons use the shared `Button` component with `variant`/`size` matching the page header pattern.
- [ ] Color semantics match the app domain (e.g. red = debt/cost, green = credit/income).
- [ ] Wide tables have horizontal scroll, sticky primary column, and top or visible scrollbar.
- [ ] Text contrast passes WCAG AA on both light and dark backgrounds.
- [ ] Touch targets are at least 44 px.
- [ ] Forms show inline validation and clear error messages in Vietnamese.
- [ ] Empty, loading, and error states are handled, not just success states.
- [ ] Customer names/IDs are readable (name in `text-gray-900 dark:text-white`, code in `font-mono text-xs text-gray-500`).
- [ ] Dark Mode colors are verified.
- [ ] RTL layouts are considered for future internationalization.
- [ ] Accessibility labels are added to icon-only controls.

## How to apply to Cashflow

See `apps/cashflow/docs/APPLE-HIG-UIUX-GUIDE.md` for the Cashflow-specific interpretation of these guidelines, including current conventions for tables, transaction colors, import buttons, and the balance-formula settings UI.
