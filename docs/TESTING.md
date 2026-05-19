# Testing Guide

> **Merged from:** `TESTING-GUIDE.md`, `UI-QA-CHECKLIST.md`, `QA_DATA_JOURNEY_TEST_PLAN.md`

## Testing Pyramid

- **Unit tests**: 90%+ coverage — functions, utilities, hooks
- **Component tests**: 80%+ — rendering, interactions, accessibility
- **Integration tests**: 70%+ — component interactions, API calls
- **E2E tests**: Critical user paths only

## Running Tests

```bash
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:ci           # CI mode
```

## Mock Setup

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { changeLanguage: jest.fn() } }),
}));
```

## UI QA Checklist

### Design System
- [ ] Colors use `tailwind.config.js` palette (no hardcoded hex)
- [ ] WCAG AA contrast ratios met
- [ ] Inter font family used

### Responsive
- [ ] Mobile-first approach
- [ ] Touch targets ≥ 44px
- [ ] Tables scrollable on mobile

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Semantic HTML + ARIA labels

### Performance
- [ ] Lighthouse score > 90
- [ ] FCP < 1.5s, LCP < 2.5s, CLS < 0.1

### Code Quality
- [ ] No inline styles (`style={{}}`)
- [ ] No hardcoded colors (`#ff0000`)
- [ ] No `any` types

## Data Journey Tests

| Step | Validation |
|------|------------|
| Form | All DB fields mapped |
| Import | Data parsing correct |
| Backend | Correct customer assignment, WHERE clause verified |
| Display | Balance calculation accurate |

## Quick Checks

```bash
# Check inline styles
grep -r "style=" src/ --include="*.tsx"

# Check hardcoded colors
grep -r "#[0-9a-fA-F]\{6\}" src/ --include="*.tsx"

# Run audit
npm run build && npx lighthouse http://localhost:4173
```
