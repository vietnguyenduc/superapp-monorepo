# Supabase Setup Guide for Inventory Operation

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Click "New Project"
4. Choose organization and enter project details:
   - **Name**: `inventory-operation` (or your preferred name)
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users
5. Wait 2-3 minutes for project initialization

### 2. Get Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` (long string)

### 3. Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste the entire content from:
   ```
   supabase/migrations/20250202000000_inventory_operation_schema.sql
   ```
3. Click **Run** to execute the migration
4. Verify tables are created in **Table Editor**

### 4. Configure Environment

Create `.env.local` file in `apps/inventory-operation/`:

```bash
# Required: Your Supabase credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# App configuration
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
VITE_DEFAULT_LOCALE=vi-VN
VITE_DEFAULT_CURRENCY=VND
VITE_DEFAULT_TIMEZONE=Asia/Ho_Chi_Minh
```

### 5. Test Connection

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Check browser console for connection status
# Should see: "🔗 Supabase client initialized for Inventory Operation"
```

## 📊 Database Schema Overview

### Core Tables Created:

1. **`products`** - Danh mục hàng hóa (Bảng 2)
   - Product categories, codes, units
   - Business status, conversion rates
   - Sample products included

2. **`product_conversions`** - Quy đổi nâng cao
   - Multi-unit conversion rates
   - Flexible conversion paths

3. **`inventory_records`** - Nhập liệu tồn kho (Bảng 1)
   - Daily inventory input/actual quantities
   - Links to products

4. **`sales_records`** - Báo cáo bán hàng (Bảng 3)
   - Sales and promotion quantities
   - Daily sales tracking

5. **`special_outbound_records`** - Xuất đặc biệt (Bảng 3.1)
   - Special outbound with approval workflow
   - Reasons and approval status

6. **`approval_logs`** - Lịch sử phê duyệt
   - Complete audit trail
   - User actions and comments

7. **`inventory_reports`** - Báo cáo nhập xuất tồn (Bảng 4)
   - Book vs actual inventory comparison
   - Variance tracking

8. **`stock_check_prints`** + **`stock_check_items`** - Phiếu kiểm kho (Bảng 5)
   - Stock check forms and items
   - Print management

### Sample Data Included:

- 5 sample products (cam, táo, hạt điều, nước lọc, sinh tố)
- Sample conversions (1 quả cam = 8 miếng)
- Sample inventory records for current date

## 🔧 Advanced Configuration

### Enable Row Level Security (Optional)

```sql
-- Enable RLS for products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy (example)
CREATE POLICY "Users can view products" ON products
    FOR SELECT USING (true);

-- Add more policies as needed for your security requirements
```

### Real-time Subscriptions (Optional)

```sql
-- Enable real-time for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_records;
```

## 🐛 Troubleshooting

### Connection Issues

1. **Check credentials**: Verify URL and key are correct
2. **Network**: Ensure no firewall blocking Supabase
3. **Browser console**: Check for error messages
4. **Test query**: Try simple query in Supabase dashboard

### Migration Issues

1. **SQL errors**: Check syntax in migration file
2. **Permissions**: Ensure you have admin access to project
3. **Existing data**: Drop conflicting tables if needed
4. **Re-run**: Safe to re-run migration (uses IF NOT EXISTS)

### Performance Issues

1. **Indexes**: Migration includes optimized indexes
2. **Query optimization**: Use `select()` with specific fields
3. **Pagination**: Implement for large datasets
4. **Connection pooling**: Supabase handles automatically

## 📈 Production Deployment

### Environment Variables

```bash
# Production environment
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
```

### Security Checklist

- [ ] Enable Row Level Security if needed
- [ ] Configure proper policies
- [ ] Use service role key only on server-side
- [ ] Enable 2FA on Supabase account
- [ ] Monitor usage and set up alerts
- [ ] Regular database backups

### Monitoring

1. **Supabase Dashboard**: Monitor queries, performance
2. **Browser DevTools**: Check network requests
3. **Error tracking**: Implement error reporting
4. **Performance**: Monitor query execution times

## 🎯 Next Steps

1. ✅ Database setup complete
2. ✅ Sample data loaded
3. ✅ App connected and running
4. 🔄 Start using the inventory management features
5. 📊 Monitor performance and optimize as needed
6. 🚀 Deploy to production when ready

---

**Need Help?**
- Check Supabase documentation: [docs.supabase.com](https://docs.supabase.com)
- Review app logs in browser console
- Verify database schema in Supabase Table Editor
