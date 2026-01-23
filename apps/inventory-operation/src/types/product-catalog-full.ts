// Comprehensive Product Catalog Types based on actual Excel structure
export interface ProductCatalogFullItem {
  id: string;
  ngayCapNhat: Date; // Ngày cập nhật
  loai: string; // Loại (Trà cây, etc.)
  maNguyenVatLieu: string; // Mã Nguyên vật liệu
  tenNguyenVatLieu: string; // Tên Nguyên vật liệu
  thanhPham: boolean; // Thành phẩm? (TRUE/FALSE)
  dinhLuongXuat: number; // Định lượng Xuất
  dinhLuongNhap: number; // Định lượng Nhập
  maSPKD: string; // Mã SP KD (Mã sản phẩm kinh doanh)
  tenThanhPham: string; // Tên Thành phẩm
  dvtNhap: string; // ĐVT Nhập (Đơn vị tính nhập)
  dvtXuat: string; // ĐVT Xuất (Đơn vị tính xuất)
  tinhTrang: 'Đang bán' | 'Ngưng bán' | 'Hết hàng'; // Tình trạng
  createdAt: Date;
  updatedAt: Date;
}

// Sample data based on the Excel structure shown in image - CORRECTED
export const SAMPLE_PRODUCT_CATALOG_FULL: ProductCatalogFullItem[] = [
  {
    id: '1',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0001',
    tenNguyenVatLieu: 'Bưởi',
    thanhPham: false,
    dinhLuongXuat: 0.5,
    dinhLuongNhap: 1,
    maSPKD: 'TC0001',
    tenThanhPham: 'Đĩa bưởi',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '2',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0002',
    tenNguyenVatLieu: 'Cam',
    thanhPham: false,
    dinhLuongXuat: 0.5,
    dinhLuongNhap: 1,
    maSPKD: 'TC0002',
    tenThanhPham: 'Đĩa cam',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '3',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0003',
    tenNguyenVatLieu: 'Cam',
    thanhPham: false,
    dinhLuongXuat: 5,
    dinhLuongNhap: 1,
    maSPKD: 'TC0003',
    tenThanhPham: 'Đĩa cam',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '4',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0004',
    tenNguyenVatLieu: 'Dứa hậu',
    thanhPham: false,
    dinhLuongXuat: 8,
    dinhLuongNhap: 1,
    maSPKD: 'TC0004',
    tenThanhPham: 'Đĩa dứa hậu',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '5',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0004',
    tenNguyenVatLieu: 'Dứa hậu',
    thanhPham: false,
    dinhLuongXuat: 48,
    dinhLuongNhap: 1,
    maSPKD: 'TC0004',
    tenThanhPham: 'Đĩa dứa hậu combo',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '6',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0005',
    tenNguyenVatLieu: 'Nho',
    thanhPham: false,
    dinhLuongXuat: 400,
    dinhLuongNhap: 1,
    maSPKD: 'TC0005',
    tenThanhPham: 'Đĩa nho',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '7',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0005',
    tenNguyenVatLieu: 'Nho',
    thanhPham: false,
    dinhLuongXuat: 100,
    dinhLuongNhap: 1,
    maSPKD: 'TC0005',
    tenThanhPham: 'Đĩa nho combo',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '8',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0006',
    tenNguyenVatLieu: 'Ổi',
    thanhPham: false,
    dinhLuongXuat: 49,
    dinhLuongNhap: 1,
    maSPKD: 'TC0006',
    tenThanhPham: 'Đĩa ổi',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '9',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0006',
    tenNguyenVatLieu: 'Ổi',
    thanhPham: false,
    dinhLuongXuat: 8,
    dinhLuongNhap: 1,
    maSPKD: 'TC0006',
    tenThanhPham: 'Đĩa ổi combo',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '10',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0007',
    tenNguyenVatLieu: 'Táo',
    thanhPham: false,
    dinhLuongXuat: 8,
    dinhLuongNhap: 1,
    maSPKD: 'TC0007',
    tenThanhPham: 'Đĩa táo',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '11',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0007',
    tenNguyenVatLieu: 'Táo',
    thanhPham: false,
    dinhLuongXuat: 3,
    dinhLuongNhap: 1,
    maSPKD: 'TC0020',
    tenThanhPham: 'Đĩa táo combo',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '12',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0008',
    tenNguyenVatLieu: 'Xoài',
    thanhPham: false,
    dinhLuongXuat: 48,
    dinhLuongNhap: 1,
    maSPKD: 'TC0008',
    tenThanhPham: 'Đĩa xoài',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '13',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0008',
    tenNguyenVatLieu: 'Xoài',
    thanhPham: false,
    dinhLuongXuat: 14,
    dinhLuongNhap: 1,
    maSPKD: 'TC0008',
    tenThanhPham: 'Đĩa xoài combo',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  },
  {
    id: '14',
    ngayCapNhat: new Date('2024-02-06'),
    loai: 'Đĩa trái cây',
    maNguyenVatLieu: 'TC0008',
    tenNguyenVatLieu: 'Xoài',
    thanhPham: false,
    dinhLuongXuat: 18,
    dinhLuongNhap: 1,
    maSPKD: 'TC0020',
    tenThanhPham: 'Đĩa xoài combo',
    dvtNhap: 'đĩa',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06')
  }
];

// Column definitions for the full product catalog table
export const PRODUCT_CATALOG_FULL_COLUMNS = [
  { key: 'ngayCapNhat', label: 'Ngày cập nhật', type: 'date', width: '120px' },
  { key: 'loai', label: 'Loại', type: 'text', width: '100px' },
  { key: 'maNguyenVatLieu', label: 'Mã Nguyên vật liệu', type: 'text', width: '150px' },
  { key: 'tenNguyenVatLieu', label: 'Tên Nguyên vật liệu', type: 'text', width: '200px' },
  { key: 'thanhPham', label: 'Thành phẩm?', type: 'boolean', width: '100px' },
  { key: 'dinhLuongXuat', label: 'Định lượng Xuất', type: 'number', width: '120px' },
  { key: 'dinhLuongNhap', label: 'Định lượng Nhập', type: 'number', width: '120px' },
  { key: 'maSPKD', label: 'Mã SP KD', type: 'text', width: '100px' },
  { key: 'tenThanhPham', label: 'Tên Thành phẩm', type: 'text', width: '200px' },
  { key: 'dvtNhap', label: 'ĐVT Nhập', type: 'text', width: '80px' },
  { key: 'dvtXuat', label: 'ĐVT Xuất', type: 'text', width: '80px' },
  { key: 'tinhTrang', label: 'Tình trạng', type: 'select', width: '100px' }
];

// Helper functions
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('vi-VN');
};

export const formatBoolean = (value: boolean): string => {
  return value ? 'TRUE' : 'FALSE';
};

export const getTinhTrangColor = (tinhTrang: string): string => {
  switch (tinhTrang) {
    case 'Đang bán':
      return 'bg-green-100 text-green-800';
    case 'Ngưng bán':
      return 'bg-red-100 text-red-800';
    case 'Hết hàng':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
