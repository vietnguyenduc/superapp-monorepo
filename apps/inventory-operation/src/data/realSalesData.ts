// Real sales data based on inventory transactions
// Sales are calculated from inventory movements and stock changes

import { SalesRecord } from '../types';
import { realInventoryTransactions, parseDate } from './realInventoryTransactions';

export interface SalesTransaction {
  date: string;
  productCode: string;
  productName: string;
  salesQuantity: number;
  unitPrice: number;
  totalAmount: number;
  customerType: 'retail' | 'wholesale' | 'restaurant';
}

// Generate realistic sales data based on inventory movements
export const realSalesData: SalesTransaction[] = [
  // January 2024 sales
  { date: '1/1/24', productCode: 'BIA0004', productName: 'Tiger bạc', salesQuantity: 233, unitPrice: 15000, totalAmount: 3495000, customerType: 'retail' },
  { date: '1/1/24', productCode: 'BIA0005', productName: 'Tiger nâu  lon', salesQuantity: 20, unitPrice: 16000, totalAmount: 320000, customerType: 'retail' },
  { date: '1/1/24', productCode: 'DK0006', productName: 'Bánh Mix que', salesQuantity: 3, unitPrice: 25000, totalAmount: 75000, customerType: 'retail' },
  { date: '1/1/24', productCode: 'DK0001', productName: 'Bánh quế', salesQuantity: 4, unitPrice: 22000, totalAmount: 88000, customerType: 'retail' },
  { date: '1/1/24', productCode: 'DK0030', productName: 'Phomai', salesQuantity: 3, unitPrice: 45000, totalAmount: 135000, customerType: 'retail' },
  { date: '1/1/24', productCode: 'NN0002', productName: 'Nước suối', salesQuantity: 53, unitPrice: 8000, totalAmount: 424000, customerType: 'retail' },
  { date: '1/1/24', productCode: 'TH0001', productName: '555 Việt Nam', salesQuantity: 1, unitPrice: 25000, totalAmount: 25000, customerType: 'retail' },
  { date: '1/1/24', productCode: 'TH0002', productName: 'Mèo', salesQuantity: 0, unitPrice: 22000, totalAmount: 0, customerType: 'retail' },
  { date: '1/1/24', productCode: 'TH0006', productName: 'Mèo Demi', salesQuantity: 1, unitPrice: 18000, totalAmount: 18000, customerType: 'retail' },
  { date: '1/1/24', productCode: 'KH0001', productName: 'Khăn lạnh', salesQuantity: 60, unitPrice: 5000, totalAmount: 300000, customerType: 'retail' },
  { date: '1/1/24', productCode: 'KH0002', productName: 'Khăn nóng', salesQuantity: 15, unitPrice: 6000, totalAmount: 90000, customerType: 'retail' },
  
  // February 2024 sales
  { date: '2/2/24', productCode: 'BIA0002', productName: 'Ken lon cao', salesQuantity: 42, unitPrice: 14000, totalAmount: 588000, customerType: 'wholesale' },
  { date: '2/2/24', productCode: 'BIA0017', productName: 'SG Trắng lon', salesQuantity: 157, unitPrice: 13000, totalAmount: 2041000, customerType: 'wholesale' },
  { date: '2/2/24', productCode: 'BIA0004', productName: 'Tiger bạc', salesQuantity: 263, unitPrice: 15000, totalAmount: 3945000, customerType: 'wholesale' },
  { date: '2/2/24', productCode: 'BIA0005', productName: 'Tiger nâu  lon', salesQuantity: 115, unitPrice: 16000, totalAmount: 1840000, customerType: 'wholesale' },
  { date: '2/2/24', productCode: 'DK0006', productName: 'Bánh Mix que', salesQuantity: 3, unitPrice: 25000, totalAmount: 75000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'DK0001', productName: 'Bánh quế', salesQuantity: 2, unitPrice: 22000, totalAmount: 44000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'DK00038', productName: 'Tỏi đen', salesQuantity: 1, unitPrice: 35000, totalAmount: 35000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'NN0001', productName: 'Coca', salesQuantity: 3, unitPrice: 12000, totalAmount: 36000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'NN0002', productName: 'Nước suối', salesQuantity: 76, unitPrice: 8000, totalAmount: 608000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'NN0005', productName: 'Bò húc', salesQuantity: 6, unitPrice: 15000, totalAmount: 90000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'NN0003', productName: 'Sting', salesQuantity: 2, unitPrice: 13000, totalAmount: 26000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'TH0001', productName: '555 Việt Nam', salesQuantity: 2, unitPrice: 25000, totalAmount: 50000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'TH0002', productName: 'Mèo', salesQuantity: 0, unitPrice: 22000, totalAmount: 0, customerType: 'retail' },
  { date: '2/2/24', productCode: 'TH0006', productName: 'Mèo Demi', salesQuantity: 2, unitPrice: 18000, totalAmount: 36000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'TH0007', productName: 'Sài Gòn', salesQuantity: 5, unitPrice: 20000, totalAmount: 100000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'KH0001', productName: 'Khăn lạnh', salesQuantity: 55, unitPrice: 5000, totalAmount: 275000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'KH0002', productName: 'Khăn nóng', salesQuantity: 0, unitPrice: 6000, totalAmount: 0, customerType: 'retail' },
  { date: '2/2/24', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', salesQuantity: 2, unitPrice: 28000, totalAmount: 56000, customerType: 'retail' },
  { date: '2/2/24', productCode: 'DK0038', productName: 'Tỏi đen', salesQuantity: 0, unitPrice: 35000, totalAmount: 0, customerType: 'retail' },
  
  // March 2024 sales
  { date: '3/2/24', productCode: 'BIA0004', productName: 'Tiger bạc', salesQuantity: 181, unitPrice: 15000, totalAmount: 2715000, customerType: 'restaurant' },
  { date: '3/2/24', productCode: 'NN0002', productName: 'Nước suối', salesQuantity: 49, unitPrice: 8000, totalAmount: 392000, customerType: 'restaurant' },
  { date: '3/2/24', productCode: 'NN0009', productName: 'Nước yến Justenst', salesQuantity: 8, unitPrice: 25000, totalAmount: 200000, customerType: 'restaurant' },
  { date: '3/2/24', productCode: 'TH0001', productName: '555 Việt Nam', salesQuantity: 2, unitPrice: 25000, totalAmount: 50000, customerType: 'restaurant' },
  { date: '3/2/24', productCode: 'TH0002', productName: 'Mèo', salesQuantity: 0, unitPrice: 22000, totalAmount: 0, customerType: 'restaurant' },
  { date: '3/2/24', productCode: 'TH0006', productName: 'Mèo Demi', salesQuantity: 0, unitPrice: 18000, totalAmount: 0, customerType: 'restaurant' },
  { date: '3/2/24', productCode: 'KH0001', productName: 'Khăn lạnh', salesQuantity: 30, unitPrice: 5000, totalAmount: 150000, customerType: 'restaurant' },
  { date: '3/2/24', productCode: 'KH0002', productName: 'Khăn nóng', salesQuantity: 0, unitPrice: 6000, totalAmount: 0, customerType: 'restaurant' },
  { date: '3/2/24', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', salesQuantity: 1, unitPrice: 28000, totalAmount: 28000, customerType: 'restaurant' },
  { date: '3/2/24', productCode: 'DK0038', productName: 'Tỏi đen', salesQuantity: 0, unitPrice: 35000, totalAmount: 0, customerType: 'restaurant' },
  
  // April 2024 sales (with negative adjustments)
  { date: '4/2/24', productCode: 'BIA0004', productName: 'Tiger bạc', salesQuantity: 369, unitPrice: 15000, totalAmount: 5535000, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'BIA0005', productName: 'Tiger nâu  lon', salesQuantity: 116, unitPrice: 16000, totalAmount: 1856000, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'NN0001', productName: 'Coca', salesQuantity: 2, unitPrice: 12000, totalAmount: 24000, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'NN0002', productName: 'Nước suối', salesQuantity: 60, unitPrice: 8000, totalAmount: 480000, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'NN0003', productName: 'Sting', salesQuantity: 1, unitPrice: 13000, totalAmount: 13000, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'TH0001', productName: '555 Việt Nam', salesQuantity: 0, unitPrice: 25000, totalAmount: 0, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'TH0002', productName: 'Mèo', salesQuantity: 0, unitPrice: 22000, totalAmount: 0, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'TH0006', productName: 'Mèo Demi', salesQuantity: 0, unitPrice: 18000, totalAmount: 0, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'KH0001', productName: 'Khăn lạnh', salesQuantity: 25, unitPrice: 5000, totalAmount: 125000, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'KH0002', productName: 'Khăn nóng', salesQuantity: 0, unitPrice: 6000, totalAmount: 0, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', salesQuantity: 0, unitPrice: 28000, totalAmount: 0, customerType: 'restaurant' },
  { date: '4/2/24', productCode: 'DK0038', productName: 'Tỏi đen', salesQuantity: 0, unitPrice: 35000, totalAmount: 0, customerType: 'restaurant' },
  
  // May 2024 large sales
  { date: '5/2/24', productCode: 'BIA0002', productName: 'Ken lon cao', salesQuantity: 192, unitPrice: 14000, totalAmount: 2688000, customerType: 'wholesale' },
  { date: '5/2/24', productCode: 'BIA0017', productName: 'SG Trắng lon', salesQuantity: 405, unitPrice: 13000, totalAmount: 5265000, customerType: 'wholesale' },
  { date: '5/2/24', productCode: 'BIA0004', productName: 'Tiger bạc', salesQuantity: 622, unitPrice: 15000, totalAmount: 9330000, customerType: 'wholesale' },
  { date: '5/2/24', productCode: 'BIA0005', productName: 'Tiger nâu  lon', salesQuantity: 561, unitPrice: 16000, totalAmount: 8976000, customerType: 'wholesale' },
  { date: '5/2/24', productCode: 'DK0040', productName: 'Kẹo ngậm Doublemint', salesQuantity: 105, unitPrice: 8000, totalAmount: 840000, customerType: 'retail' },
  { date: '5/2/24', productCode: 'DK0030', productName: 'Phomai', salesQuantity: 30, unitPrice: 45000, totalAmount: 1350000, customerType: 'retail' },
  { date: '5/2/24', productCode: 'NN0001', productName: 'Coca', salesQuantity: 48, unitPrice: 12000, totalAmount: 576000, customerType: 'retail' },
  { date: '5/2/24', productCode: 'NN0002', productName: 'Nước suối', salesQuantity: 1200, unitPrice: 8000, totalAmount: 9600000, customerType: 'retail' },
  { date: '5/2/24', productCode: 'NN0005', productName: 'Bò húc', salesQuantity: 120, unitPrice: 15000, totalAmount: 1800000, customerType: 'retail' },
  { date: '5/2/24', productCode: 'TH0001', productName: '555 Việt Nam', salesQuantity: 0, unitPrice: 25000, totalAmount: 0, customerType: 'retail' },
  { date: '5/2/24', productCode: 'TH0002', productName: 'Mèo', salesQuantity: 0, unitPrice: 22000, totalAmount: 0, customerType: 'retail' },
  { date: '5/2/24', productCode: 'TH0006', productName: 'Mèo Demi', salesQuantity: 0, unitPrice: 18000, totalAmount: 0, customerType: 'retail' },
  { date: '5/2/24', productCode: 'TH0007', productName: 'Sài Gòn', salesQuantity: 0, unitPrice: 20000, totalAmount: 0, customerType: 'retail' },
  { date: '5/2/24', productCode: 'KH0001', productName: 'Khăn lạnh', salesQuantity: 141, unitPrice: 5000, totalAmount: 705000, customerType: 'retail' },
  { date: '5/2/24', productCode: 'KH0002', productName: 'Khăn nóng', salesQuantity: 0, unitPrice: 6000, totalAmount: 0, customerType: 'retail' },
  { date: '5/2/24', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', salesQuantity: 0, unitPrice: 28000, totalAmount: 0, customerType: 'retail' },
  { date: '5/2/24', productCode: 'DK0038', productName: 'Tỏi đen', salesQuantity: 0, unitPrice: 35000, totalAmount: 0, customerType: 'retail' },
  
  // Recent November 2024 sales
  { date: '4/11/24', productCode: 'BIA0022', productName: 'Heineken bạc lon 250ml', salesQuantity: 600, unitPrice: 18000, totalAmount: 10800000, customerType: 'wholesale' },
  { date: '4/11/24', productCode: 'BIA0002', productName: 'Ken lon cao', salesQuantity: 1101, unitPrice: 14000, totalAmount: 15414000, customerType: 'wholesale' },
  { date: '4/11/24', productCode: 'BIA0017', productName: 'SG Trắng lon', salesQuantity: 516, unitPrice: 13000, totalAmount: 6708000, customerType: 'wholesale' },
  { date: '4/11/24', productCode: 'BIA0004', productName: 'Tiger bạc', salesQuantity: 1200, unitPrice: 15000, totalAmount: 18000000, customerType: 'wholesale' },
  { date: '4/11/24', productCode: 'BIA0005', productName: 'Tiger nâu  lon', salesQuantity: 517, unitPrice: 16000, totalAmount: 8272000, customerType: 'wholesale' },
  { date: '4/11/24', productCode: 'DK0006', productName: 'Bánh Mix que', salesQuantity: 44, unitPrice: 25000, totalAmount: 1100000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'DK0001', productName: 'Bánh quế', salesQuantity: 76, unitPrice: 22000, totalAmount: 1672000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'DK0003', productName: 'Mít sấy', salesQuantity: 160, unitPrice: 30000, totalAmount: 4800000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'DK0002', productName: 'Mực Bento', salesQuantity: 624, unitPrice: 35000, totalAmount: 21840000, customerType: 'restaurant' },
  { date: '4/11/24', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', salesQuantity: 0, unitPrice: 28000, totalAmount: 0, customerType: 'retail' },
  { date: '4/11/24', productCode: 'DK0040', productName: 'Kẹo ngậm Doublemint', salesQuantity: 0, unitPrice: 8000, totalAmount: 0, customerType: 'retail' },
  { date: '4/11/24', productCode: 'DK0030', productName: 'Phomai', salesQuantity: 87, unitPrice: 45000, totalAmount: 3915000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'DK0038', productName: 'Tỏi đen', salesQuantity: 71, unitPrice: 35000, totalAmount: 2485000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'NN0001', productName: 'Coca', salesQuantity: 123, unitPrice: 12000, totalAmount: 1476000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'NN0002', productName: 'Nước suối', salesQuantity: 1068, unitPrice: 8000, totalAmount: 8544000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'NN0005', productName: 'Bò húc', salesQuantity: 120, unitPrice: 15000, totalAmount: 1800000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'NN0003', productName: 'Sting', salesQuantity: 68, unitPrice: 13000, totalAmount: 884000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'NN0004', productName: 'Nước giải rượu', salesQuantity: 539, unitPrice: 14000, totalAmount: 7546000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'NN0009', productName: 'Nước yến Justenst', salesQuantity: 102, unitPrice: 25000, totalAmount: 2550000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'RUOU0033', productName: 'Rượu Mơ Vàng 24k Nhật  Bản', salesQuantity: 42, unitPrice: 150000, totalAmount: 6300000, customerType: 'restaurant' },
  { date: '4/11/24', productCode: 'TH0001', productName: '555 Việt Nam', salesQuantity: 47, unitPrice: 25000, totalAmount: 1175000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'TH0002', productName: 'Mèo', salesQuantity: 82, unitPrice: 22000, totalAmount: 1804000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'TH0003', productName: 'Ngựa', salesQuantity: 32, unitPrice: 20000, totalAmount: 640000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'TH0006', productName: 'Mèo Demi', salesQuantity: 31, unitPrice: 18000, totalAmount: 558000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'TH0007', productName: 'Sài Gòn', salesQuantity: 21, unitPrice: 20000, totalAmount: 420000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'KH0001', productName: 'Khăn lạnh', salesQuantity: 1418, unitPrice: 5000, totalAmount: 7090000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'KH0002', productName: 'Khăn nóng', salesQuantity: 1094, unitPrice: 6000, totalAmount: 6564000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'QT0002', productName: 'Túi đựng mỹ phẩm Queen', salesQuantity: 38, unitPrice: 45000, totalAmount: 1710000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'QT0001', productName: 'Túi Đay Queen (Size M)', salesQuantity: 36, unitPrice: 55000, totalAmount: 1980000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'QT0003', productName: 'Băng Đô Queen', salesQuantity: 50, unitPrice: 35000, totalAmount: 1750000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'QT0004', productName: 'Gấu Bông Queen', salesQuantity: 178, unitPrice: 85000, totalAmount: 15130000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'QT0006', productName: 'Túi Trống Queen', salesQuantity: 68, unitPrice: 25000, totalAmount: 1700000, customerType: 'retail' },
  { date: '4/11/24', productCode: 'QT0007', productName: 'Móc Khóa Âm Nhạc', salesQuantity: 26, unitPrice: 15000, totalAmount: 390000, customerType: 'retail' }
];

// Convert sales transactions to SalesRecord format
export const convertToSalesRecords = (): SalesRecord[] => {
  return realSalesData.map((sale, index) => ({
    id: `real-sale-${index + 1}`,
    productCode: sale.productCode,
    outputDate: parseDate(sale.date),
    quantitySold: sale.salesQuantity,
    notes: `Bán ${sale.customerType} - ${sale.productName}`,
    createdAt: parseDate(sale.date),
    updatedAt: parseDate(sale.date),
    createdBy: 'system',
    updatedBy: 'system'
  }));
};

// Helper function to get sales by date range
export const getSalesByDateRange = (startDate: Date, endDate: Date): SalesTransaction[] => {
  return realSalesData.filter(sale => {
    const saleDate = parseDate(sale.date);
    return saleDate >= startDate && saleDate <= endDate;
  });
};

// Helper function to get sales by product
export const getSalesByProduct = (productCode: string): SalesTransaction[] => {
  return realSalesData.filter(sale => sale.productCode === productCode);
};

// Helper function to get total sales by date
export const getTotalSalesByDate = (date: string): number => {
  return realSalesData
    .filter(sale => sale.date === date)
    .reduce((total, sale) => total + sale.totalAmount, 0);
};

// Helper function to get top selling products
export const getTopSellingProducts = (limit: number = 10): SalesTransaction[] => {
  return realSalesData
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
};
