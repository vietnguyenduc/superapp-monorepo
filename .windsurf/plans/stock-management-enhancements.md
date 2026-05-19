# Stock Management Enhancements Design

## Overview

This document outlines the design for enhancing the stock management functionality in the inventory-operation application. The enhancements include mock data generation for testing, advanced variance calculation formulas, and improved stock management workflows.

## Current State Analysis

### Existing Stock Management (InventoryRecordsPage.tsx)

**Current Features:**
- Basic inventory records display
- Simple variance calculation (tonSo vs tonThat)
- Source filtering (book vs actual)
- Variance status filtering
- Basic summary statistics
- Two view modes (operational ledger, accounting summary)

**Limitations:**
- No mock data for testing
- Simple variance formula (only quantity comparison)
- No variance percentage calculation
- No variance threshold alerts
- No variance trend analysis
- No mock data generation for development
- Limited variance reporting
- No special outbound suggestions

### Cashflow Reference

**Features to Adapt:**
- Transaction history with detailed variance tracking
- Variance percentage calculations
- Threshold-based alerts
- Variance trend analysis
- Mock data generation for testing
- Comprehensive variance reporting

## Design Goals

1. **Mock Data Generation**: Create realistic mock data for development and testing
2. **Advanced Variance Formulas**: Implement sophisticated variance calculation logic
3. **Variance Thresholds**: Configurable thresholds for variance alerts
4. **Variance Trends**: Track variance patterns over time
5. **Special Outbound Suggestions**: Recommend actions for high variance items
6. **Stock Level Alerts**: Low stock and overstock warnings
7. **Variance Reporting**: Comprehensive variance analysis reports
8. **Real-time Stock Updates**: Live stock level monitoring

## Variance Calculation Formulas

### Current Formula
```typescript
const variance = tonThat - tonSo;
```

### Enhanced Formulas

#### 1. Quantity Variance
```typescript
// Basic quantity variance
quantityVariance = actualStock - bookStock;

// Percentage variance
percentageVariance = (quantityVariance / bookStock) * 100;

// Absolute variance (always positive)
absoluteVariance = Math.abs(quantityVariance);
```

#### 2. Value Variance
```typescript
// Value variance based on unit cost
valueVariance = quantityVariance * unitCost;

// Percentage value variance
percentageValueVariance = (valueVariance / (bookStock * unitCost)) * 100;
```

#### 3. Weighted Variance
```typescript
// Weighted by product importance
weightedVariance = quantityVariance * productWeight;

// Where productWeight could be:
// - High value items: 2.0
// - Medium value items: 1.0
// - Low value items: 0.5
```

#### 4. Time-Based Variance
```typescript
// Variance rate over time period
varianceRate = quantityVariance / daysSinceLastCount;

// Trend analysis
varianceTrend = (currentVariance - previousVariance) / previousVariance;
```

#### 5. Composite Variance Score
```typescript
// Composite score combining multiple factors
compositeVarianceScore = (
  (percentageVariance * 0.4) +
  (valueVariance * 0.3) +
  (weightedVariance * 0.2) +
  (varianceTrend * 0.1)
);
```

## Mock Data Generation

### Mock Data Structure

```typescript
interface MockInventoryData {
  products: MockProduct[];
  movements: MockMovement[];
  stockCounts: MockStockCount[];
  varianceReports: MockVarianceReport[];
}

interface MockProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  unitCost: number;
  sellingPrice: number;
  weight: number; // For weighted variance
  importance: 'high' | 'medium' | 'low';
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
}

interface MockMovement {
  id: string;
  productId: string;
  type: 'import' | 'export' | 'adjustment' | 'transfer';
  quantity: number;
  date: string;
  source: 'book' | 'actual';
  notes?: string;
}

interface MockStockCount {
  id: string;
  productId: string;
  bookStock: number;
  actualStock: number;
  variance: number;
  percentageVariance: number;
  countDate: string;
  countedBy: string;
}

interface MockVarianceReport {
  id: string;
  reportDate: string;
  totalProducts: number;
  totalVariance: number;
  highVarianceItems: number;
  acceptableVarianceItems: number;
  varianceThreshold: number;
}
```

### Mock Data Generator

```typescript
class MockDataGenerator {
  // Configuration
  config: {
    productCount: number;
    movementCount: number;
    stockCountCount: number;
    dateRange: { start: string; end: string };
    varianceThreshold: number;
  };

  // Product categories
  categories = [
    'Nguyên liệu',
    'Thành phẩm',
    'Bán thành phẩm',
    'Đóng gói',
    'Phụ liệu'
  ];

  // Product names by category
  productNames = {
    'Nguyên liệu': ['Cam', 'Nho', 'Cà phê', 'Trà', 'Sữa', 'Đường', 'Đá'],
    'Thành phẩm': ['Nước cam', 'Nước nho', 'Cà phê đen', 'Trà sữa', 'Sữa chua'],
    'Bán thành phẩm': ['Syrup cam', 'Syrup nho', 'Cà phê phin', 'Trà khô'],
    'Đóng gói': ['Ly nhựa', 'Hộp giấy', 'Túi nilon', 'Nắp chai'],
    'Phụ liệu': ['Muối', 'Mật ong', 'Kem', 'Đậu nành']
  };

  // Generate mock products
  generateProducts(count: number): MockProduct[] {
    const products: MockProduct[] = [];
    
    for (let i = 0; i < count; i++) {
      const category = this.categories[Math.floor(Math.random() * this.categories.length)];
      const names = this.productNames[category] || ['Sản phẩm'];
      const name = names[Math.floor(Math.random() * names.length)];
      
      const importance = Math.random() > 0.7 ? 'high' : 
                        Math.random() > 0.4 ? 'medium' : 'low';
      
      const unitCost = Math.random() * 50000 + 5000; // 5,000 - 55,000 VND
      const sellingPrice = unitCost * (1.5 + Math.random() * 0.5); // 1.5x - 2x markup
      
      products.push({
        id: `PROD${String(i + 1).padStart(4, '0')}`,
        code: `${category.substring(0, 3).toUpperCase()}${String(i + 1).padStart(3, '0')}`,
        name: name,
        category: category,
        unitCost: Math.round(unitCost),
        sellingPrice: Math.round(sellingPrice),
        weight: importance === 'high' ? 2.0 : importance === 'medium' ? 1.0 : 0.5,
        importance: importance,
        minStockLevel: Math.floor(Math.random() * 50) + 10,
        maxStockLevel: Math.floor(Math.random() * 500) + 200,
        reorderPoint: Math.floor(Math.random() * 30) + 20
      });
    }
    
    return products;
  }

  // Generate mock movements
  generateMovements(products: MockProduct[], count: number): MockMovement[] {
    const movements: MockMovement[] = [];
    const { start, end } = this.config.dateRange;
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let i = 0; i < count; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const type = ['import', 'export', 'adjustment', 'transfer'][Math.floor(Math.random() * 4)] as any;
      const source = Math.random() > 0.3 ? 'book' : 'actual';
      
      // Generate random date within range
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      
      // Quantity based on type
      let quantity: number;
      if (type === 'import') {
        quantity = Math.floor(Math.random() * 100) + 10;
      } else if (type === 'export') {
        quantity = -(Math.floor(Math.random() * 50) + 5);
      } else {
        quantity = Math.floor(Math.random() * 20) - 10;
      }
      
      movements.push({
        id: `MOV${String(i + 1).padStart(4, '0')}`,
        productId: product.id,
        type: type,
        quantity: quantity,
        date: randomDate.toISOString().split('T')[0],
        source: source,
        notes: type === 'adjustment' ? 'Kiểm kê điều chỉnh' : undefined
      });
    }
    
    return movements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Generate mock stock counts
  generateStockCounts(products: MockProduct[], count: number): MockStockCount[] {
    const stockCounts: MockStockCount[] = [];
    const { start, end } = this.config.dateRange;
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let i = 0; i < count; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      
      // Generate random date within range
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      
      // Generate book stock (system record)
      const bookStock = Math.floor(Math.random() * 200) + 50;
      
      // Generate actual stock with variance
      const varianceFactor = (Math.random() - 0.5) * 0.3; // -15% to +15% variance
      const actualStock = Math.round(bookStock * (1 + varianceFactor));
      
      const variance = actualStock - bookStock;
      const percentageVariance = (variance / bookStock) * 100;
      
      stockCounts.push({
        id: `SC${String(i + 1).padStart(4, '0')}`,
        productId: product.id,
        bookStock: bookStock,
        actualStock: actualStock,
        variance: variance,
        percentageVariance: Math.round(percentageVariance * 100) / 100,
        countDate: randomDate.toISOString().split('T')[0],
        countedBy: ['Thủ kho A', 'Thủ kho B', 'Kế toán C'][Math.floor(Math.random() * 3)]
      });
    }
    
    return stockCounts.sort((a, b) => new Date(a.countDate).getTime() - new Date(b.countDate).getTime());
  }

  // Generate mock variance reports
  generateVarianceReports(stockCounts: MockStockCount[], count: number): MockVarianceReport[] {
    const reports: MockVarianceReport[] = [];
    const { start, end } = this.config.dateRange;
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Group stock counts by date
    const groupedByDate = stockCounts.reduce((acc, sc) => {
      if (!acc[sc.countDate]) {
        acc[sc.countDate] = [];
      }
      acc[sc.countDate].push(sc);
      return acc;
    }, {} as Record<string, MockStockCount[]>);
    
    const dates = Object.keys(groupedByDate).sort();
    
    for (let i = 0; i < Math.min(count, dates.length); i++) {
      const date = dates[i];
      const counts = groupedByDate[date];
      
      const totalProducts = counts.length;
      const totalVariance = counts.reduce((sum, sc) => sum + Math.abs(sc.variance), 0);
      const highVarianceItems = counts.filter(sc => Math.abs(sc.percentageVariance) > this.config.varianceThreshold).length;
      const acceptableVarianceItems = totalProducts - highVarianceItems;
      
      reports.push({
        id: `VR${String(i + 1).padStart(4, '0')}`,
        reportDate: date,
        totalProducts: totalProducts,
        totalVariance: totalVariance,
        highVarianceItems: highVarianceItems,
        acceptableVarianceItems: acceptableVarianceItems,
        varianceThreshold: this.config.varianceThreshold
      });
    }
    
    return reports;
  }

  // Generate complete mock data
  generate(): MockInventoryData {
    const products = this.generateProducts(this.config.productCount);
    const movements = this.generateMovements(products, this.config.movementCount);
    const stockCounts = this.generateStockCounts(products, this.config.stockCountCount);
    const varianceReports = this.generateVarianceReports(stockCounts, 10);
    
    return {
      products,
      movements,
      stockCounts,
      varianceReports
    };
  }
}
```

## Variance Threshold System

### Threshold Configuration

```typescript
interface VarianceThresholds {
  // Percentage thresholds
  lowVarianceThreshold: number;      // e.g., 5%
  mediumVarianceThreshold: number;   // e.g., 10%
  highVarianceThreshold: number;     // e.g., 20%
  
  // Value thresholds (in VND)
  lowValueThreshold: number;         // e.g., 100,000
  mediumValueThreshold: number;      // e.g., 500,000
  highValueThreshold: number;       // e.g., 1,000,000
  
  // Quantity thresholds
  lowQuantityThreshold: number;      // e.g., 10 units
  mediumQuantityThreshold: number;   // e.g., 50 units
  highQuantityThreshold: number;     // e.g., 100 units
  
  // Product-specific thresholds
  productThresholds: Record<string, {
    percentage: number;
    value: number;
    quantity: number;
  }>;
}

// Default thresholds
const defaultThresholds: VarianceThresholds = {
  lowVarianceThreshold: 5,
  mediumVarianceThreshold: 10,
  highVarianceThreshold: 20,
  lowValueThreshold: 100000,
  mediumValueThreshold: 500000,
  highValueThreshold: 1000000,
  lowQuantityThreshold: 10,
  mediumQuantityThreshold: 50,
  highQuantityThreshold: 100,
  productThresholds: {}
};
```

### Variance Classification

```typescript
interface VarianceClassification {
  level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  severity: 1 | 2 | 3 | 4 | 5;
  color: string;
  actionRequired: boolean;
  suggestedAction?: string;
}

function classifyVariance(
  variance: number,
  percentageVariance: number,
  valueVariance: number,
  thresholds: VarianceThresholds
): VarianceClassification {
  const absPercentage = Math.abs(percentageVariance);
  const absValue = Math.abs(valueVariance);
  
  // Critical variance
  if (absPercentage > thresholds.highVarianceThreshold || 
      absValue > thresholds.highValueThreshold) {
    return {
      level: 'critical',
      severity: 5,
      color: '#dc2626', // red
      actionRequired: true,
      suggestedAction: 'Immediate investigation required. Consider special outbound or stock adjustment.'
    };
  }
  
  // High variance
  if (absPercentage > thresholds.mediumVarianceThreshold || 
      absValue > thresholds.mediumValueThreshold) {
    return {
      level: 'high',
      severity: 4,
      color: '#f97316', // orange
      actionRequired: true,
      suggestedAction: 'Investigate variance cause. Monitor closely in next stock count.'
    };
  }
  
  // Medium variance
  if (absPercentage > thresholds.lowVarianceThreshold || 
      absValue > thresholds.lowValueThreshold) {
    return {
      level: 'medium',
      severity: 3,
      color: '#eab308', // yellow
      actionRequired: false,
      suggestedAction: 'Monitor variance. May indicate counting error or process issue.'
    };
  }
  
  // Low variance
  if (absPercentage > 0) {
    return {
      level: 'low',
      severity: 2,
      color: '#22c55e', // green
      actionRequired: false,
      suggestedAction: 'Acceptable variance within normal range.'
    };
  }
  
  // No variance
  return {
    level: 'none',
    severity: 1,
    color: '#3b82f6', // blue
    actionRequired: false,
    suggestedAction: 'Perfect match between book and actual stock.'
  };
}
```

## Special Outbound Suggestions

### Suggestion Engine

```typescript
interface SpecialOutboundSuggestion {
  productId: string;
  productName: string;
  variance: number;
  percentageVariance: number;
  valueVariance: number;
  classification: VarianceClassification;
  suggestedQuantity: number;
  suggestedReason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedValue: number;
}

function generateSpecialOutboundSuggestion(
  product: MockProduct,
  stockCount: MockStockCount,
  classification: VarianceClassification
): SpecialOutboundSuggestion | null {
  // Only suggest for negative variance (actual < book)
  if (stockCount.variance >= 0) {
    return null;
  }
  
  const absVariance = Math.abs(stockCount.variance);
  const absPercentage = Math.abs(stockCount.percentageVariance);
  const valueVariance = absVariance * product.unitCost;
  
  // Determine priority based on classification
  const priority = classification.level === 'critical' ? 'urgent' :
                   classification.level === 'high' ? 'high' :
                   classification.level === 'medium' ? 'medium' : 'low';
  
  // Generate suggested quantity (adjust for actual stock)
  const suggestedQuantity = Math.min(absVariance, stockCount.actualStock);
  
  // Generate reason
  let suggestedReason = '';
  if (classification.level === 'critical') {
    suggestedReason = `Critical variance of ${absPercentage.toFixed(1)}% detected. Special outbound recommended to align book stock with actual count.`;
  } else if (classification.level === 'high') {
    suggestedReason = `High variance of ${absPercentage.toFixed(1)}% detected. Consider special outbound to correct discrepancy.`;
  } else {
    suggestedReason = `Moderate variance of ${absPercentage.toFixed(1)}% detected. Monitor and consider adjustment if pattern continues.`;
  }
  
  return {
    productId: product.id,
    productName: product.name,
    variance: stockCount.variance,
    percentageVariance: stockCount.percentageVariance,
    valueVariance: valueVariance,
    classification: classification,
    suggestedQuantity: suggestedQuantity,
    suggestedReason: suggestedReason,
    priority: priority,
    estimatedValue: suggestedQuantity * product.unitCost
  };
}
```

## Stock Level Alerts

### Alert Types

```typescript
interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  alertType: 'low_stock' | 'overstock' | 'reorder_needed' | 'out_of_stock';
  currentStock: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction: string;
  createdAt: string;
}

function generateStockAlerts(products: MockProduct[], currentStocks: Record<string, number>): StockAlert[] {
  const alerts: StockAlert[] = [];
  
  products.forEach(product => {
    const currentStock = currentStocks[product.id] || 0;
    
    // Out of stock
    if (currentStock === 0) {
      alerts.push({
        id: `ALERT-${Date.now()}-${product.id}`,
        productId: product.id,
        productName: product.name,
        alertType: 'out_of_stock',
        currentStock: currentStock,
        threshold: 0,
        severity: 'critical',
        message: `${product.name} is out of stock`,
        suggestedAction: 'Immediate restock required. Place urgent order with supplier.',
        createdAt: new Date().toISOString()
      });
    }
    // Low stock
    else if (currentStock <= product.minStockLevel) {
      alerts.push({
        id: `ALERT-${Date.now()}-${product.id}`,
        productId: product.id,
        productName: product.name,
        alertType: 'low_stock',
        currentStock: currentStock,
        threshold: product.minStockLevel,
        severity: 'warning',
        message: `${product.name} is below minimum stock level (${currentStock} < ${product.minStockLevel})`,
        suggestedAction: 'Place order with supplier to replenish stock.',
        createdAt: new Date().toISOString()
      });
    }
    // Reorder needed
    else if (currentStock <= product.reorderPoint) {
      alerts.push({
        id: `ALERT-${Date.now()}-${product.id}`,
        productId: product.id,
        productName: product.name,
        alertType: 'reorder_needed',
        currentStock: currentStock,
        threshold: product.reorderPoint,
        severity: 'info',
        message: `${product.name} has reached reorder point (${currentStock} <= ${product.reorderPoint})`,
        suggestedAction: 'Consider placing order to avoid stockout.',
        createdAt: new Date().toISOString()
      });
    }
    // Overstock
    else if (product.maxStockLevel && currentStock >= product.maxStockLevel) {
      alerts.push({
        id: `ALERT-${Date.now()}-${product.id}`,
        productId: product.id,
        productName: product.name,
        alertType: 'overstock',
        currentStock: currentStock,
        threshold: product.maxStockLevel,
        severity: 'warning',
        message: `${product.name} is over maximum stock level (${currentStock} >= ${product.maxStockLevel})`,
        suggestedAction: 'Consider promotional pricing or reduce future orders.',
        createdAt: new Date().toISOString()
      });
    }
  });
  
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
```

## Variance Trend Analysis

### Trend Calculation

```typescript
interface VarianceTrend {
  productId: string;
  productName: string;
  currentVariance: number;
  previousVariance: number;
  trend: 'improving' | 'worsening' | 'stable';
  trendPercentage: number;
  trendDirection: 'up' | 'down' | 'flat';
  confidence: 'high' | 'medium' | 'low';
  recommendation: string;
}

function calculateVarianceTrend(
  stockCounts: MockStockCount[],
  product: MockProduct
): VarianceTrend | null {
  // Get stock counts for this product, sorted by date
  const productCounts = stockCounts
    .filter(sc => sc.productId === product.id)
    .sort((a, b) => new Date(a.countDate).getTime() - new Date(b.countDate).getTime());
  
  // Need at least 2 data points
  if (productCounts.length < 2) {
    return null;
  }
  
  const current = productCounts[productCounts.length - 1];
  const previous = productCounts[productCounts.length - 2];
  
  const currentAbsVariance = Math.abs(current.variance);
  const previousAbsVariance = Math.abs(previous.variance);
  
  // Calculate trend
  const trendPercentage = previousAbsVariance > 0 
    ? ((currentAbsVariance - previousAbsVariance) / previousAbsVariance) * 100 
    : 0;
  
  // Determine trend direction
  let trendDirection: 'up' | 'down' | 'flat';
  if (Math.abs(trendPercentage) < 5) {
    trendDirection = 'flat';
  } else if (trendPercentage > 0) {
    trendDirection = 'up';
  } else {
    trendDirection = 'down';
  }
  
  // Determine if improving or worsening
  let trend: 'improving' | 'worsening' | 'stable';
  if (trendDirection === 'down') {
    trend = 'improving';
  } else if (trendDirection === 'up') {
    trend = 'worsening';
  } else {
    trend = 'stable';
  }
  
  // Confidence based on number of data points
  const confidence = productCounts.length >= 5 ? 'high' : 
                     productCounts.length >= 3 ? 'medium' : 'low';
  
  // Generate recommendation
  let recommendation = '';
  if (trend === 'worsening' && confidence !== 'low') {
    recommendation = 'Variance is increasing over time. Investigate root cause and implement process improvements.';
  } else if (trend === 'improving') {
    recommendation = 'Variance is decreasing over time. Current processes are working well.';
  } else {
    recommendation = 'Variance is stable. Continue monitoring for any changes.';
  }
  
  return {
    productId: product.id,
    productName: product.name,
    currentVariance: current.variance,
    previousVariance: previous.variance,
    trend: trend,
    trendPercentage: Math.round(trendPercentage * 100) / 100,
    trendDirection: trendDirection,
    confidence: confidence,
    recommendation: recommendation
  };
}
```

## Component Design

### 1. Mock Data Generator Component

```typescript
interface MockDataGeneratorProps {
  onGenerate: (data: MockInventoryData) => void;
  onExport: (data: MockInventoryData, format: 'json' | 'excel') => void;
}

// UI Features:
- Configuration form (product count, movement count, date range)
- Generate button
- Preview generated data
- Export to JSON/Excel
- Save to database option
- Load from database option
```

### 2. Variance Dashboard Component

```typescript
interface VarianceDashboardProps {
  stockCounts: MockStockCount[];
  products: MockProduct[];
  thresholds: VarianceThresholds;
  onThresholdChange: (thresholds: VarianceThresholds) => void;
}

// Features:
- Variance summary cards
- Variance distribution chart
- High variance items list
- Variance trend chart
- Threshold configuration
- Export variance report
```

### 3. Special Outbound Suggestions Component

```typescript
interface SpecialOutboundSuggestionsProps {
  suggestions: SpecialOutboundSuggestion[];
  onCreateOutbound: (suggestion: SpecialOutboundSuggestion) => void;
  onDismiss: (id: string) => void;
}

// Features:
- List of suggestions
- Priority filtering
- Create outbound from suggestion
- Dismiss suggestion
- Export suggestions
- Suggestion history
```

### 4. Stock Alerts Component

```typescript
interface StockAlertsProps {
  alerts: StockAlert[];
  onDismiss: (id: string) => void;
  onAction: (alert: StockAlert) => void;
}

// Features:
- Alert list with severity badges
- Real-time alert updates
- Alert filtering
- Take action button
- Dismiss alert
- Alert history
- Alert configuration
```

### 5. Variance Trend Component

```typescript
interface VarianceTrendProps {
  trends: VarianceTrend[];
  products: MockProduct[];
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange: (range: string) => void;
}

// Features:
- Trend chart per product
- Trend summary table
- Trend filtering
- Export trend report
- Trend comparison
```

## Implementation Phases

### Phase 1: Mock Data Generator (Week 1)
- Create mock data generator class
- Implement product generation
- Implement movement generation
- Implement stock count generation
- Implement variance report generation
- Create UI component
- Test data generation

### Phase 2: Variance Formulas (Week 1-2)
- Implement enhanced variance formulas
- Create variance classification system
- Implement threshold configuration
- Add variance percentage calculation
- Add value variance calculation
- Test formula accuracy

### Phase 3: Variance Dashboard (Week 2)
- Create variance dashboard component
- Implement variance summary cards
- Add variance distribution chart
- Create high variance items list
- Implement threshold configuration UI
- Test dashboard functionality

### Phase 4: Special Outbound Suggestions (Week 2-3)
- Create suggestion engine
- Implement suggestion generation logic
- Create suggestions component
- Add priority filtering
- Implement create outbound from suggestion
- Test suggestion accuracy

### Phase 5: Stock Alerts (Week 3)
- Create stock alert system
- Implement alert generation logic
- Create alerts component
- Add real-time alert updates
- Implement alert actions
- Test alert functionality

### Phase 6: Variance Trends (Week 3-4)
- Implement trend calculation
- Create trend component
- Add trend visualization
- Implement trend filtering
- Add trend comparison
- Test trend analysis

### Phase 7: Integration (Week 4)
- Integrate all components
- Connect to real data
- Implement data persistence
- Add export functionality
- Test complete system

### Phase 8: Polish & Testing (Week 4-5)
- Responsive design testing
- Performance optimization
- Accessibility improvements
- User acceptance testing
- Bug fixes and refinements

### Phase 9: Documentation (Week 5)
- Create user guide
- Add formula documentation
- Update API documentation
- Create mock data guide
- Update help documentation

## Testing Strategy

### Unit Tests
- Test mock data generator
- Test variance formulas
- Test classification logic
- Test suggestion engine
- Test alert generation
- Test trend calculation

### Integration Tests
- Test complete variance workflow
- Test data persistence
- Test component integration
- Test export functionality

### Manual Testing
- Test mock data generation
- Test variance dashboard
- Test special outbound suggestions
- Test stock alerts
- Test variance trends

### Performance Tests
- Test large dataset generation
- Test variance calculation performance
- Test dashboard rendering
- Test real-time alert updates

## Success Metrics

### Data Quality
- Increase variance detection accuracy by 40%
- Reduce false positive alerts by 30%
- Improve trend prediction accuracy by 35%

### User Engagement
- Increase mock data usage for testing by 60%
- Increase variance dashboard usage by 50%
- Increase special outbound creation by 45%

### Efficiency
- Reduce variance investigation time by 50%
- Reduce stockout incidents by 40%
- Improve stock level accuracy by 35%

## Risks & Mitigations

### Risk 1: Mock Data Unrepresentative
**Mitigation:** Configurable generation parameters, real data patterns, validation against real data

### Risk 2: Variance Formula Complexity
**Mitigation:** Clear documentation, formula validation, comparison with manual calculations

### Risk 3: Alert Fatigue
**Mitigation:** Configurable thresholds, alert prioritization, dismissal options

### Risk 4: Trend Analysis Accuracy
**Mitigation:** Sufficient data points, confidence levels, manual review for critical trends

## Conclusion

The stock management enhancements provide significant improvements over the current implementation by adding mock data generation, advanced variance formulas, threshold-based alerts, and trend analysis. These enhancements enable better inventory control, faster issue detection, and more informed decision-making.

Key benefits include:
- Realistic mock data for development and testing
- Sophisticated variance calculation with multiple formulas
- Configurable thresholds for variance alerts
- Special outbound suggestions for high variance items
- Stock level alerts for proactive inventory management
- Variance trend analysis for pattern detection
- Comprehensive variance reporting

The implementation is estimated to take 5 weeks with proper testing and documentation.
