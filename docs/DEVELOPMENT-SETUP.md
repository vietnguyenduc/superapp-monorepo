# Development Environment Setup

## Overview

This document outlines the development tools, configuration, and best practices for the Debt and Repayment Web Application. The project uses modern development tools to ensure code quality, consistency, and maintainability.

## Development Tools

### 1. Code Quality Tools

#### ESLint
- **Purpose**: Static code analysis and linting
- **Configuration**: `.eslintrc.cjs`
- **Features**:
  - TypeScript support with `@typescript-eslint`
  - React-specific rules with `eslint-plugin-react`
  - Accessibility rules with `eslint-plugin-jsx-a11y`
  - Import organization with `eslint-plugin-import`
  - Prettier integration with `eslint-plugin-prettier`

#### Prettier
- **Purpose**: Code formatting and style consistency
- **Configuration**: `.prettierrc`
- **Features**:
  - Automatic code formatting
  - Integration with ESLint
  - Consistent style across the project

#### TypeScript
- **Purpose**: Static type checking
- **Configuration**: `tsconfig.json`
- **Features**:
  - Strict type checking
  - Path mapping for clean imports
  - Modern JavaScript features

### 2. Testing Tools

#### Jest
- **Purpose**: Unit and integration testing
- **Configuration**: `jest.config.js`
- **Features**:
  - TypeScript support
  - React Testing Library integration
  - Coverage reporting
  - Mock support for external dependencies

#### React Testing Library
- **Purpose**: Component testing with user-centric approach
- **Features**:
  - Component rendering and interaction
  - Accessibility testing
  - User behavior simulation

#### Testing Utilities
- **@testing-library/jest-dom**: Custom Jest matchers
- **@testing-library/user-event**: User interaction simulation
- **@testing-library/react-hooks**: Hook testing utilities

## Installation and Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Type checking
npm run type-check
```

## Configuration Files

### ESLint Configuration (`.eslintrc.cjs`)

```javascript
module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true,
    jest: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended'
  ],
  // ... additional configuration
}
```

### Prettier Configuration (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Jest Configuration (`jest.config.js`)

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // ... additional path mappings
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    // ... exclusions
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

## Testing Strategy

### 1. Unit Tests

- **Location**: `src/**/__tests__/` or `src/**/*.test.{ts,tsx}`
- **Focus**: Individual functions, utilities, and hooks
- **Tools**: Jest + Testing Library

#### Example Unit Test

```typescript
import { validateEmail } from '../validation'

describe('validateEmail', () => {
  it('should return null for valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull()
  })

  it('should return error for invalid email', () => {
    expect(validateEmail('invalid-email')).toBe('Invalid email format')
  })
})
```

### 2. Component Tests

- **Location**: `src/components/**/__tests__/`
- **Focus**: Component rendering, user interactions, accessibility
- **Tools**: Jest + React Testing Library

#### Example Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import LanguageSwitcher from '../LanguageSwitcher'

describe('LanguageSwitcher', () => {
  it('renders language options', () => {
    render(<LanguageSwitcher />)
    expect(screen.getByDisplayValue('🇺🇸 English')).toBeInTheDocument()
  })

  it('calls changeLanguage when language is changed', () => {
    const mockChangeLanguage = jest.fn()
    render(<LanguageSwitcher />)
    
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'vi' } })
    
    expect(mockChangeLanguage).toHaveBeenCalledWith('vi')
  })
})
```

### 3. Integration Tests

- **Location**: `src/**/__tests__/integration/`
- **Focus**: Component interactions, API calls, user workflows
- **Tools**: Jest + React Testing Library + MSW (Mock Service Worker)

### 4. Test Setup (`src/setupTests.ts`)

```typescript
import '@testing-library/jest-dom'

// Mock i18next for tests
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
}))

// Mock Supabase for tests
jest.mock('./services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}))

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
```

## Code Quality Standards

### 1. ESLint Rules

- **TypeScript**: Strict type checking, no unused variables
- **React**: Hooks rules, JSX runtime, prop types disabled
- **Accessibility**: ARIA attributes, semantic HTML
- **Imports**: Organized imports, no unresolved imports
- **Prettier**: Integration for consistent formatting

### 2. Prettier Rules

- **Semicolons**: Required
- **Quotes**: Single quotes
- **Line Length**: 80 characters
- **Indentation**: 2 spaces
- **Trailing Commas**: ES5 style

### 3. TypeScript Configuration

- **Strict Mode**: Enabled
- **Path Mapping**: Clean imports with `@/` prefix
- **Modern Features**: Latest ECMAScript features
- **Type Checking**: Strict null checks, no implicit any

## Development Workflow

### 1. Pre-commit Checks

```bash
# Run all checks before committing
npm run type-check
npm run lint
npm run format:check
npm run test:ci
```

### 2. IDE Setup

#### VS Code Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest Runner
- Testing Library Snippets

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### 3. Git Hooks (Optional)

```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged

# Configure pre-commit hook
npx husky add .husky/pre-commit "npm run lint-staged"
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

## Testing Best Practices

### 1. Test Structure

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── __tests__/
│           └── Button.test.tsx
├── utils/
│   ├── validation.ts
│   └── __tests__/
│       └── validation.test.ts
└── hooks/
    ├── useAuth.ts
    └── __tests__/
        └── useAuth.test.ts
```

### 2. Test Naming

- **Unit Tests**: `*.test.ts` or `*.test.tsx`
- **Integration Tests**: `*.integration.test.ts`
- **E2E Tests**: `*.e2e.test.ts`

### 3. Test Coverage

- **Minimum Coverage**: 70% for all metrics
- **Critical Paths**: 90% coverage for business logic
- **UI Components**: Focus on user interactions and accessibility

### 4. Mocking Strategy

- **External APIs**: Mock Supabase calls
- **Browser APIs**: Mock localStorage, matchMedia, etc.
- **Third-party Libraries**: Mock i18next, chart libraries
- **Time-dependent Code**: Mock dates and timers

## Performance Considerations

### 1. Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

### 2. Test Performance

```bash
# Run tests with performance monitoring
npm run test -- --verbose --detectOpenHandles
```

### 3. Development Performance

- **Hot Module Replacement**: Fast development feedback
- **TypeScript**: Incremental compilation
- **ESLint**: Cached linting results
- **Prettier**: Fast formatting

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Run `npm run type-check`
2. **Linting Errors**: Run `npm run lint:fix`
3. **Formatting Issues**: Run `npm run format`
4. **Test Failures**: Check mocks and test setup
5. **Import Errors**: Verify path mappings in tsconfig.json

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run test

# Run specific test file
npm run test -- Button.test.tsx

# Run tests with coverage for specific file
npm run test -- --coverage --collectCoverageFrom="src/components/Button/**"
```

This development setup ensures code quality, consistency, and maintainability throughout the project lifecycle. 