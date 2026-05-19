# API Documentation

> **Merged from:** `API-DOCUMENTATION.md`

## Service Layer

The app uses direct Supabase client SDK calls instead of a REST API layer.

### Key Services (`src/services/`)

| Service | File | Responsibility |
|---------|------|----------------|
| Supabase Client | `supabase.ts` | Configured `createClient` with env vars |
| Database | `database.ts` | All CRUD, search, pagination, import/export, trial mode fallback |
| Auth | `authService.ts` | Sign in/out, session, role checks |

### Common Pattern

```typescript
const { data, error } = await databaseService.customers.getCustomers();
if (error) handleError(error);
```

### Response Shape

```typescript
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}
```

### Auth

- `signIn(email, password)` → `{ data: { user, session }, error }`
- `signOut()` → `{ error }`
- `getCurrentUser()` → `{ data: User | null, error }`

### Database Operations

| Entity | Operations |
|--------|------------|
| Customers | get, getById, create, update, delete, search, import, export |
| Transactions | get, create, update, delete, search, import |
| Branches | get, create, update, delete |
| Transaction Types | get, create, update, delete |
| Settings | get, update |

### TypeScript Types

```typescript
interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone?: string;
  email?: string;
  address?: string;
  company_id: string;
  opening_balance: number;
  current_balance: number;
}

interface Transaction {
  id: string;
  transaction_code: string;
  customer_id: string;
  transaction_type_id: string;
  amount: number;
  description?: string;
  transaction_date: string;
  company_id: string;
}
```

### Real-Time Subscriptions

```typescript
supabase
  .channel('customers')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, callback)
  .subscribe();
```

