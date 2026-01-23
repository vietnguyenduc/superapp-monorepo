# Testing Guide

## Overview

This guide provides comprehensive instructions for testing the Debt and Repayment Web Application, including unit tests, integration tests, and end-to-end testing strategies.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Setup](#test-setup)
3. [Unit Testing](#unit-testing)
4. [Component Testing](#component-testing)
5. [Integration Testing](#integration-testing)
6. [E2E Testing](#e2e-testing)
7. [Test Utilities](#test-utilities)
8. [Best Practices](#best-practices)
9. [CI/CD Integration](#cicd-integration)

## Testing Strategy

### Testing Pyramid
```
    E2E Tests (Few)
        /\
       /  \
   Integration Tests (Some)
      /\
     /  \
Unit Tests (Many)
```

### Test Categories

1. **Unit Tests**: Test individual functions and utilities
2. **Component Tests**: Test React components in isolation
3. **Integration Tests**: Test component interactions and API calls
4. **E2E Tests**: Test complete user workflows

### Coverage Goals
- **Unit Tests**: 90%+ coverage
- **Component Tests**: 80%+ coverage
- **Integration Tests**: 70%+ coverage
- **E2E Tests**: Critical user paths

## Test Setup

### Dependencies
```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@testing-library/react-hooks": "^7.0.2",
    "jest-environment-jsdom": "^29.7.0",
    "msw": "^1.3.2"
  }
}
```

### Configuration Files

#### jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
};
```

#### src/setupTests.ts
```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};
```

## Unit Testing

### Utility Functions

#### src/utils/formatting.test.ts
```typescript
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPhoneNumber,
} from '../formatting';

describe('formatting utilities', () => {
  describe('formatCurrency', () => {
    it('formats USD currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('formats VND currency correctly', () => {
      expect(formatCurrency(1234.56, 'VND')).toBe('₫1,235');
      expect(formatCurrency(0, 'VND')).toBe('₫0');
    });

    it('handles edge cases', () => {
      expect(formatCurrency(NaN)).toBe('$NaN');
      expect(formatCurrency(Infinity)).toBe('$∞');
    });
  });

  describe('formatDate', () => {
    it('formats dates correctly', () => {
      const date = '2024-01-15T10:30:00Z';
      expect(formatDate(date)).toBe('Jan 15, 2024');
      expect(formatDate(date, 'dd/MM/yyyy')).toBe('15/01/2024');
    });

    it('handles invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers correctly', () => {
      expect(formatNumber(1234.567, 2)).toBe('1,234.57');
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatPhoneNumber', () => {
    it('formats US phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('11234567890')).toBe('+1 (123) 456-7890');
    });

    it('returns original for unformattable numbers', () => {
      expect(formatPhoneNumber('123')).toBe('123');
    });
  });
});
```

#### src/utils/validation.test.ts
```typescript
import { validateEmail, validatePhone, validateAmount } from '../validation';

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('validates correct phone numbers', () => {
      expect(validatePhone('1234567890')).toBe(true);
      expect(validatePhone('+1-234-567-8900')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc-def-ghij')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('validates correct amounts', () => {
      expect(validateAmount('1234.56')).toBe(true);
      expect(validateAmount(1234.56)).toBe(true);
      expect(validateAmount('0')).toBe(true);
    });

    it('rejects invalid amounts', () => {
      expect(validateAmount('abc')).toBe(false);
      expect(validateAmount('')).toBe(false);
      expect(validateAmount('-1234.56')).toBe(false);
    });
  });
});
```

### Custom Hooks

#### src/hooks/useAuth.test.ts
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';
import { AuthProvider } from '../contexts/AuthContext';

describe('useAuth hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('provides authentication state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });

  it('handles sign in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    // Mock successful sign in
    expect(result.current.user).toBeDefined();
    expect(result.current.loading).toBe(false);
  });

  it('handles sign out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
  });
});
```

## Component Testing

### Basic Component Test

#### src/components/UI/Button.test.tsx
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });

  it('disables button when loading', () => {
    render(<Button loading>Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveClass('loading');
  });

  it('shows loading spinner when loading', () => {
    render(<Button loading>Button</Button>);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Form Component Test

#### src/components/UI/Form.test.tsx
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from './Form';

describe('Form component', () => {
  const mockSubmit = jest.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it('renders form fields correctly', () => {
    render(
      <Form onSubmit={mockSubmit}>
        <input name="email" type="email" placeholder="Email" />
        <input name="password" type="password" placeholder="Password" />
        <button type="submit">Submit</button>
      </Form>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('submits form with correct data', async () => {
    const user = userEvent.setup();
    
    render(
      <Form onSubmit={mockSubmit}>
        <input name="email" type="email" placeholder="Email" />
        <input name="password" type="password" placeholder="Password" />
        <button type="submit">Submit</button>
      </Form>
    );

    await user.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();
    
    render(
      <Form onSubmit={mockSubmit}>
        <input name="email" type="email" required placeholder="Email" />
        <button type="submit">Submit</button>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });
});
```

### Page Component Test

#### src/pages/Dashboard/Dashboard.test.tsx
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { Dashboard } from './Dashboard';
import { databaseService } from '../../services/database';

// Mock the database service
jest.mock('../../services/database');

const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Dashboard component', () => {
  beforeEach(() => {
    mockDatabaseService.dashboard.getDashboardMetrics.mockResolvedValue({
      data: {
        totalOutstanding: 50000,
        activeCustomers: 150,
        monthlyTransactions: 500,
        totalTransactions: 2000,
        balanceByBranch: [],
        recentTransactions: [],
        topCustomers: [],
      },
      error: null,
    });
  });

  it('renders dashboard metrics', async () => {
    render(<Dashboard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/total outstanding/i)).toBeInTheDocument();
      expect(screen.getByText(/\$50,000/)).toBeInTheDocument();
      expect(screen.getByText(/150/)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<Dashboard />, { wrapper });
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    mockDatabaseService.dashboard.getDashboardMetrics.mockResolvedValue({
      data: null,
      error: 'Failed to load metrics',
    });

    render(<Dashboard />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/error loading metrics/i)).toBeInTheDocument();
    });
  });
});
```

## Integration Testing

### API Integration Tests

#### src/services/database.test.ts
```typescript
import { databaseService } from './database';
import { supabase } from './supabase';

jest.mock('./supabase');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Database Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('customers', () => {
    it('fetches customers successfully', async () => {
      const mockCustomers = [
        {
          id: '1',
          customer_code: 'CUST001',
          full_name: 'John Doe',
          total_balance: 1000,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockCustomers,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await databaseService.customers.getCustomers();

      expect(result.data).toEqual(mockCustomers);
      expect(result.error).toBeNull();
    });

    it('handles database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: 'Database connection failed',
            }),
          }),
        }),
      } as any);

      const result = await databaseService.customers.getCustomers();

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('transactions', () => {
    it('creates transaction successfully', async () => {
      const transactionData = {
        customer_id: '1',
        bank_account_id: '1',
        transaction_type: 'payment' as const,
        amount: 100,
        description: 'Test payment',
        transaction_date: '2024-01-01',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ id: '1', ...transactionData }],
            error: null,
          }),
        }),
      } as any);

      const result = await databaseService.transactions.createTransaction(transactionData);

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });
});
```

### Component Integration Tests

#### src/components/CustomerList/CustomerList.test.tsx
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { CustomerList } from './CustomerList';
import { databaseService } from '../../services/database';

jest.mock('../../services/database');

const mockDatabaseService = databaseService as jest.Mocked<typeof databaseService>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('CustomerList Integration', () => {
  const mockCustomers = [
    {
      id: '1',
      customer_code: 'CUST001',
      full_name: 'John Doe',
      phone: '1234567890',
      email: 'john@example.com',
      total_balance: 1000,
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ];

  beforeEach(() => {
    mockDatabaseService.customers.getCustomers.mockResolvedValue({
      data: mockCustomers,
      error: null,
    });
  });

  it('loads and displays customers', async () => {
    render(<CustomerList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('CUST001')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    
    render(<CustomerList />, { wrapper });

    const searchInput = screen.getByPlaceholderText(/search customers/i);
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(mockDatabaseService.customers.getCustomers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'John' })
      );
    });
  });

  it('handles customer deletion', async () => {
    const user = userEvent.setup();
    
    mockDatabaseService.customers.deleteCustomer.mockResolvedValue({
      error: null,
    });

    render(<CustomerList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDatabaseService.customers.deleteCustomer).toHaveBeenCalledWith('1');
    });
  });
});
```

## E2E Testing

### Setup with Playwright

#### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### tests/e2e/auth.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can sign in successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('user sees error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="signin-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });

  test('user can sign out', async ({ page }) => {
    // Setup: Sign in first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signin-button"]');
    
    // Sign out
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="signout-button"]');
    
    await expect(page).toHaveURL('/login');
  });
});
```

#### tests/e2e/customer-management.spec.ts
```typescript
import { test, expect } from '@playwright/test';

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="signin-button"]');
  });

  test('user can view customer list', async ({ page }) => {
    await page.goto('/customers');
    
    await expect(page.locator('[data-testid="customer-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-row"]')).toHaveCount(10);
  });

  test('user can search for customers', async ({ page }) => {
    await page.goto('/customers');
    
    await page.fill('[data-testid="search-input"]', 'John');
    
    await expect(page.locator('[data-testid="customer-row"]')).toHaveCount(1);
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('user can create new customer', async ({ page }) => {
    await page.goto('/customers');
    
    await page.click('[data-testid="add-customer-button"]');
    
    await page.fill('[data-testid="customer-name-input"]', 'Jane Smith');
    await page.fill('[data-testid="customer-email-input"]', 'jane@example.com');
    await page.fill('[data-testid="customer-phone-input"]', '0987654321');
    
    await page.click('[data-testid="save-customer-button"]');
    
    await expect(page.locator('text=Customer created successfully')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
  });

  test('user can edit customer', async ({ page }) => {
    await page.goto('/customers');
    
    await page.click('[data-testid="edit-customer-button"]');
    
    await page.fill('[data-testid="customer-name-input"]', 'John Updated');
    await page.click('[data-testid="save-customer-button"]');
    
    await expect(page.locator('text=Customer updated successfully')).toBeVisible();
    await expect(page.locator('text=John Updated')).toBeVisible();
  });

  test('user can delete customer', async ({ page }) => {
    await page.goto('/customers');
    
    await page.click('[data-testid="delete-customer-button"]');
    await page.click('[data-testid="confirm-delete-button"]');
    
    await expect(page.locator('text=Customer deleted successfully')).toBeVisible();
  });
});
```

## Test Utilities

### Custom Render Function

#### src/test-utils/test-utils.tsx
```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18n';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Mock Service Worker Setup

#### src/mocks/handlers.ts
```typescript
import { rest } from 'msw';

export const handlers = [
  // Auth handlers
  rest.post('/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'admin',
        },
      })
    );
  }),

  // Customer handlers
  rest.get('/rest/v1/customers', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          customer_code: 'CUST001',
          full_name: 'John Doe',
          total_balance: 1000,
          is_active: true,
        },
      ])
    );
  }),

  // Transaction handlers
  rest.get('/rest/v1/transactions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          transaction_code: 'TXN001',
          amount: 100,
          transaction_type: 'payment',
          transaction_date: '2024-01-01',
        },
      ])
    );
  }),
];
```

#### src/mocks/server.ts
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Test Data Factories

#### src/test-utils/factories.ts
```typescript
import { Customer, Transaction, User } from '../types';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: '1',
  customer_code: 'CUST001',
  full_name: 'John Doe',
  phone: '1234567890',
  email: 'john@example.com',
  total_balance: 1000,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: '1',
  transaction_code: 'TXN001',
  customer_id: '1',
  bank_account_id: '1',
  branch_id: '1',
  transaction_type: 'payment',
  amount: 100,
  description: 'Test transaction',
  transaction_date: '2024-01-01T00:00:00Z',
  created_by: '1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});
```

## Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### 2. Mocking Strategy
- Mock external dependencies (APIs, services)
- Use MSW for API mocking
- Mock time-dependent functions
- Avoid over-mocking

### 3. Test Data Management
- Use factories for test data
- Keep test data realistic
- Avoid hardcoded values
- Use consistent naming conventions

### 4. Performance
- Use `screen.getBy*` queries when possible
- Avoid `getAllBy*` for large lists
- Use `waitFor` instead of arbitrary delays
- Mock heavy operations

### 5. Accessibility Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## CI/CD Integration

### GitHub Actions Workflow

#### .github/workflows/test.yml
```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    
    - run: npm run lint
    
    - run: npm run type-check
    
    - run: npm run test:ci
    
    - run: npm run test:e2e
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### Test Scripts

#### package.json
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

For more information, refer to the [Jest Documentation](https://jestjs.io/), [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/), and [Playwright Documentation](https://playwright.dev/). 