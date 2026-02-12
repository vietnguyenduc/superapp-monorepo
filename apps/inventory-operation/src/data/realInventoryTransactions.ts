// Real inventory transaction data from actual warehouse operations
// Format: Ngày | Mã món | Tên hàng | Nhập mua | Tồn thực | Đền hàng

export interface InventoryTransaction {
  date: string;
  productCode: string;
  productName: string;
  inputQuantity: number;
  actualStock: number;
  compensation: number;
}

export const realInventoryTransactions: InventoryTransaction[] = [
  // Sample data from the provided data
  { date: '31/12/23', productCode: 'BIA0002', productName: 'Ken lon cao', inputQuantity: 0, actualStock: 1163, compensation: 0 },
  { date: '31/12/23', productCode: 'BIA0017', productName: 'SG Trắng lon', inputQuantity: 0, actualStock: 778, compensation: 0 },
  { date: '31/12/23', productCode: 'BIA0004', productName: 'Tiger bạc', inputQuantity: 0, actualStock: 2709, compensation: 0 },
  { date: '31/12/23', productCode: 'BIA0005', productName: 'Tiger nâu  lon', inputQuantity: 0, actualStock: 733, compensation: 0 },
  { date: '31/12/23', productCode: 'DK0006', productName: 'Bánh Mix que', inputQuantity: 0, actualStock: 136, compensation: 0 },
  { date: '31/12/23', productCode: 'DK0001', productName: 'Bánh quế', inputQuantity: 0, actualStock: 101, compensation: 0 },
  { date: '31/12/23', productCode: 'DK0003', productName: 'Mít sấy', inputQuantity: 0, actualStock: 157, compensation: 0 },
  { date: '31/12/23', productCode: 'DK0002', productName: 'Mực Bento', inputQuantity: 0, actualStock: 401, compensation: 0 },
  { date: '31/12/23', productCode: 'DK0005', productName: 'Trái cây sấy', inputQuantity: 0, actualStock: 123, compensation: 0 },
  { date: '31/12/23', productCode: 'DK0040', productName: 'Kẹo ngậm Doublemint', inputQuantity: 0, actualStock: 150, compensation: 0 },
  { date: '31/12/23', productCode: 'DK0027', productName: 'Kẹo Xylitol', inputQuantity: 0, actualStock: 24, compensation: 0 },
  { date: '31/12/23', productCode: 'DK0030', productName: 'Phomai', inputQuantity: 0, actualStock: 90, compensation: 0 },
  { date: '31/12/23', productCode: 'NN0001', productName: 'Coca', inputQuantity: 0, actualStock: 65, compensation: 0 },
  { date: '31/12/23', productCode: 'NN0002', productName: 'Nước suối', inputQuantity: 0, actualStock: 668, compensation: 0 },
  { date: '31/12/23', productCode: 'NN0005', productName: 'Bò húc', inputQuantity: 0, actualStock: 137, compensation: 0 },
  { date: '31/12/23', productCode: 'NN0003', productName: 'Sting', inputQuantity: 0, actualStock: 59, compensation: 0 },
  { date: '31/12/23', productCode: 'NN0004', productName: 'Nước giải rượu', inputQuantity: 0, actualStock: 134, compensation: 0 },
  { date: '31/12/23', productCode: 'NN0009', productName: 'Nước yến Justenst', inputQuantity: 0, actualStock: 61, compensation: 0 },
  { date: '31/12/23', productCode: 'TH0001', productName: '555 Việt Nam', inputQuantity: 0, actualStock: 76, compensation: 0 },
  { date: '31/12/23', productCode: 'TH0002', productName: 'Mèo', inputQuantity: 0, actualStock: 33, compensation: 0 },
  { date: '31/12/23', productCode: 'TH0003', productName: 'Ngựa', inputQuantity: 0, actualStock: 9, compensation: 0 },
  { date: '31/12/23', productCode: 'TH0006', productName: 'Mèo Demi', inputQuantity: 0, actualStock: 32, compensation: 0 },
  { date: '31/12/23', productCode: 'TH0007', productName: 'Sài Gòn', inputQuantity: 0, actualStock: 19, compensation: 0 },
  { date: '31/12/23', productCode: 'KH0001', productName: 'Khăn lạnh', inputQuantity: 0, actualStock: 2403, compensation: 0 },
  { date: '31/12/23', productCode: 'KH0002', productName: 'Khăn nóng', inputQuantity: 0, actualStock: 1322, compensation: 0 },
  { date: '31/12/23', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', inputQuantity: 0, actualStock: 154, compensation: 0 },
  { date: '31/12/23', productCode: 'DK0038', productName: 'Tỏi đen', inputQuantity: 0, actualStock: 126, compensation: 0 },
  
  // January 2024 data with transactions
  { date: '1/1/24', productCode: 'BIA0002', productName: 'Ken lon cao', inputQuantity: 0, actualStock: 1127, compensation: 0 },
  { date: '1/1/24', productCode: 'BIA0017', productName: 'SG Trắng lon', inputQuantity: 0, actualStock: 746, compensation: 0 },
  { date: '1/1/24', productCode: 'BIA0004', productName: 'Tiger bạc', inputQuantity: 0, actualStock: 2476, compensation: 0 },
  { date: '1/1/24', productCode: 'BIA0005', productName: 'Tiger nâu  lon', inputQuantity: 0, actualStock: 713, compensation: 0 },
  
  // Sample transactions with actual input
  { date: '5/1/24', productCode: 'BIA0004', productName: 'Tiger bạc', inputQuantity: 1200, actualStock: 2954, compensation: 0 },
  { date: '5/1/24', productCode: 'TH0002', productName: 'Mèo', inputQuantity: 30, actualStock: 57, compensation: 0 },
  { date: '5/1/24', productCode: 'TH0006', productName: 'Mèo Demi', inputQuantity: 50, actualStock: 77, compensation: 0 },
  { date: '5/1/24', productCode: 'DK0040', productName: 'Kẹo ngậm Doublemint', inputQuantity: 105, actualStock: 159, compensation: 0 },
  { date: '5/1/24', productCode: 'DK0030', productName: 'Phomai', inputQuantity: 30, actualStock: 80, compensation: 0 },
  { date: '5/1/24', productCode: 'NN0005', productName: 'Bò húc', inputQuantity: 120, actualStock: 189, compensation: 0 },
  { date: '5/1/24', productCode: 'TH0001', productName: '555 Việt Nam', inputQuantity: 0, actualStock: 39, compensation: 0 },
  { date: '5/1/24', productCode: 'TH0002', productName: 'Mèo', inputQuantity: 0, actualStock: 42, compensation: 0 },
  { date: '5/1/24', productCode: 'TH0006', productName: 'Mèo Demi', inputQuantity: 0, actualStock: 35, compensation: 0 },
  { date: '5/1/24', productCode: 'TH0007', productName: 'Sài Gòn', inputQuantity: 0, actualStock: 16, compensation: 0 },
  
  // February 2024 transactions
  { date: '2/2/24', productCode: 'BIA0002', productName: 'Ken lon cao', inputQuantity: 0, actualStock: 618, compensation: 0 },
  { date: '2/2/24', productCode: 'BIA0017', productName: 'SG Trắng lon', inputQuantity: 0, actualStock: 501, compensation: 0 },
  { date: '2/2/24', productCode: 'BIA0004', productName: 'Tiger bạc', inputQuantity: 0, actualStock: 2049, compensation: 0 },
  { date: '2/2/24', productCode: 'BIA0005', productName: 'Tiger nâu  lon', inputQuantity: 0, actualStock: 584, compensation: 0 },
  { date: '2/2/24', productCode: 'NN0001', productName: 'Coca', inputQuantity: 24, actualStock: 82, compensation: 0 },
  { date: '2/2/24', productCode: 'NN0002', productName: 'Nước suối', inputQuantity: 0, actualStock: 406, compensation: 0 },
  { date: '2/2/24', productCode: 'NN0005', productName: 'Bò húc', inputQuantity: 0, actualStock: 172, compensation: 0 },
  { date: '2/2/24', productCode: 'NN0003', productName: 'Sting', inputQuantity: 0, actualStock: 93, compensation: 0 },
  { date: '2/2/24', productCode: 'NN0004', productName: 'Nước giải rượu', inputQuantity: 0, actualStock: 362, compensation: 0 },
  { date: '2/2/24', productCode: 'NN0009', productName: 'Nước yến Justenst', inputQuantity: 0, actualStock: 79, compensation: 0 },
  { date: '2/2/24', productCode: 'TH0001', productName: '555 Việt Nam', inputQuantity: 0, actualStock: 60, compensation: 0 },
  { date: '2/2/24', productCode: 'TH0002', productName: 'Mèo', inputQuantity: 0, actualStock: 65, compensation: 0 },
  { date: '2/2/24', productCode: 'TH0003', productName: 'Ngựa', inputQuantity: 0, actualStock: 23, compensation: 0 },
  { date: '2/2/24', productCode: 'TH0006', productName: 'Mèo Demi', inputQuantity: 0, actualStock: 45, compensation: 0 },
  { date: '2/2/24', productCode: 'TH0007', productName: 'Sài Gòn', inputQuantity: 20, actualStock: 32, compensation: 0 },
  { date: '2/2/24', productCode: 'KH0001', productName: 'Khăn lạnh', inputQuantity: 0, actualStock: 2331, compensation: 0 },
  { date: '2/2/24', productCode: 'KH0002', productName: 'Khăn nóng', inputQuantity: 0, actualStock: 834, compensation: 0 },
  { date: '2/2/24', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', inputQuantity: 0, actualStock: 75, compensation: 0 },
  { date: '2/2/24', productCode: 'DK0038', productName: 'Tỏi đen', inputQuantity: 0, actualStock: 89, compensation: 0 },
  
  // March 2024 with negative transactions (adjustments)
  { date: '3/2/24', productCode: 'BIA0004', productName: 'Tiger bạc', inputQuantity: 24, actualStock: 1868, compensation: 0 },
  { date: '3/2/24', productCode: 'NN0002', productName: 'Nước suối', inputQuantity: 240, actualStock: 537, compensation: 0 },
  { date: '3/2/24', productCode: 'NN0009', productName: 'Nước yến Justenst', inputQuantity: 96, actualStock: 171, compensation: 0 },
  { date: '3/2/24', productCode: 'TH0001', productName: '555 Việt Nam', inputQuantity: 0, actualStock: 58, compensation: 0 },
  { date: '3/2/24', productCode: 'TH0002', productName: 'Mèo', inputQuantity: 0, actualStock: 64, compensation: 0 },
  { date: '3/2/24', productCode: 'TH0003', productName: 'Ngựa', inputQuantity: 0, actualStock: 23, compensation: 0 },
  { date: '3/2/24', productCode: 'TH0006', productName: 'Mèo Demi', inputQuantity: 0, actualStock: 45, compensation: 0 },
  { date: '3/2/24', productCode: 'TH0007', productName: 'Sài Gòn', inputQuantity: 0, actualStock: 32, compensation: 0 },
  { date: '3/2/24', productCode: 'KH0001', productName: 'Khăn lạnh', inputQuantity: 0, actualStock: 2301, compensation: 0 },
  { date: '3/2/24', productCode: 'KH0002', productName: 'Khăn nóng', inputQuantity: 0, actualStock: 834, compensation: 0 },
  { date: '3/2/24', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', inputQuantity: 0, actualStock: 71, compensation: 0 },
  { date: '3/2/24', productCode: 'DK0038', productName: 'Tỏi đen', inputQuantity: 0, actualStock: 89, compensation: 0 },
  
  // April 2024 with negative adjustments
  { date: '4/2/24', productCode: 'BIA0004', productName: 'Tiger bạc', inputQuantity: -138, actualStock: 1699, compensation: 0 },
  { date: '4/2/24', productCode: 'BIA0005', productName: 'Tiger nâu  lon', inputQuantity: 0, actualStock: 552, compensation: 0 },
  { date: '4/2/24', productCode: 'NN0001', productName: 'Coca', inputQuantity: -24, actualStock: 55, compensation: 0 },
  { date: '4/2/24', productCode: 'NN0002', productName: 'Nước suối', inputQuantity: -39, actualStock: 326, compensation: 0 },
  { date: '4/2/24', productCode: 'NN0003', productName: 'Sting', inputQuantity: -24, actualStock: 67, compensation: 0 },
  { date: '4/2/24', productCode: 'NN0004', productName: 'Nước giải rượu', inputQuantity: 0, actualStock: 361, compensation: 0 },
  { date: '4/2/24', productCode: 'NN0009', productName: 'Nước yến Justenst', inputQuantity: 0, actualStock: 171, compensation: 0 },
  { date: '4/2/24', productCode: 'TH0001', productName: '555 Việt Nam', inputQuantity: 0, actualStock: 58, compensation: 0 },
  { date: '4/2/24', productCode: 'TH0002', productName: 'Mèo', inputQuantity: 0, actualStock: 64, compensation: 0 },
  { date: '4/2/24', productCode: 'TH0003', productName: 'Ngựa', inputQuantity: 0, actualStock: 23, compensation: 0 },
  { date: '4/2/24', productCode: 'TH0006', productName: 'Mèo Demi', inputQuantity: 0, actualStock: 40, compensation: 0 },
  { date: '4/2/24', productCode: 'TH0007', productName: 'Sài Gòn', inputQuantity: 0, actualStock: 32, compensation: 0 },
  { date: '4/2/24', productCode: 'KH0001', productName: 'Khăn lạnh', inputQuantity: 0, actualStock: 2276, compensation: 0 },
  { date: '4/2/24', productCode: 'KH0002', productName: 'Khăn nóng', inputQuantity: 0, actualStock: 833, compensation: 0 },
  { date: '4/2/24', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', inputQuantity: 0, actualStock: 70, compensation: 0 },
  { date: '4/2/24', productCode: 'DK0038', productName: 'Tỏi đen', inputQuantity: 0, actualStock: 89, compensation: 0 },
  
  // May 2024 large transactions
  { date: '5/2/24', productCode: 'BIA0002', productName: 'Ken lon cao', inputQuantity: 48, actualStock: 666, compensation: 0 },
  { date: '5/2/24', productCode: 'BIA0017', productName: 'SG Trắng lon', inputQuantity: 480, actualStock: 975, compensation: 0 },
  { date: '5/2/24', productCode: 'BIA0004', productName: 'Tiger bạc', inputQuantity: 3600, actualStock: 5126, compensation: 0 },
  { date: '5/2/24', productCode: 'BIA0005', productName: 'Tiger nâu  lon', inputQuantity: 720, actualStock: 1228, compensation: 0 },
  { date: '5/2/24', productCode: 'DK0006', productName: 'Bánh Mix que', inputQuantity: 0, actualStock: 181, compensation: 0 },
  { date: '5/2/24', productCode: 'DK0001', productName: 'Bánh quế', inputQuantity: 0, actualStock: 128, compensation: 0 },
  { date: '5/2/24', productCode: 'DK0003', productName: 'Mít sấy', inputQuantity: 0, actualStock: 90, compensation: 0 },
  { date: '5/2/24', productCode: 'DK0002', productName: 'Mực Bento', inputQuantity: 0, actualStock: 361, compensation: 0 },
  { date: '5/2/24', productCode: 'DK0005', productName: 'Trái cây sấy', inputQuantity: 0, actualStock: 87, compensation: 0 },
  { date: '5/2/24', productCode: 'DK0040', productName: 'Kẹo ngậm Doublemint', inputQuantity: 150, actualStock: 274, compensation: 0 },
  { date: '5/2/24', productCode: 'DK0030', productName: 'Phomai', inputQuantity: 0, actualStock: 64, compensation: 0 },
  { date: '5/2/24', productCode: 'NN0001', productName: 'Coca', inputQuantity: 48, actualStock: 103, compensation: 0 },
  { date: '5/2/24', productCode: 'NN0002', productName: 'Nước suối', inputQuantity: 1200, actualStock: 1504, compensation: 0 },
  { date: '5/2/24', productCode: 'NN0005', productName: 'Bò húc', inputQuantity: 0, actualStock: 169, compensation: 0 },
  { date: '5/2/24', productCode: 'NN0003', productName: 'Sting', inputQuantity: 0, actualStock: 67, compensation: 0 },
  { date: '5/2/24', productCode: 'NN0004', productName: 'Nước giải rượu', inputQuantity: 0, actualStock: 360, compensation: 0 },
  { date: '5/2/24', productCode: 'NN0009', productName: 'Nước yến Justenst', inputQuantity: 0, actualStock: 171, compensation: 0 },
  { date: '5/2/24', productCode: 'TH0001', productName: '555 Việt Nam', inputQuantity: 0, actualStock: 58, compensation: 0 },
  { date: '5/2/24', productCode: 'TH0002', productName: 'Mèo', inputQuantity: 0, actualStock: 68, compensation: 0 },
  { date: '5/2/24', productCode: 'TH0003', productName: 'Ngựa', inputQuantity: 0, actualStock: 24, compensation: 0 },
  { date: '5/2/24', productCode: 'TH0006', productName: 'Mèo Demi', inputQuantity: 0, actualStock: 50, compensation: 0 },
  { date: '5/2/24', productCode: 'TH0007', productName: 'Sài Gòn', inputQuantity: 0, actualStock: 31, compensation: 0 },
  { date: '5/2/24', productCode: 'KH0001', productName: 'Khăn lạnh', inputQuantity: 0, actualStock: 2251, compensation: 0 },
  { date: '5/2/24', productCode: 'KH0002', productName: 'Khăn nóng', inputQuantity: 0, actualStock: 818, compensation: 0 },
  { date: '5/2/24', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', inputQuantity: 0, actualStock: 70, compensation: 0 },
  { date: '5/2/24', productCode: 'DK0038', productName: 'Tỏi đen', inputQuantity: 0, actualStock: 89, compensation: 0 },
  
  // Recent transactions (October 2024)
  { date: '4/11/24', productCode: 'BIA0022', productName: 'Heineken bạc lon 250ml', inputQuantity: 600, actualStock: 978, compensation: 0 },
  { date: '4/11/24', productCode: 'BIA0002', productName: 'Ken lon cao', inputQuantity: 1101, actualStock: 1101, compensation: 0 },
  { date: '4/11/24', productCode: 'BIA0017', productName: 'SG Trắng lon', inputQuantity: 516, actualStock: 516, compensation: 0 },
  { date: '4/11/24', productCode: 'BIA0004', productName: 'Tiger bạc', inputQuantity: 1200, actualStock: 2813, compensation: 0 },
  { date: '4/11/24', productCode: 'BIA0005', productName: 'Tiger nâu  lon', inputQuantity: 517, actualStock: 517, compensation: 0 },
  { date: '4/11/24', productCode: 'DK0006', productName: 'Bánh Mix que', inputQuantity: 44, actualStock: 282, compensation: 0 },
  { date: '4/11/24', productCode: 'DK0001', productName: 'Bánh quế', inputQuantity: 76, actualStock: 76, compensation: 0 },
  { date: '4/11/24', productCode: 'DK0003', productName: 'Mít sấy', inputQuantity: 160, actualStock: 198, compensation: 0 },
  { date: '4/11/24', productCode: 'DK0002', productName: 'Mực Bento', inputQuantity: 624, actualStock: 943, compensation: 0 },
  { date: '4/11/24', productCode: 'DK0005', productName: 'Trái cây sấy', inputQuantity: 0, actualStock: 87, compensation: 0 },
  { date: '4/11/24', productCode: 'DK0004', productName: 'Khoai tây slide nhỏ', inputQuantity: 0, actualStock: 83, compensation: 0 },
  { date: '4/11/24', productCode: 'DK0040', productName: 'Kẹo ngậm Doublemint', inputQuantity: 0, actualStock: 390, compensation: 0 },
  { date: '4/11/24', productCode: 'DK0030', productName: 'Phomai', inputQuantity: 87, actualStock: 87, compensation: 0 },
  { date: '4/11/24', productCode: 'DK0038', productName: 'Tỏi đen', inputQuantity: 71, actualStock: 71, compensation: 0 },
  { date: '4/11/24', productCode: 'NN0001', productName: 'Coca', inputQuantity: 123, actualStock: 123, compensation: 0 },
  { date: '4/11/24', productCode: 'NN0002', productName: 'Nước suối', inputQuantity: 1068, actualStock: 1068, compensation: 0 },
  { date: '4/11/24', productCode: 'NN0005', productName: 'Bò húc', inputQuantity: 120, actualStock: 145, compensation: 0 },
  { date: '4/11/24', productCode: 'NN0003', productName: 'Sting', inputQuantity: 68, actualStock: 68, compensation: 0 },
  { date: '4/11/24', productCode: 'NN0004', productName: 'Nước giải rượu', inputQuantity: 539, actualStock: 539, compensation: 0 },
  { date: '4/11/24', productCode: 'NN0009', productName: 'Nước yến Justenst', inputQuantity: 102, actualStock: 102, compensation: 0 },
  { date: '4/11/24', productCode: 'RUOU0033', productName: 'Rượu Mơ Vàng 24k Nhật  Bản', inputQuantity: 42, actualStock: 42, compensation: 0 },
  { date: '4/11/24', productCode: 'TH0001', productName: '555 Việt Nam', inputQuantity: 47, actualStock: 47, compensation: 0 },
  { date: '4/11/24', productCode: 'TH0002', productName: 'Mèo', inputQuantity: 82, actualStock: 82, compensation: 0 },
  { date: '4/11/24', productCode: 'TH0003', productName: 'Ngựa', inputQuantity: 32, actualStock: 32, compensation: 0 },
  { date: '4/11/24', productCode: 'TH0006', productName: 'Mèo Demi', inputQuantity: 31, actualStock: 31, compensation: 0 },
  { date: '4/11/24', productCode: 'TH0007', productName: 'Sài Gòn', inputQuantity: 21, actualStock: 21, compensation: 0 },
  { date: '4/11/24', productCode: 'KH0001', productName: 'Khăn lạnh', inputQuantity: 1418, actualStock: 1418, compensation: 0 },
  { date: '4/11/24', productCode: 'KH0002', productName: 'Khăn nóng', inputQuantity: 1094, actualStock: 1094, compensation: 0 },
  { date: '4/11/24', productCode: 'QT0002', productName: 'Túi đựng mỹ phẩm Queen', inputQuantity: 38, actualStock: 38, compensation: 0 },
  { date: '4/11/24', productCode: 'QT0001', productName: 'Túi Đay Queen (Size M)', inputQuantity: 36, actualStock: 36, compensation: 0 },
  { date: '4/11/24', productCode: 'QT0003', productName: 'Băng Đô Queen', inputQuantity: 50, actualStock: 50, compensation: 0 },
  { date: '4/11/24', productCode: 'QT0004', productName: 'Gấu Bông Queen', inputQuantity: 178, actualStock: 178, compensation: 0 },
  { date: '4/11/24', productCode: 'QT0006', productName: 'Túi Trống Queen', inputQuantity: 68, actualStock: 68, compensation: 0 },
  { date: '4/11/24', productCode: 'QT0007', productName: 'Móc Khóa Âm Nhạc', inputQuantity: 26, actualStock: 26, compensation: 0 }
];

// Helper function to parse date string (DD/MM/YY format)
export const parseDate = (dateStr: string): Date => {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    let year = parseInt(parts[2], 10);
    
    // Handle 2-digit years
    if (year < 100) {
      year += 2000; // Assume 20xx for years < 100
    }
    
    return new Date(year, month, day);
  }
  return new Date();
};

// Helper function to get transactions by date range
export const getTransactionsByDateRange = (startDate: Date, endDate: Date): InventoryTransaction[] => {
  return realInventoryTransactions.filter(transaction => {
    const transactionDate = parseDate(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
};

// Helper function to get transactions by product code
export const getTransactionsByProduct = (productCode: string): InventoryTransaction[] => {
  return realInventoryTransactions.filter(transaction => 
    transaction.productCode === productCode
  );
};

// Helper function to get stock levels by date
export const getStockLevelsByDate = (date: string): { [productCode: string]: number } => {
  const targetDate = parseDate(date);
  const stockLevels: { [productCode: string]: number } = {};
  
  realInventoryTransactions.forEach(transaction => {
    const transactionDate = parseDate(transaction.date);
    if (transactionDate <= targetDate) {
      stockLevels[transaction.productCode] = transaction.actualStock;
    }
  });
  
  return stockLevels;
};
