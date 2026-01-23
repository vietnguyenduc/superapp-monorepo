# Internationalization (i18n) Setup

## Overview

The Debt and Repayment Web Application supports multiple languages with a focus on English and Vietnamese. The i18n system is built using `react-i18next` and provides comprehensive localization for all user-facing content.

## Supported Languages

- **English (en)** - Default language
- **Vietnamese (vi)** - Secondary language with full translation support

## Architecture

### Core Files

```
src/i18n/
├── index.ts                 # Main i18n configuration
├── locales/
│   ├── en.json             # English translations
│   └── vi.json             # Vietnamese translations
└── hooks/
    └── useI18n.ts          # Custom i18n hook
```

### Components

```
src/components/UI/
└── LanguageSwitcher.tsx    # Language selection component
```

## Setup and Configuration

### 1. Dependencies

The following packages are required for i18n functionality:

```json
{
  "i18next": "^23.7.6",
  "react-i18next": "^13.5.0",
  "i18next-browser-languagedetector": "^7.2.0",
  "i18next-http-backend": "^2.4.2"
}
```

### 2. Configuration (`src/i18n/index.ts`)

The i18n system is configured with:

- **Language Detection**: Automatically detects user's preferred language
- **Local Storage**: Persists language preference
- **Fallback**: English as the default fallback language
- **Debug Mode**: Enabled in development environment

### 3. Translation Files

#### English (`src/i18n/locales/en.json`)
Comprehensive English translations covering:
- Common UI elements
- Navigation
- Authentication
- Dashboard
- Customer management
- Transaction management
- Import/Export functionality
- Reports
- Validation messages
- Error messages
- Date/time formatting
- Currency formatting

#### Vietnamese (`src/i18n/locales/vi.json`)
Complete Vietnamese translations with:
- Natural Vietnamese language expressions
- Proper Vietnamese currency formatting (VND)
- Vietnamese date/time formatting
- Cultural adaptations where appropriate

## Usage

### 1. Basic Translation

```tsx
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.overview')}</p>
    </div>
  )
}
```

### 2. Custom i18n Hook

```tsx
import { useI18n } from '../hooks/useI18n'

const MyComponent = () => {
  const { 
    t, 
    currentLanguage, 
    changeLanguage, 
    formatCurrency, 
    formatDate 
  } = useI18n()
  
  return (
    <div>
      <h1>{t('customers.title')}</h1>
      <p>Amount: {formatCurrency(1000000)}</p>
      <p>Date: {formatDate(new Date())}</p>
      <button onClick={() => changeLanguage('vi')}>
        Switch to Vietnamese
      </button>
    </div>
  )
}
```

### 3. Language Switcher Component

```tsx
import LanguageSwitcher from '../components/UI/LanguageSwitcher'

const Navigation = () => {
  return (
    <nav>
      <div className="flex items-center space-x-4">
        <LanguageSwitcher />
        {/* Other navigation items */}
      </div>
    </nav>
  )
}
```

## Translation Structure

### Namespace Organization

Translations are organized into logical namespaces:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "customers": "Customers"
  },
  "auth": {
    "login": "Login",
    "logout": "Logout"
  },
  "dashboard": {
    "title": "Dashboard",
    "overview": "Overview"
  },
  "customers": {
    "title": "Customers",
    "addCustomer": "Add Customer"
  },
  "transactions": {
    "title": "Transactions",
    "addTransaction": "Add Transaction"
  },
  "import": {
    "title": "Import Data",
    "uploadFile": "Upload File"
  },
  "export": {
    "title": "Export Data",
    "exportOptions": "Export Options"
  },
  "reports": {
    "title": "Reports",
    "generateReport": "Generate Report"
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email address"
  },
  "messages": {
    "confirmDelete": "Are you sure you want to delete this item?",
    "dataSaved": "Data saved successfully"
  },
  "pagination": {
    "showing": "Showing",
    "to": "to",
    "of": "of"
  },
  "dateTime": {
    "today": "Today",
    "yesterday": "Yesterday"
  },
  "currency": {
    "symbol": "$",
    "name": "US Dollar",
    "code": "USD"
  },
  "userRoles": {
    "admin": "Administrator",
    "branch_manager": "Branch Manager",
    "staff": "Staff"
  }
}
```

## Language-Specific Features

### Currency Formatting

- **English**: USD format with $ symbol
- **Vietnamese**: VND format with ₫ symbol

```tsx
const { formatCurrency } = useI18n()

// English: $1,000.00
// Vietnamese: 1.000 ₫
formatCurrency(1000)
```

### Date/Time Formatting

- **English**: US date format (MM/DD/YYYY)
- **Vietnamese**: Vietnamese date format (DD/MM/YYYY)

```tsx
const { formatDate, formatDateTime } = useI18n()

// English: January 15, 2024
// Vietnamese: 15 tháng 1 năm 2024
formatDate(new Date('2024-01-15'))
```

### Number Formatting

- **English**: US number format with commas
- **Vietnamese**: Vietnamese number format with dots

```tsx
const { formatNumber } = useI18n()

// English: 1,234.56
// Vietnamese: 1.234,56
formatNumber(1234.56, 2)
```

## Adding New Languages

To add a new language:

1. **Create translation file**: `src/i18n/locales/[language-code].json`
2. **Update language options**: Add to `LanguageSwitcher.tsx`
3. **Update i18n configuration**: Add to resources in `index.ts`
4. **Add language-specific formatting**: Update `useI18n.ts` hook

### Example for French

```json
// src/i18n/locales/fr.json
{
  "common": {
    "loading": "Chargement...",
    "error": "Erreur",
    "success": "Succès"
  }
}
```

```tsx
// src/components/UI/LanguageSwitcher.tsx
const languages: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'vi',
    name: 'Tiếng Việt',
    flag: '🇻🇳'
  },
  {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷'
  }
]
```

## Best Practices

### 1. Translation Keys

- Use descriptive, hierarchical keys
- Keep keys consistent across languages
- Use lowercase with dots for separation
- Group related translations in namespaces

### 2. Interpolation

Use interpolation for dynamic content:

```json
{
  "validation": {
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be no more than {{max}} characters"
  }
}
```

```tsx
const { t } = useTranslation()
t('validation.minLength', { min: 8 })
```

### 3. Pluralization

Handle plural forms appropriately:

```json
{
  "pagination": {
    "entries_one": "{{count}} entry",
    "entries_other": "{{count}} entries"
  }
}
```

### 4. Context-Aware Translations

Use context for different meanings:

```json
{
  "common": {
    "save": "Save",
    "save_context_form": "Save Form",
    "save_context_file": "Save File"
  }
}
```

### 5. Testing

Test translations thoroughly:

```tsx
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}
```

## Performance Considerations

### 1. Lazy Loading

Translations are loaded on-demand to reduce initial bundle size.

### 2. Caching

Language preferences are cached in localStorage for better performance.

### 3. Bundle Optimization

Only load translation files for supported languages.

## Accessibility

### 1. Language Attributes

The HTML `lang` attribute is automatically updated based on the current language.

### 2. Screen Reader Support

Translation keys are designed to be screen reader friendly.

### 3. RTL Support

While current languages are LTR, the system is prepared for RTL languages.

## Troubleshooting

### Common Issues

1. **Missing translations**: Check if translation key exists in all language files
2. **Formatting issues**: Verify language-specific formatting functions
3. **Language not switching**: Check localStorage and i18n configuration
4. **Performance issues**: Ensure translations are properly cached

### Debug Mode

Enable debug mode in development:

```typescript
// src/i18n/index.ts
debug: process.env.NODE_ENV === 'development'
```

This will log missing translations and other i18n-related information to the console.

## Future Enhancements

1. **More Languages**: Add support for additional languages
2. **RTL Support**: Implement right-to-left language support
3. **Translation Management**: Add admin interface for translation management
4. **Auto-translation**: Integrate with translation services for new content
5. **Context-aware Translations**: Implement more sophisticated context handling

This i18n setup provides a robust foundation for multilingual support in the Debt and Repayment Web Application, ensuring a great user experience for both English and Vietnamese users. 