# Apple HIG — UI/UX Guide for Cashflow

> This is a Cashflow-specific distillation of the [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines).  
> Full HIG index and per-page notes live in `.agents/skills/apple-design-guidelines/`.

## Why this guide exists

Cashflow is a finance app used by Vietnamese SMBs. Many UI decisions (colors, table layouts, form labels, button hierarchy) directly affect whether users trust the numbers and can act on them quickly. This guide maps Apple's general principles to Cashflow's concrete conventions so future sessions don't have to rediscover them.

## Core principles (from Apple HIG)

| Principle | What it means for Cashflow |
|-----------|----------------------------|
| **Purpose** | Every screen should help the user finish a money/business task faster. If a column, button, or setting doesn't serve that, remove it. |
| **Agency** | Users can edit, undo, bulk import, and recover from mistakes. Always confirm destructive actions and provide a clear back path. |
| **Responsibility** | Financial data is sensitive. Be transparent about calculations, show formula in Settings, and never silently change a user's entered amount. |
| **Familiarity** | Use patterns from accounting/banking apps: red = debt, green = credit, tables with sticky first column, filters in a header. |
| **Flexibility** | Support desktop, tablet, and mobile; right-to-left if needed; dark mode; and Vietnamese text. |
| **Simplicity** | Avoid one-off `<button>` styles; reuse `Button.tsx`, `theme.ts`, and shared table cells. |
| **Craft** | Pay attention to number alignment, currency formatting, monospaced codes, and hover/focus states. |
| **Delight** | Smooth loading, clear empty states, and instant feedback after save/import make the app feel reliable. |

## Foundations applied to Cashflow

### Color

- **Red** = debt / money going out / increase in receivables (`Phát sinh tăng`, `Công nợ`).
- **Green** = credit / money coming in / decrease in receivables (`Phát sinh giảm`, `Hoàn tiền`, `Đặt cọc`).
- **Blue** = neutral/info / adjustments.
- **Gray** = disabled, metadata, secondary text.
- Test red/green in Dark Mode and for color-blind users; don't rely on color alone (add +/- labels and badges).

### Typography

- Amounts: right-aligned, tabular/monospaced digits, formatted with `formatCurrency`.
- Customer name: `text-gray-900 dark:text-white`, semibold.
- Customer code: `font-mono text-xs text-gray-500 dark:text-gray-400` on a new line.
- Avoid showing raw UUIDs; resolve `users.full_name` for `Người thực hiện`.

### Layout

- Page header: title on left, primary CTA (`+ Thêm`, `Tạo mới`) as `variant="primary"`, utility actions (import/export/filter) as `variant="secondary"` `size="md"` on the right.
- Filter cards: collapsible, grouped, with clear labels.
- Wide tables: wrap in `overflow-x-auto`, add a top synchronized scrollbar, make the customer-name column `sticky left-0` with a solid background.

### Icons

- Use `lucide-react` icons consistently; avoid mixing outline and filled styles.
- Icon-only buttons (e.g. edit/delete) need an `aria-label` and a tooltip on hover.

### Dark Mode

- Don't use `bg-white`/`text-black` directly; use `bg-white dark:bg-gray-900` and `text-gray-900 dark:text-white`.
- Cards and modals use `bg-white dark:bg-gray-800`.
- Borders use `border-gray-200 dark:border-gray-700`.

### Accessibility

- Minimum 44 px touch targets for mobile.
- Focus rings on keyboard navigation.
- `aria-label` for icon-only actions.
- Screen-reader friendly table headers.

## Patterns applied to Cashflow

### Tables (TransactionList, CustomerList)

- Sticky first column for the entity name.
- Top scrollbar or scroll hint; don't bury horizontal scroll at the bottom.
- Right-align amount columns; show currency symbol consistently.
- Sortable headers with visible active state.
- Pagination + page-size selector.
- Group summary rows show `Net` color by direction: positive (debt) = red, negative (credit) = green, zero = gray.

### Forms (TransactionEditModal, CustomerFormModal, BankAccountForm)

- Label every field; placeholder is a hint, not a label.
- Inline validation in Vietnamese (`Tên khách hàng là bắt buộc`).
- Disable submit until required fields are valid.
- After save, close modal and show a toast.
- For destructive actions (delete, revert), show a confirmation modal with the consequence.

### Feedback

- Toast for success (`Khách hàng đã được tạo`).
- Inline error for field-level problems.
- Top banner only for system/load errors.
- Loading skeletons or spinners for async lists.

### Modality

- Use modals for short, focused tasks (create/edit one record).
- Use full pages for multi-step or bulk flows (import wizards).
- Always have a visible Cancel/Done path.

### Navigation

- Sidebar or top tabs show current location.
- Settings uses tabs (`Công thức dư nợ`, `Tài khoản ngân hàng`, `Loại giao dịch`, ...).
- Breadcrumbs or back button for nested pages.

## Components applied to Cashflow

### Buttons

Always use `apps/cashflow/src/components/UI/Button.tsx`:

- `variant="primary"` `size="md"`: main CTA (`+ Thêm giao dịch`, `Lưu`).
- `variant="secondary"` `size="md"`: utility (`Nhập hàng loạt`, `Xuất Excel`, `Bộ lọc`).
- `variant="danger"` / `className` for destructive actions (`Xóa`).
- Don't create ad-hoc `<button className="bg-blue-600 ...">`; it drifts out of sync and breaks Dark Mode.

### Text fields and selects

- Use shared `Input`, `Select`, `DatePicker` components.
- Format amounts on blur; store the raw number internally.
- For `Loại giao dịch`, `Khách hàng`, `Tài khoản ngân hàng`, show canonical labels and resolve to IDs internally.

### Toggles

- Use for boolean settings only (e.g. "Hiển thị khách hàng đã xóa").
- Don't use a toggle for an action that should be a button.

### Alerts / Confirmations

- Deletion: "Xóa giao dịch `TXN0001`? Số dư khách hàng và ngân hàng sẽ được điều chỉnh lại."
- Buttons: "Xóa" (destructive) and "Hủy".

### Charts (Dashboard)

- Use signed inflow/outflow bars; avoid stacked waterfalls that produce negative SVG rect heights.
- Label axes and currency.
- Show a tooltip with exact values on hover.

## Cashflow UI/UX checklist

Before merging any UI change:

- [ ] Header buttons follow primary/secondary hierarchy and use the shared `Button` component.
- [ ] Customer name/code have high contrast and are readable in both light and dark modes.
- [ ] Wide tables have a sticky first column and a visible way to scroll horizontally.
- [ ] Amounts are right-aligned and formatted with `formatCurrency`.
- [ ] `Công nợ`/`Net` colors follow red=debt, green=credit, gray=zero.
- [ ] `Người thực hiện` shows the user's `full_name`, not a UUID.
- [ ] Forms validate inline in Vietnamese and handle server errors gracefully.
- [ ] Empty, loading, and error states are designed, not just the happy path.
- [ ] Dark Mode is verified.
- [ ] Touch targets are ≥ 44 px on mobile.
- [ ] New icon-only controls have `aria-label`.

## References

- `.agents/skills/apple-design-guidelines/SKILL.md` — high-level design principles and Superapp checklist.
- `.agents/skills/apple-design-guidelines/references/hig-index.md` — full index of every Apple HIG page with abstracts and direct links.
