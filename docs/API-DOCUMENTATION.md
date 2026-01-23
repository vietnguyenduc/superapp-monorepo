# API Documentation

## Overview

This document provides comprehensive documentation for all API services, functions, and data structures used in the Debt and Repayment Web Application.

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [Database Service](#database-service)
3. [Import Service](#import-service)
4. [Utility Functions](#utility-functions)
5. [Type Definitions](#type-definitions)
6. [Error Handling](#error-handling)
7. [Real-time Subscriptions](#real-time-subscriptions)

## Authentication Service

### Overview
The authentication service handles user authentication, session management, and role-based access control using Supabase Auth.

### Location
`src/services/supabase.ts`

### Key Functions

#### `signIn(email: string, password: string)`
Signs in a user with email and password.

**Parameters:**
- `email` (string): User's email address
- `password` (string): User's password

**Returns:**
```typescript
Promise<{
  data: { user: User | null; session: Session | null };
  error: string | null;
}>
```

**Example:**
```typescript
const { data, error } = await signIn('user@example.com', 'password123');
if (error) {
  console.error('Sign in failed:', error);
} else {
  console.log('User signed in:', data.user);
}
```

#### `signOut()`
Signs out the current user.

**Returns:**
```typescript
Promise<{ error: string | null }>
```

#### `getCurrentUser()`
Gets the currently authenticated user.

**Returns:**
```typescript
Promise<{ user: User | null; error: string | null }>
```

#### `onAuthStateChange(callback: (event: string, session: Session | null) => void)`
Listens for authentication state changes.

**Parameters:**
- `callback` (function): Function called when auth state changes

**Returns:**
```typescript
{ data: { subscription: Subscription } }
```

## Database Service

### Overview
The database service provides CRUD operations for all database entities using Supabase client.

### Location
`src/services/database.ts`

### Customer Operations

#### `getCustomers(filters?: CustomerFilters)`
Retrieves customers with optional filtering.

**Parameters:**
```typescript
interface CustomerFilters {
  search?: string;
  branch_id?: string;
  is_active?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}
```

**Returns:**
```typescript
Promise<{
  data: Customer[];
  error: string | null;
}>
```

**Example:**
```typescript
const { data: customers, error } = await databaseService.customers.getCustomers({
  search: 'john',
  is_active: true
});
```

#### `createCustomer(customerData: CustomerForm)`
Creates a new customer.

**Parameters:**
```typescript
interface CustomerForm {
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  branch_id: string;
}
```

**Returns:**
```typescript
Promise<{
  data: Customer | null;
  error: string | null;
}>
```

#### `updateCustomer(id: string, updates: Partial<CustomerForm>)`
Updates an existing customer.

**Parameters:**
- `id` (string): Customer ID
- `updates` (object): Fields to update

**Returns:**
```typescript
Promise<{
  data: Customer | null;
  error: string | null;
}>
```

#### `deleteCustomer(id: string)`
Deletes a customer.

**Parameters:**
- `id` (string): Customer ID

**Returns:**
```typescript
Promise<{ error: string | null }>
```

### Transaction Operations

#### `getTransactions(filters?: TransactionFilters)`
Retrieves transactions with optional filtering.

**Parameters:**
```typescript
interface TransactionFilters {
  customer_id?: string;
  branch_id?: string;
  transaction_type?: TransactionType;
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}
```

**Returns:**
```typescript
Promise<{
  data: Transaction[];
  error: string | null;
}>
```

#### `createTransaction(transactionData: TransactionForm)`
Creates a new transaction.

**Parameters:**
```typescript
interface TransactionForm {
  customer_id: string;
  bank_account_id: string;
  transaction_type: TransactionType;
  amount: number;
  description?: string;
  reference_number?: string;
  transaction_date: string;
}
```

**Returns:**
```typescript
Promise<{
  data: Transaction | null;
  error: string | null;
}>
```

### Dashboard Operations

#### `getDashboardMetrics(branch_id?: string)`
Retrieves dashboard metrics and analytics.

**Parameters:**
- `branch_id` (string, optional): Branch ID to filter metrics

**Returns:**
```typescript
Promise<{
  data: DashboardMetrics | null;
  error: string | null;
}>
```

**DashboardMetrics Structure:**
```typescript
interface DashboardMetrics {
  totalOutstanding: number;
  activeCustomers: number;
  monthlyTransactions: number;
  totalTransactions: number;
  balanceByBranch: BalanceByBranch[];
  recentTransactions: Transaction[];
  topCustomers: Customer[];
}
```

## Import Service

### Overview
The import service handles data import from various sources including Excel files, CSV files, and Google Sheets.

### Location
`src/services/importService.ts`

### Functions

#### `parseExcelFile(file: File)`
Parses an Excel file and extracts data.

**Parameters:**
- `file` (File): Excel file to parse

**Returns:**
```typescript
Promise<{
  data: any[][];
  error: string | null;
}>
```

#### `parseCSVFile(file: File)`
Parses a CSV file and extracts data.

**Parameters:**
- `file` (File): CSV file to parse

**Returns:**
```typescript
Promise<{
  data: any[][];
  error: string | null;
}>
```

#### `validateTransactionData(data: any[][])`
Validates transaction data for import.

**Parameters:**
- `data` (any[][]): Raw data to validate

**Returns:**
```typescript
{
  isValid: boolean;
  errors: ImportError[];
  validatedData: TransactionForm[];
}
```

#### `importTransactions(transactions: TransactionForm[])`
Imports validated transactions into the database.

**Parameters:**
- `transactions` (TransactionForm[]): Validated transactions to import

**Returns:**
```typescript
Promise<{
  success: number;
  errors: ImportError[];
}>
```

## Utility Functions

### Formatting Utilities
Location: `src/utils/formatting.ts`

#### `formatCurrency(amount: number, currency?: string)`
Formats a number as currency.

**Parameters:**
- `amount` (number): Amount to format
- `currency` (string, optional): Currency code (default: 'USD')

**Returns:**
```typescript
string
```

**Example:**
```typescript
formatCurrency(1234.56) // "$1,234.56"
formatCurrency(1234.56, 'VND') // "₫1,235"
```

#### `formatDate(date: string | Date, formatString?: string)`
Formats a date using date-fns.

**Parameters:**
- `date` (string | Date): Date to format
- `formatString` (string, optional): Format string (default: 'MMM dd, yyyy')

**Returns:**
```typescript
string
```

**Example:**
```typescript
formatDate('2024-01-15') // "Jan 15, 2024"
formatDate('2024-01-15', 'dd/MM/yyyy') // "15/01/2024"
```

#### `formatNumber(number: number, decimals?: number)`
Formats a number with specified decimal places.

**Parameters:**
- `number` (number): Number to format
- `decimals` (number, optional): Decimal places (default: 0)

**Returns:**
```typescript
string
```

**Example:**
```typescript
formatNumber(1234.567, 2) // "1,234.57"
formatNumber(1234) // "1,234"
```

### Validation Utilities
Location: `src/utils/validation.ts`

#### `validateEmail(email: string)`
Validates email format.

**Parameters:**
- `email` (string): Email to validate

**Returns:**
```typescript
boolean
```

#### `validatePhone(phone: string)`
Validates phone number format.

**Parameters:**
- `phone` (string): Phone number to validate

**Returns:**
```typescript
boolean
```

#### `validateAmount(amount: string | number)`
Validates amount format.

**Parameters:**
- `amount` (string | number): Amount to validate

**Returns:**
```typescript
boolean
```

## Type Definitions

### Core Types
Location: `src/types/index.ts`

#### User
```typescript
interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  position?: string;
  role: UserRole;
  branch_id?: string;
  branch?: Branch;
  created_at: string;
  updated_at: string;
}
```

#### Customer
```typescript
interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  branch_id: string;
  total_balance: number;
  last_transaction_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### Transaction
```typescript
interface Transaction {
  id: string;
  transaction_code: string;
  customer_id: string;
  bank_account_id: string;
  branch_id: string;
  transaction_type: TransactionType;
  amount: number;
  description?: string;
  reference_number?: string;
  transaction_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

#### Enums
```typescript
type UserRole = 'admin' | 'branch_manager' | 'staff';
type TransactionType = 'payment' | 'charge' | 'adjustment' | 'refund';
type ReportType = 'keyMetrics' | 'customerBalance' | 'transactionReport' | 'cashFlowReport';
type ExportFormat = 'excel' | 'csv';
```

### API Response Types
```typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

## Error Handling

### Error Types
```typescript
interface ImportError {
  row: number;
  column: string;
  message: string;
  value?: any;
}

interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
```

### Error Handling Patterns

#### Service Level
```typescript
try {
  const { data, error } = await databaseService.customers.getCustomers();
  if (error) {
    throw new Error(error);
  }
  return data;
} catch (error) {
  console.error('Failed to fetch customers:', error);
  throw error;
}
```

#### Component Level
```typescript
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  try {
    setError(null);
    const data = await service.getData();
    setData(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred');
  }
};
```

## Real-time Subscriptions

### Overview
The application uses Supabase real-time subscriptions to provide live updates.

### Usage Examples

#### Subscribe to Customer Changes
```typescript
const subscription = supabase
  .channel('customers')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'customers'
  }, (payload) => {
    console.log('Customer changed:', payload);
    // Update local state
  })
  .subscribe();
```

#### Subscribe to Transaction Changes
```typescript
const subscription = supabase
  .channel('transactions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'transactions',
    filter: `branch_id=eq.${branchId}`
  }, (payload) => {
    console.log('New transaction:', payload);
    // Update dashboard metrics
  })
  .subscribe();
```

### Cleanup
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('customers')
    .on('postgres_changes', callback)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Best Practices

### 1. Error Handling
- Always check for errors in API responses
- Provide meaningful error messages to users
- Log errors for debugging
- Use try-catch blocks appropriately

### 2. Type Safety
- Use TypeScript interfaces for all data structures
- Validate data at service boundaries
- Use strict type checking

### 3. Performance
- Implement pagination for large datasets
- Use real-time subscriptions sparingly
- Cache frequently accessed data
- Optimize database queries

### 4. Security
- Validate all user inputs
- Use Row Level Security (RLS) policies
- Sanitize data before database operations
- Implement proper authentication checks

### 5. Testing
- Write unit tests for utility functions
- Test API error scenarios
- Mock external dependencies
- Test real-time subscriptions

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check if user is properly authenticated
   - Verify JWT token is valid
   - Check RLS policies

2. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Verify database is active

3. **Real-time Subscription Issues**
   - Check if subscription is properly set up
   - Verify channel name and filters
   - Check for subscription conflicts

4. **Import Errors**
   - Validate file format
   - Check file size limits
   - Verify data structure

### Debug Mode
Enable debug logging by setting:
```env
VITE_DEBUG=true
```

This will provide detailed logging for API calls, authentication, and database operations.

---

For more information, refer to the [Supabase Documentation](https://supabase.com/docs) and [React Documentation](https://react.dev/). 