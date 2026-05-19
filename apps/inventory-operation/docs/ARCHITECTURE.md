# Architecture - Inventory Operation System

## System Overview

The Inventory Operation System is a web-based application for managing product catalogs, inventory tracking, sales records, and stock variance detection in food and beverage businesses.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                              │
│  React 18 + TypeScript + Tailwind CSS + Vite               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  databaseService.ts - Business Logic & API Coordination     │
│  - Validation                                                │
│  - Data Transformation                                       │
│  - Error Handling                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                Supabase Client Layer                         │
│  - Authentication (@supabase/auth-js-react)                │
│  - Database Client (@supabase/supabase-js)                │
│  - Real-time Subscriptions                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Backend (PostgreSQL)                   │
│  - Database Tables (RLS Protected)                           │
│  - Stored Functions                                          │
│  - Triggers                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

```
src/
├── components/
│   ├── UI/                  # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   └── Layout/              # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── pages/                   # Page components
│   ├── DashboardPage.tsx
│   ├── ProductCatalogPage.tsx
│   ├── InventoryInputPage.tsx
│   ├── InventoryImport.tsx
│   ├── SalesReportPage.tsx
│   └── SettingsPage.tsx
├── services/
│   ├── databaseService.ts   # Main service layer
│   └── supabase.ts         # Supabase client config
├── types/
│   ├── Product.ts
│   ├── InventoryRecord.ts
│   ├── SalesRecord.ts
│   └── index.ts
├── utils/
│   ├── rbac.ts             # Role-based access control
│   └── formatting.ts       # Data formatting utilities
├── hooks/
│   ├── useAuth.ts          # Authentication hook
│   └── useDatabase.ts      # Database access hook
└── lib/
    └── supabase.ts         # Supabase client initialization
```

## Database Schema

### Core Tables

#### products
Product catalog with conversion ratios for F&B operations.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  businessCode TEXT UNIQUE NOT NULL,  -- Product code
  name TEXT NOT NULL,
  category TEXT NOT NULL,             -- ProductCategory enum
  isFinishedProduct BOOLEAN DEFAULT false,
  outputQuantity NUMERIC,
  inputQuantity NUMERIC,
  inputUnit TEXT,
  outputUnit TEXT,
  status TEXT DEFAULT 'active',        -- ProductStatus enum
  businessStatus TEXT DEFAULT 'active',
  conversions JSONB,                   -- ProductConversion[]
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdBy TEXT,
  updatedBy TEXT
);
```

#### inventory_records
Stock tracking records across multiple stock types.

```sql
CREATE TABLE inventory_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  productCode TEXT NOT NULL,           -- References products.businessCode
  productName TEXT NOT NULL,
  inputQuantity NUMERIC DEFAULT 0,
  rawMaterialStock NUMERIC DEFAULT 0,
  rawMaterialUnit TEXT,
  processedStock NUMERIC DEFAULT 0,
  processedUnit TEXT,
  finishedProductStock NUMERIC DEFAULT 0,
  finishedProductUnit TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdBy TEXT,
  updatedBy TEXT,
  notes TEXT
);
```

#### sales_records
Sales transaction tracking.

```sql
CREATE TABLE sales_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  productCode TEXT NOT NULL,
  productName TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  price NUMERIC NOT NULL,
  totalAmount NUMERIC NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  createdBy TEXT,
  updatedBy TEXT,
  notes TEXT
);
```

#### users
User accounts with role-based permissions.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL,                  -- UserRole enum
  staff_permissions JSONB,             -- Granular permissions
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Relationships

```
products (1) ──< (N) inventory_records
products (1) ──< (N) sales_records
companies (1) ──< (N) branches
branches (1) ──< (N) users
```

## Security Architecture

### Authentication Flow

```
1. User enters credentials
2. Supabase Auth validates
3. JWT token issued
4. Token stored in localStorage
5. Subsequent requests include token
6. RLS policies enforce access based on user ID
```

### Row-Level Security (RLS)

**Policy Pattern:**
```sql
-- User can access their own records
CREATE POLICY user_own_data ON table_name
FOR ALL TO authenticated
USING (auth.uid()::uuid = user_id);

-- Admin can access all records
CREATE POLICY admin_all_data ON table_name
FOR ALL TO authenticated
USING (auth.uid()::uuid IN (SELECT id FROM users WHERE role = 'admin'));
```

### Role-Based Access Control (RBAC)

**Roles:**
- **admin:** Full system access
- **branch_manager:** Branch-level management
- **staff:** Limited operations based on permissions

**Permission Structure:**
```typescript
interface StaffPermissions {
  import_products: boolean;
  import_inventory: boolean;
  view_reports: boolean;
  manage_settings: boolean;
}
```

## Data Flow

### Product Creation Flow

```
UI Form Entry
    ↓
Client Validation
    ↓
databaseService.createProduct()
    ↓
Server-Side Validation
    ↓
Duplicate Check (businessCode)
    ↓
Supabase Insert
    ↓
RLS Policy Check
    ↓
Database Write
    ↓
Return Result
```

### Inventory Import Flow

```
CSV/Excel File Upload
    ↓
File Parsing
    ↓
Row-by-Row Validation
    ↓
Duplicate Check (productCode + date)
    ↓
Foreign Key Check (product exists)
    ↓
Batch Insert (max 200 rows)
    ↓
Error Aggregation
    ↓
Return Import Result
```

## Service Layer Design

### databaseService.ts Architecture

```typescript
class DatabaseService {
  // CRUD Operations
  getProducts(filters?)
  createProduct(product)
  updateProduct(id, product)
  deleteProduct(id)
  
  // Bulk Operations
  bulkInsertProducts(products)
  bulkInsertInventoryRecords(records)
  
  // Validation Helpers
  validateProductData(product)
  validateInventoryRecordData(record)
  
  // Duplicate Checks
  checkProductCodeDuplicate(code)
  checkInventoryRecordDuplicate(code, date)
  
  // Export Operations
  exportProductsToCSV()
  exportInventoryToCSV()
}
```

### Validation Strategy

**Three-Layer Validation:**
1. **Client-Side:** UX feedback, immediate response
2. **Service Layer:** Business logic validation
3. **Database Layer:** Constraint enforcement (RLS, unique constraints)

## State Management

### React State Patterns

**Local State:**
```typescript
const [data, setData] = useState<T[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Global State (Context):**
```typescript
<AuthContext.Provider value={{ user, session }}>
  <App />
</AuthContext.Provider>
```

**Server State (Supabase Real-time):**
```typescript
supabase
  .from('table')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table' }, payload => {
    // Handle real-time updates
  })
  .subscribe();
```

## Error Handling

### Error Types

```typescript
interface AppError {
  type: 'validation' | 'network' | 'auth' | 'database';
  message: string;
  details?: any;
}
```

### Error Handling Pattern

```typescript
try {
  const result = await databaseService.createProduct(data);
  if (result.error) {
    setError(result.error);
    return;
  }
  // Success handling
} catch (error) {
  setError('Unexpected error occurred');
  // Log to monitoring service
}
```

## Performance Considerations

### Bulk Operations
- **Limit:** 200 rows per bulk operation
- **Reasoning:** Prevent timeout and memory issues
- **Strategy:** Batch larger imports into chunks

### Database Indexing
```sql
CREATE INDEX idx_products_business_code ON products(businessCode);
CREATE INDEX idx_inventory_records_product_code ON inventory_records(productCode);
CREATE INDEX idx_inventory_records_date ON inventory_records(date);
```

### Caching Strategy
- **Client:** React Query for data fetching
- **Service:** In-memory cache for reference data
- **Database:** Supabase connection pooling

## Deployment Architecture

### Frontend (Vercel)
```
Git Push → Vercel Build → Deploy → CDN
```

### Backend (Supabase)
```
Supabase Dashboard → Migrations → Database
```

### Environment Variables
```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Monitoring & Observability

### Logging Strategy
- **Client:** Console errors sent to monitoring
- **Service:** Error tracking in databaseService
- **Database:** Supabase logs and query performance

### Health Checks
```typescript
async getHealthStatus() {
  // Database connectivity check
  // Response time measurement
  // Error rate tracking
}
```

## Scalability Considerations

### Horizontal Scaling
- **Frontend:** Stateless, can scale horizontally
- **Backend:** Supabase managed service, auto-scales
- **Database:** PostgreSQL with connection pooling

### Vertical Scaling
- **Frontend:** Optimized bundle size, code splitting
- **Backend:** Efficient queries, proper indexing
- **Database:** Read replicas for reporting queries

## Technology Rationale

### Why Supabase?
- Managed PostgreSQL with built-in features
- Authentication out-of-the-box
- Real-time subscriptions
- Row-Level Security
- Reduced infrastructure overhead

### Why TypeScript?
- Type safety at compile time
- Better IDE support
- Self-documenting code
- Easier refactoring

### Why Tailwind CSS?
- Utility-first approach
- Consistent design system
- Small bundle size
- Rapid development

## Future Architecture Enhancements

### Planned Improvements
1. **GraphQL Layer:** For complex queries
2. **Event Sourcing:** For audit trail
3. **Microservices:** For specialized features
4. **Caching Layer:** Redis for performance
5. **Message Queue:** For async processing

### Migration Path
- Incremental refactoring
- Feature flags for new architecture
- Backward compatibility maintained
- Comprehensive testing at each step
