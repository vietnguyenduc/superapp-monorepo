# Dashboard Enhancements Design Document

## Overview

This document outlines the design for enhancing the inventory-operation dashboard with improved visualizations, transaction concepts, and navigation patterns. The design draws inspiration from the cashflow app's dashboard while adapting to inventory-specific requirements.

## Current State Analysis

### Existing Dashboard (DashboardPageEnhanced.tsx)
**Current Features:**
- Basic metrics cards (total products, active products, inventory value, total sales)
- Time range selector (day, week, month, year)
- Quick action buttons
- Tab system (overview, variance report, export)
- Export menu (Excel, CSV)
- Auto-refresh every 5 minutes

**Limitations:**
- No visual charts or graphs
- Limited transaction history view
- No drill-down capabilities
- Simple metrics without trends
- No product-level insights
- Limited filtering options
- No variance visualization

### Cashflow Dashboard Reference
**Features to Adapt:**
- Rich chart visualizations (line charts, bar charts, pie charts)
- Transaction history with filtering
- Customer-level drill-down
- Trend analysis over time
- Advanced filtering by date range, transaction type
- Export capabilities with templates
- Real-time data updates

## Design Goals

1. **Enhanced Visualization**: Add charts and graphs for better data comprehension
2. **Transaction Concept**: Implement transaction history view similar to cashflow
3. **Improved Navigation**: Better tab system and drill-down capabilities
4. **Advanced Filtering**: More granular filter options
5. **Real-time Updates**: Live data refresh with visual indicators
6. **Product Insights**: Product-level analytics and trends
7. **Variance Visualization**: Visual representation of inventory variances

## Component Design

### 1. Enhanced Metrics Cards

**Current Implementation:**
```typescript
<InventoryMetricsCard
  title="Tổng sản phẩm"
  value={formatNumber(metrics.totalProducts)}
  change={metrics.activeProducts - metrics.totalProducts}
  changeType={metrics.activeProducts >= metrics.totalProducts ? "increase" : "decrease"}
  icon="products"
  color="primary"
/>
```

**Enhanced Design:**
```typescript
interface EnhancedMetricsCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  trend?: number[]; // Array of historical values for sparkline
  sparkline?: boolean; // Show mini chart
  onClick?: () => void; // Drill-down capability
  subtitle?: string; // Additional context
}

// Usage
<EnhancedMetricsCard
  title="Tổng sản phẩm"
  value={formatNumber(metrics.totalProducts)}
  change={12.5} // Percentage change
  changeType="increase"
  icon="products"
  color="primary"
  trend={[100, 105, 110, 115, 120, 125]} // Last 6 periods
  sparkline={true}
  onClick={() => navigate('/product-management')}
  subtitle="Cập nhật 5 phút trước"
/>
```

**Visual Enhancements:**
- Mini sparkline charts showing trends
- Percentage change indicators
- Click-to-drill-down functionality
- Last update timestamp
- Color-coded based on performance

### 2. Chart Components

#### 2.1 Inventory Trend Chart (Line Chart)
**Purpose:** Show inventory levels over time
**Data:** Total inventory, finished products, raw materials
**Time Range:** Day, week, month, year
**Features:**
- Multiple lines for different product categories
- Hover tooltips with details
- Zoom and pan capabilities
- Export as image

```typescript
interface InventoryTrendChartProps {
  data: {
    date: string;
    totalInventory: number;
    finishedProducts: number;
    rawMaterials: number;
  }[];
  timeRange: 'day' | 'week' | 'month' | 'year';
  onPointClick?: (data: any) => void;
}

// Implementation using Recharts or Chart.js
<InventoryTrendChart
  data={inventoryTrendData}
  timeRange={timeRange}
  onPointClick={(data) => showInventoryDetails(data.date)}
/>
```

#### 2.2 Movement Distribution Chart (Pie/Donut Chart)
**Purpose:** Show distribution of inventory movements
**Data:** Import, export, adjustments, transfers
**Features:**
- Donut chart with percentages
- Legend with color coding
- Click segment to filter movements
- Export as image

```typescript
interface MovementDistributionChartProps {
  data: {
    type: 'import' | 'export' | 'adjustment' | 'transfer';
    count: number;
    value: number;
  }[];
  onSegmentClick?: (type: string) => void;
}

<MovementDistributionChart
  data={movementDistribution}
  onSegmentClick={(type) => filterMovementsByType(type)}
/>
```

#### 2.3 Top Products Chart (Bar Chart)
**Purpose:** Show top products by movement or value
**Data:** Product name, movement count, total value
**Features:**
- Horizontal bar chart
- Top 10 products
- Color-coded by category
- Click to view product details

```typescript
interface TopProductsChartProps {
  data: {
    productName: string;
    productCode: string;
    movementCount: number;
    totalValue: number;
    category: string;
  }[];
  metric: 'count' | 'value'; // Show by count or value
  onBarClick?: (product: any) => void;
}

<TopProductsChart
  data={topProducts}
  metric="value"
  onBarClick={(product) => navigate(`/product-management?product=${product.productCode}`)}
/>
```

#### 2.4 Variance Analysis Chart (Bar/Line Combo)
**Purpose:** Visualize inventory variances over time
**Data:** Date, book stock, actual stock, variance
**Features:**
- Combo chart (bar for variance, line for trends)
- Color-coded variance (green = good, red = bad)
- Threshold lines
- Click to view variance report

```typescript
interface VarianceAnalysisChartProps {
  data: {
    date: string;
    bookStock: number;
    actualStock: number;
    variance: number;
  }[];
  threshold: number; // Acceptable variance threshold
  onPointClick?: (data: any) => void;
}

<VarianceAnalysisChart
  data={varianceData}
  threshold={5}
  onPointClick={(data) => showVarianceDetails(data.date)}
/>
```

### 3. Transaction History Component

**Purpose:** Display recent inventory movements with filtering
**Inspiration:** Cashflow transaction list

```typescript
interface TransactionHistoryProps {
  movements: InventoryMovement[];
  loading: boolean;
  onRowClick?: (movement: InventoryMovement) => void;
  onFilterChange?: (filters: MovementFilters) => void;
  onExport?: (format: 'excel' | 'csv') => void;
}

interface MovementFilters {
  dateRange?: { start: string; end: string };
  movementType?: 'import' | 'export' | 'adjustment' | 'transfer';
  productCode?: string;
  branchId?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

// Implementation
<TransactionHistory
  movements={recentMovements}
  loading={loading}
  onRowClick={(movement) => showMovementDetails(movement)}
  onFilterChange={(filters) => applyFilters(filters)}
  onExport={(format) => exportMovements(format)}
/>
```

**Features:**
- Sortable columns (date, product, type, quantity)
- Filter panel with multiple criteria
- Row click for details
- Export filtered results
- Pagination
- Real-time updates indicator

### 4. Enhanced Tab System

**Current Tabs:**
- Tổng quan (Overview)
- Báo cáo lệch kho (Variance Report)
- Xuất file kiểm kho (Export)

**Enhanced Tabs:**
```typescript
interface DashboardTab {
  id: string;
  label: string;
  icon: string;
  content: React.ReactNode;
  badge?: number; // Notification badge
  disabled?: boolean;
}

const dashboardTabs: DashboardTab[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    icon: 'dashboard',
    content: <OverviewContent />,
  },
  {
    id: 'movements',
    label: 'Giao dịch',
    icon: 'transactions',
    content: <TransactionHistory />,
    badge: pendingMovementsCount,
  },
  {
    id: 'analytics',
    label: 'Phân tích',
    icon: 'analytics',
    content: <AnalyticsContent />,
  },
  {
    id: 'variance',
    label: 'Lệch kho',
    icon: 'variance',
    content: <VarianceReport />,
    badge: highVarianceCount,
  },
  {
    id: 'products',
    label: 'Sản phẩm',
    icon: 'products',
    content: <ProductInsights />,
  },
  {
    id: 'export',
    label: 'Xuất báo cáo',
    icon: 'export',
    content: <ExportCenter />,
  },
];
```

**Features:**
- Icon-based navigation
- Notification badges
- Tab persistence (remember last tab)
- Keyboard navigation
- Mobile-responsive tab bar

### 5. Filter Panel Component

**Purpose:** Centralized filtering for dashboard data

```typescript
interface FilterPanelProps {
  filters: DashboardFilters;
  onFilterChange: (filters: DashboardFilters) => void;
  onReset: () => void;
  availableOptions: {
    branches: Branch[];
    productCategories: string[];
    movementTypes: string[];
  };
}

interface DashboardFilters {
  dateRange: 'today' | 'week' | 'month' | 'custom';
  customDateRange?: { start: string; end: string };
  branches: string[];
  productCategories: string[];
  movementTypes: string[];
  minVariance?: number;
  maxVariance?: number;
}

<FilterPanel
  filters={currentFilters}
  onFilterChange={handleFilterChange}
  onReset={resetFilters}
  availableOptions={availableOptions}
/>
```

**Features:**
- Collapsible panel
- Quick presets (today, this week, this month)
- Custom date range picker
- Multi-select for categories
- Filter combinations
- Save filter presets

### 6. Real-time Update Indicator

**Purpose:** Show live data status

```typescript
interface LiveUpdateIndicatorProps {
  lastUpdate: Date;
  isUpdating: boolean;
  onUpdateClick: () => void;
  autoRefresh: boolean;
  onAutoRefreshToggle: (enabled: boolean) => void;
}

<LiveUpdateIndicator
  lastUpdate={lastUpdateTime}
  isUpdating={isRefreshing}
  onUpdateClick={manualRefresh}
  autoRefresh={autoRefreshEnabled}
  onAutoRefreshToggle={setAutoRefreshEnabled}
/>
```

**Visual Design:**
- Green dot when data is fresh
- Pulsing animation when updating
- "Last updated: X minutes ago" text
- Manual refresh button
- Auto-refresh toggle

## Page Layout Design

### Desktop Layout (1200px+)
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Dashboard Tồn Kho  [Time Range] [Export] [Filters] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ │ Metric  │ │ Metric  │ │ Metric  │ │ Metric  │          │
│ │   1     │ │   2     │ │   3     │ │   4     │          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌─────────────────────────┐│
│ │     Trend Chart             │ │  Distribution Chart     ││
│ │     (Full Width)            │ │  (Donut)                ││
│ └─────────────────────────────┘ └─────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │              Transaction History                        │ │
│ │  [Filters] [Export] [Pagination]                        │ │
│ │  ┌───────────────────────────────────────────────────┐ │ │
│ │  │ Row 1 | Row 2 | Row 3 | ...                      │ │ │
│ │  └───────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Tablet Layout (768px-1199px)
```
┌─────────────────────────────────────────┐
│ Header  [Time Range] [Export]            │
├─────────────────────────────────────────┤
│ ┌───────┐ ┌───────┐                    │
│ │Metric │ │Metric │                    │
│ └───────┘ └───────┘                    │
│ ┌───────┐ ┌───────┐                    │
│ │Metric │ │Metric │                    │
│ └───────┘ └───────┘                    │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │        Trend Chart                  │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │      Transaction History            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Mobile Layout (<768px)
```
┌─────────────────────┐
│ Header  [Menu]     │
├─────────────────────┤
│ ┌───────┐           │
│ │Metric │           │
│ └───────┘           │
│ ┌───────┐           │
│ │Metric │           │
│ └───────┘           │
│ ┌───────┐           │
│ │Metric │           │
│ └───────┘           │
│ ┌───────┐           │
│ │Metric │           │
│ └───────┘           │
├─────────────────────┤
│ [Tabs]              │
├─────────────────────┤
│ Tab Content         │
│ (Scrollable)        │
└─────────────────────┘
```

## Data Requirements

### New API Endpoints

#### 1. Dashboard Metrics
```typescript
GET /api/dashboard/metrics
Query Params:
  - timeRange: 'day' | 'week' | 'month' | 'year'
  - branchId?: string
  - companyId?: string

Response:
{
  totalProducts: number;
  activeProducts: number;
  totalInventoryValue: number;
  totalSales: number;
  totalMovements: number;
  pendingMovements: number;
  highVarianceCount: number;
  trends: {
    products: number[];
    inventory: number[];
    movements: number[];
  };
}
```

#### 2. Inventory Trend Data
```typescript
GET /api/dashboard/inventory-trend
Query Params:
  - timeRange: 'day' | 'week' | 'month' | 'year'
  - branchId?: string
  - granularity: 'hour' | 'day' | 'week' | 'month'

Response:
{
  data: Array<{
    date: string;
    totalInventory: number;
    finishedProducts: number;
    rawMaterials: number;
  }>;
}
```

#### 3. Movement Distribution
```typescript
GET /api/dashboard/movement-distribution
Query Params:
  - timeRange: 'day' | 'week' | 'month' | 'year'
  - branchId?: string

Response:
{
  data: Array<{
    type: 'import' | 'export' | 'adjustment' | 'transfer';
    count: number;
    value: number;
  }>;
}
```

#### 4. Top Products
```typescript
GET /api/dashboard/top-products
Query Params:
  - timeRange: 'day' | 'week' | 'month' | 'year'
  - metric: 'count' | 'value'
  - limit: number (default: 10)

Response:
{
  data: Array<{
    productName: string;
    productCode: string;
    movementCount: number;
    totalValue: number;
    category: string;
  }>;
}
```

#### 5. Variance Analysis
```typescript
GET /api/dashboard/variance-analysis
Query Params:
  - timeRange: 'day' | 'week' | 'month' | 'year'
  - branchId?: string

Response:
{
  data: Array<{
    date: string;
    bookStock: number;
    actualStock: number;
    variance: number;
    variancePercentage: number;
  }>;
  threshold: number;
}
```

## Implementation Phases

### Phase 1: Enhanced Metrics (Week 1)
- Create `EnhancedMetricsCard` component
- Add sparkline charts
- Implement trend calculation
- Add click-to-drill-down
- Update existing metrics cards

### Phase 2: Chart Components (Week 2-3)
- Install chart library (Recharts or Chart.js)
- Create `InventoryTrendChart` component
- Create `MovementDistributionChart` component
- Create `TopProductsChart` component
- Create `VarianceAnalysisChart` component
- Implement chart data fetching

### Phase 3: Transaction History (Week 3-4)
- Create `TransactionHistory` component
- Implement filtering panel
- Add sorting capabilities
- Implement pagination
- Add export functionality
- Integrate with existing data

### Phase 4: Enhanced Navigation (Week 4)
- Redesign tab system
- Add notification badges
- Implement tab persistence
- Add keyboard navigation
- Mobile-responsive design

### Phase 5: Real-time Updates (Week 5)
- Create `LiveUpdateIndicator` component
- Implement auto-refresh logic
- Add manual refresh
- Show update status
- Optimize refresh performance

### Phase 6: Polish & Testing (Week 6)
- Responsive design testing
- Performance optimization
- Accessibility improvements
- User acceptance testing
- Bug fixes and refinements

## Technology Stack

### Chart Library Options
1. **Recharts** (Recommended)
   - React-native
   - Declarative API
   - Good documentation
   - Lightweight

2. **Chart.js with react-chartjs-2**
   - More chart types
   - Larger community
   - More configuration options
   - Heavier bundle size

3. **Victory**
   - React-native
   - Good animations
   - Flexible API
   - Moderate learning curve

**Recommendation:** Recharts for React-native design and lightweight bundle

### Additional Dependencies
```json
{
  "recharts": "^2.10.0",
  "date-fns": "^2.30.0", // For date formatting
  "lodash": "^4.17.21", // For data manipulation
  "react-window": "^1.8.8" // For virtualized lists
}
```

## Performance Considerations

### Data Caching
- Cache dashboard metrics for 5 minutes
- Cache chart data for 10 minutes
- Use React Query for data fetching
- Implement stale-while-revalidate strategy

### Chart Performance
- Limit data points to 100 for line charts
- Use virtualization for large datasets
- Lazy load charts when tab is active
- Debounce chart interactions

### Real-time Updates
- Use WebSocket for live updates (optional)
- Throttle refresh to max once per minute
- Show loading indicators during refresh
- Allow users to disable auto-refresh

## Accessibility

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Arrow keys for chart navigation
- Escape to close modals/panels

### Screen Reader Support
- ARIA labels for all interactive elements
- Alt text for charts
- Semantic HTML structure
- Focus indicators

### Color Contrast
- WCAG AA compliant colors
- Color-blind friendly palettes
- High contrast mode support
- Text alternatives for color coding

## Testing Strategy

### Unit Tests
- Test each component in isolation
- Test chart rendering with mock data
- Test filter logic
- Test sorting and pagination

### Integration Tests
- Test data fetching from API
- Test component interactions
- Test navigation flows
- Test real-time updates

### Visual Regression Tests
- Screenshot testing for different screen sizes
- Chart rendering consistency
- Layout testing
- Theme testing

### Performance Tests
- Load time testing
- Chart rendering performance
- Large dataset handling
- Memory leak testing

## Success Metrics

### User Engagement
- Increase dashboard page views by 30%
- Increase time spent on dashboard by 25%
- Increase filter usage by 40%

### Data Insights
- Increase transaction history views by 50%
- Increase chart interactions by 60%
- Increase drill-down usage by 45%

### Performance
- Dashboard load time < 2 seconds
- Chart render time < 500ms
- Auto-refresh overhead < 100ms

## Migration Path

### Step 1: Create New Components
- Create new component files
- Implement with mock data
- Test in isolation

### Step 2: Integrate with Existing Dashboard
- Replace metrics cards gradually
- Add charts as optional features
- Maintain backward compatibility

### Step 3: Data Integration
- Connect to real API endpoints
- Implement caching
- Add error handling

### Step 4: UI Polish
- Responsive design
- Animations
- Loading states
- Error states

### Step 5: Testing & Launch
- Comprehensive testing
- User acceptance testing
- Gradual rollout
- Monitor performance

## Risks & Mitigations

### Risk 1: Performance Degradation
**Mitigation:** Implement caching, lazy loading, data limiting

### Risk 2: Chart Library Compatibility
**Mitigation:** Choose stable library, implement fallbacks

### Risk 3: Data Volume Overload
**Mitigation:** Implement pagination, data aggregation, virtualization

### Risk 4: User Confusion
**Mitigation:** Clear UI labels, onboarding tour, help documentation

## Conclusion

The enhanced dashboard design provides significant improvements over the current implementation by adding visualizations, transaction history, and better navigation. The phased approach allows for incremental delivery while minimizing risk. The design draws from the cashflow app's successful patterns while adapting to inventory-specific requirements.

Key benefits include:
- Better data comprehension through visualizations
- Improved navigation with enhanced tab system
- Real-time insights with live updates
- Deeper analysis with transaction history
- Mobile-responsive design for all devices

The implementation is estimated to take 6 weeks with proper testing and refinement.
