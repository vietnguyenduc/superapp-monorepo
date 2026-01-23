// Simplified mock data for basic testing
import { 
  Product, 
  ProductCategory,
  ProductStatus,
  InventoryVarianceReport 
} from '../types';

// Simplified mock products
export const mockProducts: Product[] = [
  {
    id: 'prod-001',
    businessCode: 'SP001',
    name: 'Cà phê Arabica',
    category: ProductCategory.FINISHED,
    inputUnit: 'kg',
    outputUnit: 'ly',
    inputQuantity: 1,
    outputQuantity: 100,
    isFinishedProduct: true,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin',
    updatedBy: 'admin'
  },
  {
    id: 'prod-002',
    businessCode: 'SP002',
    name: 'Bánh mì sandwich',
    category: ProductCategory.FINISHED,
    inputUnit: 'cái',
    outputUnit: 'phần',
    inputQuantity: 1,
    outputQuantity: 1,
    isFinishedProduct: true,
    status: ProductStatus.ACTIVE,
    businessStatus: 'active',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin',
    updatedBy: 'admin'
  }
];

// Simplified mock variance reports
export const mockVarianceReports: InventoryVarianceReport[] = [
  {
    id: 'var-001',
    date: '2024-01-20',
    product_id: 'prod-001',
    beginning_inventory: 4000,
    inbound_quantity: 5000,
    sales_quantity: 150,
    promotion_quantity: 20,
    special_outbound_quantity: 0,
    book_inventory: 8830,
    actual_inventory: 8500,
    variance: -330,
    variance_percentage: -3.74,
    unit: 'ly',
    notes: 'Chênh lệch nhỏ, có thể do sai số đo lường',
    created_by: 'staff-001',
    updated_by: 'staff-001',
    created_at: '2024-01-20T18:00:00Z',
    updated_at: '2024-01-20T18:00:00Z'
  },
  {
    id: 'var-002',
    date: '2024-01-21',
    product_id: 'prod-002',
    beginning_inventory: 95,
    inbound_quantity: 100,
    sales_quantity: 80,
    promotion_quantity: 5,
    special_outbound_quantity: 0,
    book_inventory: 110,
    actual_inventory: 95,
    variance: -15,
    variance_percentage: -13.64,
    unit: 'phần',
    notes: 'Chênh lệch cao - cần kiểm tra lại quy trình',
    created_by: 'staff-002',
    updated_by: 'staff-002',
    created_at: '2024-01-21T19:00:00Z',
    updated_at: '2024-01-21T19:00:00Z'
  }
];

export const simpleMockData = {
  products: mockProducts,
  varianceReports: mockVarianceReports
};

export default simpleMockData;
