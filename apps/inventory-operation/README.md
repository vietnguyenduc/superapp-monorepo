# Inventory Operation App - Quản Lý Xuất Nhập Tồn F&B

> Web App quản lý xuất nhập tồn kho nguyên vật liệu cho ngành F&B (trái cây, đồ khô)

## 🚀 Tính năng chính

- **📊 Nhập liệu tồn kho** (Bảng 1): Quản lý nhập kho, tồn thực tế với kết nối Supabase thực tế
- **📋 Danh mục hàng hóa** (Bảng 2): Quản lý sản phẩm, định mức, quy đổi thông minh
- **📈 Báo cáo bán hàng** (Bảng 3): Nhập liệu bán hàng, xuất khuyến mãi
- **⚙️ Xuất đặc biệt** (Bảng 3.1): Quy trình phê duyệt xuất đặc biệt
- **📉 Báo cáo nhập xuất tồn** (Bảng 4): So sánh tồn sổ và tồn thực
- **📝 Phiếu kiểm kho** (Bảng 5): Xuất phiếu kiểm kho và báo cáo chi tiết
- **🔄 Quy đổi thông minh**: Engine quy đổi đa đơn vị với pathfinding
- **📝 Lịch sử thay đổi**: Theo dõi toàn bộ thao tác trên dữ liệu
- **Dashboard**: Thống kê, biểu đồ, lịch sử thao tác
- **Phân quyền**: Thủ kho, kế toán, quản lý, admin

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with Apple-inspired design
- **State Management**: React Hooks + Custom hooks
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Database**: PostgreSQL with advanced indexing
- **Authentication**: Supabase Auth (ready for future use)
- **UI Components**: Custom components with Tailwind
- **Icons**: Emoji + Custom SVG
- **Development**: ESLint + Prettier + Vitest
- **Deployment**: Netlify/Vercel ready

## 📦 Getting Started

### 1. Setup Supabase Database

**Create Supabase Project:**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your project URL and anon key from Settings > API
3. Run the database migration:
   ```sql
   -- Copy and run the SQL from:
   -- supabase/migrations/20250202000000_inventory_operation_schema.sql
   ```

### 2. Install and Configure

```bash
# Clone and navigate
git clone <repository-url>
cd superapp-monorepo/apps/inventory-operation

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
```

**Configure .env.local:**
```bash
# Required: Your Supabase credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# App configuration
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
```

### 3. Start Development

```bash
# Start dev server
npm run dev

# Open browser at http://localhost:5174
```

### 4. Verify Connection

The app will automatically:
- Test database connection on startup
- Load sample data if available
- Show connection status in debug mode

## 📁 Cấu trúc thư mục

```
src/
├── pages/              # Các trang chính
│   ├── DashboardPage.tsx
│   ├── InventoryInputPage.tsx
│   ├── ProductCatalogPage.tsx
│   ├── SalesReportPage.tsx
│   ├── SpecialOutboundPage.tsx
│   ├── InventoryReportPage.tsx
│   ├── StockCheckPrintPage.tsx
│   └── SettingsPage.tsx
├── components/         # UI components
├── hooks/             # Custom hooks
├── utils/             # Utility functions
├── types/             # TypeScript types
├── styles/            # CSS/styling files
└── App.tsx            # Main app component
```

## 🎨 UI Design System

- **Typography**: Inter font family
- **Colors**: Blue primary palette, gray neutrals
- **Components**: Apple-style buttons, cards, forms
- **Responsive**: Mobile-first design

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run type-check   # TypeScript type checking
```

## 📊 Các bảng dữ liệu chính

- **Bảng 1**: Nhập liệu tồn kho (ngày, mã món, nhập, tồn thực)
- **Bảng 2**: Danh mục hàng hóa (định mức, quy đổi, đơn vị)
- **Bảng 3**: Báo cáo bán hàng (mã SP, ngày xuất, số lượng)
- **Bảng 3.1**: Xuất đặc biệt (approval flow, lý do, trạng thái)
- **Bảng 4**: Báo cáo nhập xuất tồn (so sánh, chênh lệch)
- **Bảng 5.1/5.2**: Phiếu kiểm kho (tổng quan, lệch kho)

## 🔐 Phân quyền

- **Thủ kho**: Nhập liệu, xem báo cáo
- **Kế toán kho**: Nhập bán hàng, duyệt xuất đặc biệt
- **Quản lý**: Duyệt tất cả, xem dashboard
- **Admin**: Quản lý hệ thống, cấu hình

## 🚀 Deployment

App này được thiết kế để chạy độc lập trong môi trường Turborepo monorepo.
Có thể deploy riêng lẻ hoặc tích hợp vào superapp tổng thể.

---

**Phát triển bởi**: Superapp Monorepo Team  
**Phiên bản**: 0.1.0  
**Cập nhật**: 2025
