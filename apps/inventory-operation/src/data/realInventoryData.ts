// Real inventory data based on real products
import { InventoryRecord } from '../types';
import { realProductsData } from './realProductsData';

// Generate sample inventory records based on real products
export const realInventoryRecords: InventoryRecord[] = [
  // Sample inventory for recent dates
  {
    id: 'real-inv-001',
    date: new Date('2024-01-15'),
    productCode: 'TC0001',
    productName: 'Bưởi (đếm trái, dĩa)',
    inputQuantity: 50,
    rawMaterialStock: 120,
    processedStock: 30,
    finishedProductStock: 25,
    rawMaterialUnit: 'trái',
    processedUnit: 'trái',
    finishedProductUnit: 'trái',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'real-inv-002',
    date: new Date('2024-01-16'),
    productCode: 'TC0002',
    productName: 'Cam (đếm trái, miếng)',
    inputQuantity: 100,
    rawMaterialStock: 200,
    processedStock: 80,
    finishedProductStock: 10,
    rawMaterialUnit: 'trái',
    processedUnit: 'trái',
    finishedProductUnit: 'miếng',
    createdAt: new Date('2024-01-16T10:00:00Z'),
    updatedAt: new Date('2024-01-16T10:00:00Z'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'real-inv-003',
    date: new Date('2024-01-17'),
    productCode: 'TA0007',
    productName: 'Chả ram (đếm cây)',
    inputQuantity: 5,
    rawMaterialStock: 15,
    processedStock: 2,
    finishedProductStock: 18,
    rawMaterialUnit: 'gram',
    processedUnit: 'gram',
    finishedProductUnit: 'gram',
    createdAt: new Date('2024-01-17T10:00:00Z'),
    updatedAt: new Date('2024-01-17T10:00:00Z'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'real-inv-004',
    date: new Date('2024-01-18'),
    productCode: 'BIA0002',
    productName: 'Ken lon cao',
    inputQuantity: 24,
    rawMaterialStock: 100,
    processedStock: 50,
    finishedProductStock: 74,
    rawMaterialUnit: 'Lon',
    processedUnit: 'Lon',
    finishedProductUnit: 'Lon',
    createdAt: new Date('2024-01-18T10:00:00Z'),
    updatedAt: new Date('2024-01-18T10:00:00Z'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'real-inv-005',
    date: new Date('2024-01-19'),
    productCode: 'NN0001',
    productName: 'Coca',
    inputQuantity: 48,
    rawMaterialStock: 200,
    processedStock: 100,
    finishedProductStock: 148,
    rawMaterialUnit: 'Lon',
    processedUnit: 'Lon',
    finishedProductUnit: 'Lon',
    createdAt: new Date('2024-01-19T10:00:00Z'),
    updatedAt: new Date('2024-01-19T10:00:00Z'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'real-inv-006',
    date: new Date('2024-01-20'),
    productCode: 'TH0001',
    productName: '555 Việt Nam',
    inputQuantity: 10,
    rawMaterialStock: 50,
    processedStock: 20,
    finishedProductStock: 40,
    rawMaterialUnit: 'gói',
    processedUnit: 'gói',
    finishedProductUnit: 'gói',
    createdAt: new Date('2024-01-20T10:00:00Z'),
    updatedAt: new Date('2024-01-20T10:00:00Z'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'real-inv-007',
    date: new Date('2024-01-21'),
    productCode: 'KH0001',
    productName: 'Khăn lạnh',
    inputQuantity: 30,
    rawMaterialStock: 100,
    processedStock: 50,
    finishedProductStock: 80,
    rawMaterialUnit: 'cái',
    processedUnit: 'cái',
    finishedProductUnit: 'cái',
    createdAt: new Date('2024-01-21T10:00:00Z'),
    updatedAt: new Date('2024-01-21T10:00:00Z'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'real-inv-008',
    date: new Date('2024-01-22'),
    productCode: 'DK0006',
    productName: 'Bánh Mix que',
    inputQuantity: 20,
    rawMaterialStock: 80,
    processedStock: 30,
    finishedProductStock: 70,
    rawMaterialUnit: 'Gói',
    processedUnit: 'Gói',
    finishedProductUnit: 'Gói',
    createdAt: new Date('2024-01-22T10:00:00Z'),
    updatedAt: new Date('2024-01-22T10:00:00Z'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'real-inv-009',
    date: new Date('2024-01-23'),
    productCode: 'TA0042',
    productName: 'Phô mai xông khói',
    inputQuantity: 2,
    rawMaterialStock: 10,
    processedStock: 3,
    finishedProductStock: 9,
    rawMaterialUnit: 'gram',
    processedUnit: 'gram',
    finishedProductUnit: 'gram',
    createdAt: new Date('2024-01-23T10:00:00Z'),
    updatedAt: new Date('2024-01-23T10:00:00Z'),
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'real-inv-010',
    date: new Date('2024-01-24'),
    productCode: 'QT0002',
    productName: 'Túi đựng mỹ phẩm Queen',
    inputQuantity: 5,
    rawMaterialStock: 20,
    processedStock: 8,
    finishedProductStock: 17,
    rawMaterialUnit: 'Cái',
    processedUnit: 'Cái',
    finishedProductUnit: 'Cái',
    createdAt: new Date('2024-01-24T10:00:00Z'),
    updatedAt: new Date('2024-01-24T10:00:00Z'),
    createdBy: 'system',
    updatedBy: 'system'
  }
];

// Function to generate more inventory records based on products
export const generateInventoryFromProducts = (products: any[], count: number = 20): InventoryRecord[] => {
  const records: InventoryRecord[] = [];
  const today = new Date();
  
  for (let i = 0; i < count && i < products.length; i++) {
    const product = products[i];
    const date = new Date(today);
    date.setDate(date.getDate() - (i % 30)); // Generate records for last 30 days
    
    records.push({
      id: `generated-inv-${i + 1}`,
      date,
      productCode: product.businessCode,
      productName: product.name,
      inputQuantity: Math.floor(Math.random() * 100) + 1,
      rawMaterialStock: Math.floor(Math.random() * 200) + 10,
      processedStock: Math.floor(Math.random() * 100) + 5,
      finishedProductStock: Math.floor(Math.random() * 150) + 10,
      rawMaterialUnit: product.inputUnit,
      processedUnit: product.inputUnit,
      finishedProductUnit: product.outputUnit,
      createdAt: date,
      updatedAt: date,
      createdBy: 'system',
      updatedBy: 'system'
    });
  }
  
  return records;
};
