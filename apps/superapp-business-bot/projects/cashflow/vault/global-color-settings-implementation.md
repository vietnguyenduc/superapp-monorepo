# Global Color Settings Implementation

## Overview
Implemented a global color settings system stored in the database for transaction types and customer balances. This allows administrators to customize colors through the database instead of hardcoded values in the codebase.

## Date
April 26, 2026

## Skills Used
- **Database Design**: Created JSONB-based color settings table
- **Supabase RLS Policies**: Implemented row-level security for color settings
- **TypeScript**: Type-safe color configuration interfaces
- **React Hooks**: useEffect for async color loading
- **Caching Strategy**: Client-side caching to minimize database calls
- **i18n Translation**: Fixed Vietnamese translation mappings for transaction types

## Artifacts Created

### Database Artifacts
1. **SQL Migration**: `db/create-color-settings-table.sql`
   - Created `color_settings` table with JSONB columns
   - Implemented RLS policies for authenticated users
   - Inserted default color settings

2. **Database Service**: `src/services/database.ts`
   - Added `colorSettingsService` with CRUD operations
   - Methods: `getTransactionTypeColors()`, `getCustomerBalanceColors()`, `updateTransactionTypeColors()`, `updateCustomerBalanceColors()`

### Frontend Artifacts
3. **Color Utilities**: `src/utils/formatting.ts`
   - Added `fetchColorSettings()` for async color loading
   - Added `getTransactionTypeColor()` for transaction type colors
   - Added `getCustomerListBalanceColor()` for customer list balance colors
   - Added `getCustomerDetailBalanceColor()` for customer detail balance colors
   - Implemented caching mechanism to minimize database calls

4. **Updated Components**:
   - `src/pages/Transactions/TransactionList.tsx` - Uses database colors
   - `src/pages/Customers/components/CustomerDetailModal.tsx` - Uses database colors
   - `src/pages/Dashboard/components/RecentTransactions.tsx` - Uses database colors
   - `src/pages/Customers/CustomerDetail.tsx` - Uses database colors

5. **Translation File**: `src/i18n/locales/vi.json`
   - Fixed transaction type label mappings
   - Corrected: payment → "Điều chỉnh giảm", charge → "Điều chỉnh tăng"

## Database Schema

### color_settings Table
```sql
CREATE TABLE color_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Default Settings

#### Transaction Type Colors
```json
{
  "payment": {
    "label": "Điều chỉnh giảm",
    "bg_color": "bg-green-100",
    "text_color": "text-green-800",
    "dark_bg_color": "dark:bg-green-900",
    "dark_text_color": "dark:text-green-200",
    "amount_color": "text-green-600",
    "dark_amount_color": "dark:text-green-400"
  },
  "charge": {
    "label": "Điều chỉnh tăng",
    "bg_color": "bg-red-100",
    "text_color": "text-red-800",
    "dark_bg_color": "dark:bg-red-900",
    "dark_text_color": "dark:text-red-200",
    "amount_color": "text-red-600",
    "dark_amount_color": "dark:text-red-400"
  },
  "adjustment": {
    "label": "Điều chỉnh",
    "bg_color": "bg-blue-100",
    "text_color": "text-blue-800",
    "dark_bg_color": "dark:bg-blue-900",
    "dark_text_color": "dark:text-blue-200",
    "amount_color": "text-blue-600",
    "dark_amount_color": "dark:text-blue-400"
  },
  "refund": {
    "label": "Hoàn tiền",
    "bg_color": "bg-green-100",
    "text_color": "text-green-800",
    "dark_bg_color": "dark:bg-green-900",
    "dark_text_color": "dark:text-green-200",
    "amount_color": "text-green-600",
    "dark_amount_color": "dark:text-green-400"
  }
}
```

#### Customer Balance Colors
```json
{
  "customer_list": {
    "positive_balance_color": "text-black dark:text-white",
    "zero_or_negative_color": "text-green-600 dark:text-green-400"
  },
  "customer_detail": {
    "positive_balance_color": "text-red-600 dark:text-red-400",
    "zero_or_negative_color": "text-green-600 dark:text-green-400"
  }
}
```

## Color Logic

### Transaction Types
- **Payment (Điều chỉnh giảm)**: Green - represents debt reduction
- **Charge (Điều chỉnh tăng)**: Red - represents debt increase
- **Adjustment (Điều chỉnh)**: Blue - represents adjustments
- **Refund (Hoàn tiền)**: Green - represents money returned

### Customer Balances
- **Customer List**:
  - Balance > 0: Black (debt owed)
  - Balance ≤ 0: Green (no debt or credit)
- **Customer Detail**:
  - Balance > 0: Red (debt owed)
  - Balance ≤ 0: Green (no debt or credit)

## Implementation Details

### Caching Strategy
Colors are cached in memory variables:
```typescript
let cachedTransactionColors: any = null;
let cachedBalanceColors: any = null;
```

The `fetchColorSettings()` function is called on component mount to load colors from the database. Fallback hardcoded colors are used if the database is not yet loaded.

### Component Integration
Each component that needs colors:
1. Imports color functions from `formatting.ts`
2. Calls `fetchColorSettings()` in a useEffect on mount
3. Uses `getTransactionTypeColor()` or balance color functions in JSX

### Translation Fixes
Fixed Vietnamese translation mappings in `vi.json`:
- **Before (Incorrect)**:
  - payment: "Điều chỉnh tăng"
  - charge: "Điều chỉnh giảm"
- **After (Correct)**:
  - payment: "Điều chỉnh giảm"
  - charge: "Điều chỉnh tăng"

This fix was applied to 3 locations in the translation file (lines 172-173, 362-363, 381-382).

## Testing Checklist
- [x] Database table created successfully
- [x] Default color settings inserted
- [x] RLS policies working
- [x] Database service methods working
- [x] Color caching working
- [x] Fallback colors working when cache empty
- [x] TransactionList component using database colors
- [x] CustomerDetailModal component using database colors
- [x] RecentTransactions component using database colors
- [x] CustomerDetail component using database colors
- [x] Vietnamese translation labels corrected

## Future Enhancements
- Add admin UI for color settings management
- Add color preview in settings page
- Implement color theme presets
- Add color validation to ensure accessibility
- Support for custom color schemes per user/branch

## Troubleshooting

### Colors not loading
1. Check browser console for "Color settings loaded:" log
2. Verify database connection
3. Check RLS policies allow access
4. Verify `color_settings` table exists

### Labels showing wrong colors
1. Check translation file for correct mappings
2. Verify transaction type values in database
3. Ensure `getTransactionTypeLabel()` returns correct label

### Fallback colors being used
1. This is normal on initial page load
2. Colors should update after `fetchColorSettings()` completes
3. Check console for any errors during color loading

## Related Files
- `db/create-color-settings-table.sql` - Database migration
- `src/services/database.ts` - Database service
- `src/utils/formatting.ts` - Color utility functions
- `src/i18n/locales/vi.json` - Vietnamese translations
- `src/pages/Transactions/TransactionList.tsx` - Transaction list component
- `src/pages/Customers/components/CustomerDetailModal.tsx` - Customer detail modal
- `src/pages/Dashboard/components/RecentTransactions.tsx` - Recent transactions component
- `src/pages/Customers/CustomerDetail.tsx` - Customer detail page
