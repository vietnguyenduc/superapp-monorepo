import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchableDropdown from '../components/SearchableDropdown';
import BulkPasteValidationModal from '../components/BulkPasteValidationModal';
import { productLookupService, ProductMapping } from '../services/productLookupService';

// Column configuration interface
interface ColumnConfig {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  width: string;
  required: boolean;
  visible: boolean;
  order: number;
  selectOptions?: string[];
}

// Product data interface matching Excel schema
interface ProductCatalogItem {
  id: string;
  ngayCapNhat: string;
  loai: string;
  maNguyenVatLieu: string;
  tenNguyenVatLieu: string;
  thanhPham: boolean;
  dinhLuongXuat: number;
  dinhLuongNhap: number;
  maSPKD: string;
  tenThanhPham: string;
  dvtNhap: string;
  dvtXuat: string;
  tinhTrang: string;
}

// Sample data matching Excel structure from user
const SAMPLE_PRODUCTS: ProductCatalogItem[] = [
  // Cam - multiple products
  {
    id: '1',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0002',
    tenNguyenVatLieu: 'Cam',
    thanhPham: false,
    dinhLuongXuat: 40,
    dinhLuongNhap: 8,
    maSPKD: '8 TC0002',
    tenThanhPham: 'Đĩa cam',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '2',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0002',
    tenNguyenVatLieu: 'Cam',
    thanhPham: false,
    dinhLuongXuat: 8,
    dinhLuongNhap: 8,
    maSPKD: '8 TC0002',
    tenThanhPham: 'Đĩa trái cây',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '3',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0002',
    tenNguyenVatLieu: 'Cam',
    thanhPham: false,
    dinhLuongXuat: 3,
    dinhLuongNhap: 8,
    maSPKD: '6 TC0020',
    tenThanhPham: 'Đĩa trái cây combo',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  // Dứa hấu
  {
    id: '4',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0004',
    tenNguyenVatLieu: 'Dứa hấu',
    thanhPham: false,
    dinhLuongXuat: 48,
    dinhLuongNhap: 48,
    maSPKD: '48 TC0004',
    tenThanhPham: 'Đĩa dứa hấu',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '5',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0004',
    tenNguyenVatLieu: 'Dứa hấu',
    thanhPham: false,
    dinhLuongXuat: 8,
    dinhLuongNhap: 48,
    maSPKD: '48 TC0004',
    tenThanhPham: 'Đĩa trái cây',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '6',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0004',
    tenNguyenVatLieu: 'Dứa hấu',
    thanhPham: false,
    dinhLuongXuat: 14,
    dinhLuongNhap: 48,
    maSPKD: '48 TC0020',
    tenThanhPham: 'Đĩa trái cây combo',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  // Nho
  {
    id: '7',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0005',
    tenNguyenVatLieu: 'Nho',
    thanhPham: false,
    dinhLuongXuat: 400,
    dinhLuongNhap: 1000,
    maSPKD: '1000 TC0005',
    tenThanhPham: 'Đĩa nho',
    dvtNhap: 'gram',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '8',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0005',
    tenNguyenVatLieu: 'Nho',
    thanhPham: false,
    dinhLuongXuat: 100,
    dinhLuongNhap: 1000,
    maSPKD: '1000 TC0005',
    tenThanhPham: 'Đĩa trái cây',
    dvtNhap: 'gram',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  // Ổi
  {
    id: '9',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0006',
    tenNguyenVatLieu: 'Ổi',
    thanhPham: false,
    dinhLuongXuat: 49,
    dinhLuongNhap: 6,
    maSPKD: '6 TC0006',
    tenThanhPham: 'Đĩa ổi',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '10',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0006',
    tenNguyenVatLieu: 'Ổi',
    thanhPham: false,
    dinhLuongXuat: 8,
    dinhLuongNhap: 6,
    maSPKD: '6 TC0006',
    tenThanhPham: 'Đĩa trái cây',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '11',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0006',
    tenNguyenVatLieu: 'Ổi',
    thanhPham: false,
    dinhLuongXuat: 8,
    dinhLuongNhap: 6,
    maSPKD: '6 TC0020',
    tenThanhPham: 'Đĩa trái cây combo',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  // Táo
  {
    id: '12',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0007',
    tenNguyenVatLieu: 'Táo',
    thanhPham: false,
    dinhLuongXuat: 40,
    dinhLuongNhap: 8,
    maSPKD: '8 TC0007',
    tenThanhPham: 'Đĩa táo',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '13',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0007',
    tenNguyenVatLieu: 'Táo',
    thanhPham: false,
    dinhLuongXuat: 8,
    dinhLuongNhap: 8,
    maSPKD: '8 TC0007',
    tenThanhPham: 'Đĩa trái cây',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '14',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0007',
    tenNguyenVatLieu: 'Táo',
    thanhPham: false,
    dinhLuongXuat: 3,
    dinhLuongNhap: 8,
    maSPKD: '8 TC0020',
    tenThanhPham: 'Đĩa trái cây combo',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  // Xoài
  {
    id: '15',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0008',
    tenNguyenVatLieu: 'Xoài',
    thanhPham: false,
    dinhLuongXuat: 48,
    dinhLuongNhap: 16,
    maSPKD: '16 TC0008',
    tenThanhPham: 'Đĩa xoài',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '16',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0008',
    tenNguyenVatLieu: 'Xoài',
    thanhPham: false,
    dinhLuongXuat: 14,
    dinhLuongNhap: 16,
    maSPKD: '16 TC0008',
    tenThanhPham: 'Đĩa trái cây',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  },
  {
    id: '17',
    ngayCapNhat: '2/08/2025',
    loai: 'Trái cây',
    maNguyenVatLieu: 'NVL-TC0008',
    tenNguyenVatLieu: 'Xoài',
    thanhPham: false,
    dinhLuongXuat: 18,
    dinhLuongNhap: 16,
    maSPKD: '16 TC0020',
    tenThanhPham: 'Đĩa trái cây combo',
    dvtNhap: 'trái',
    dvtXuat: 'đĩa',
    tinhTrang: 'Đang bán'
  }
];

const ProductCatalogPageNew: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductCatalogItem[]>(SAMPLE_PRODUCTS);
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>([]);
  const [editingCell, setEditingCell] = useState<{ productId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [productOptions, setProductOptions] = useState<ProductMapping[]>([]);
  const [showBulkValidation, setShowBulkValidation] = useState(false);
  const [bulkPasteData, setBulkPasteData] = useState<string[]>([]);

  // Default column configuration matching real data
  const getDefaultColumns = (): ColumnConfig[] => [
    { id: '1', key: 'ngayCapNhat', label: 'Ngày cập nhật', type: 'date', width: '120px', required: true, visible: true, order: 1 },
    { id: '2', key: 'loai', label: 'Loại', type: 'select', width: '100px', required: true, visible: true, order: 2, selectOptions: ['Trái cây', 'Nước ép', 'Smoothie', 'Bánh ngọt'] },
    { id: '3', key: 'maNguyenVatLieu', label: 'Mã Nguyên vật liệu', type: 'text', width: '150px', required: true, visible: true, order: 3 },
    { id: '4', key: 'tenNguyenVatLieu', label: 'Tên Nguyên vật liệu', type: 'text', width: '150px', required: true, visible: true, order: 4 },
    { id: '5', key: 'thanhPham', label: 'Thành phẩm?', type: 'boolean', width: '100px', required: false, visible: true, order: 5 },
    { id: '6', key: 'dinhLuongXuat', label: 'Định lượng Xuất', type: 'number', width: '120px', required: true, visible: true, order: 6 },
    { id: '7', key: 'dinhLuongNhap', label: 'Định lượng Nhập', type: 'number', width: '120px', required: true, visible: true, order: 7 },
    { id: '8', key: 'maSPKD', label: 'Mã SP KD', type: 'text', width: '120px', required: false, visible: true, order: 8 },
    { id: '9', key: 'tenThanhPham', label: 'Tên Thành phẩm', type: 'text', width: '180px', required: true, visible: true, order: 9 },
    { id: '10', key: 'dvtNhap', label: 'ĐVT Nhập', type: 'select', width: '80px', required: false, visible: true, order: 10, selectOptions: ['đĩa', 'ly', 'kg', 'gram', 'trái'] },
    { id: '11', key: 'dvtXuat', label: 'ĐVT Xuất', type: 'select', width: '80px', required: false, visible: true, order: 11, selectOptions: ['đĩa', 'ly', 'kg', 'gram', 'trái'] },
    { id: '12', key: 'tinhTrang', label: 'Tình trạng', type: 'select', width: '100px', required: true, visible: true, order: 12, selectOptions: ['Đang bán', 'Ngưng bán', 'Hết hàng'] }
  ];

  // Load column configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('productCatalogColumns');
    if (savedConfig) {
      try {
        setColumnConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.error('Error loading column config:', error);
        setColumnConfig(getDefaultColumns());
      }
    } else {
      setColumnConfig(getDefaultColumns());
    }
  }, []);

  // Load product options for searchable dropdown
  useEffect(() => {
    const options = productLookupService.getAllProducts();
    setProductOptions(options);
  }, []);

  // Get visible columns sorted by order
  const visibleColumns = columnConfig
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  // Handle cell click for editing
  const handleCellClick = (productId: string, field: string, currentValue: any) => {
    setEditingCell({ productId, field });
    setEditValue(String(currentValue || ''));
  };

  // Handle cell value change
  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditValue(e.target.value);
  };

  // Handle cell save (Enter key or blur)
  const handleCellSave = () => {
    if (!editingCell) return;

    const { productId, field } = editingCell;
    const column = columnConfig.find(col => col.key === field);
    
    if (!column) return;

    // Convert value based on column type
    let convertedValue: any = editValue;
    if (column.type === 'number') {
      convertedValue = parseFloat(editValue) || 0;
    } else if (column.type === 'boolean') {
      convertedValue = editValue === 'true' || editValue === '1';
    }

    // Update product
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, [field]: convertedValue }
        : product
    ));

    setEditingCell(null);
    setEditValue('');
  };

  // Handle product selection from searchable dropdown
  const handleProductSelect = (productId: string, productName: string, selectedOption?: any) => {
    // Update product name
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, tenThanhPham: productName }
        : product
    ));

    // Auto-lookup and update product code if option selected
    if (selectedOption) {
      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, tenThanhPham: productName, maSPKD: selectedOption.code }
          : product
      ));
    }

    setEditingCell(null);
    setEditValue('');
  };

  // Handle product code lookup
  const handleCodeLookup = (productId: string, code: string) => {
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, maSPKD: code }
        : product
    ));
  };

  // Handle bulk paste
  const handleBulkPaste = (items: string[]) => {
    setBulkPasteData(items);
    setShowBulkValidation(true);
  };

  // Handle bulk validation confirmation
  const handleBulkValidationConfirm = (validatedItems: any[]) => {
    // Add validated items as new products
    const newProducts = validatedItems
      .filter(item => item.isValid)
      .map((item, index) => ({
        id: (Date.now() + index).toString(),
        ngayCapNhat: new Date().toISOString().split('T')[0],
        loai: 'Trái cây',
        maNguyenVatLieu: '',
        tenNguyenVatLieu: '',
        thanhPham: false,
        dinhLuongXuat: 0,
        dinhLuongNhap: 0,
        maSPKD: item.code,
        tenThanhPham: item.name,
        dvtNhap: 'trái',
        dvtXuat: 'đĩa',
        tinhTrang: 'Đang bán'
      }));

    setProducts([...products, ...newProducts]);
    setShowBulkValidation(false);
    setBulkPasteData([]);

    // Show success message
    alert(`✅ Đã thêm thành công ${newProducts.length} sản phẩm từ dán hàng loạt!`);
  };

  // Handle bulk validation cancel
  const handleBulkValidationCancel = () => {
    setShowBulkValidation(false);
    setBulkPasteData([]);
  };

  // Handle cell cancel (Escape key)
  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Handle key press in cell
  const handleCellKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  // Render cell content based on type
  const renderCellContent = (product: ProductCatalogItem, column: ColumnConfig) => {
    const value = (product as any)[column.key];
    const isEditing = editingCell?.productId === product.id && editingCell?.field === column.key;

    if (isEditing) {
      // Special handling for product name column with SearchableDropdown
      if (column.key === 'tenThanhPham') {
        return (
          <SearchableDropdown
            value={editValue}
            onChange={(value, selectedOption) => handleProductSelect(product.id, value, selectedOption)}
            onCodeLookup={(code) => handleCodeLookup(product.id, code)}
            onBulkPaste={handleBulkPaste}
            options={productOptions}
            placeholder="Tìm kiếm sản phẩm..."
            className="min-w-[200px]"
          />
        );
      } else if (column.type === 'select' && column.selectOptions) {
        return (
          <select
            value={editValue}
            onChange={handleCellChange}
            onBlur={handleCellSave}
            onKeyDown={handleCellKeyPress}
            className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          >
            <option value="">-- Chọn --</option>
            {column.selectOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      } else if (column.type === 'boolean') {
        return (
          <select
            value={editValue}
            onChange={handleCellChange}
            onBlur={handleCellSave}
            onKeyDown={handleCellKeyPress}
            className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          >
            <option value="false">Không</option>
            <option value="true">Có</option>
          </select>
        );
      } else {
        return (
          <input
            type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
            value={editValue}
            onChange={handleCellChange}
            onBlur={handleCellSave}
            onKeyDown={handleCellKeyPress}
            className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        );
      }
    }

    // Display value
    if (column.type === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? '✅ Có' : '❌ Không'}
        </span>
      );
    } else if (column.type === 'number') {
      return <span className="font-mono">{value || 0}</span>;
    } else if (column.type === 'date') {
      return <span className="text-sm">{value || '-'}</span>;
    } else {
      return <span>{value || '-'}</span>;
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return Object.values(product).some(value => 
      String(value).toLowerCase().includes(searchLower)
    );
  });

  // Add new product
  const handleAddProduct = () => {
    const newProduct: ProductCatalogItem = {
      id: Date.now().toString(),
      ngayCapNhat: new Date().toISOString().split('T')[0],
      loai: '',
      maNguyenVatLieu: '',
      tenNguyenVatLieu: '',
      thanhPham: false,
      dinhLuongXuat: 0,
      dinhLuongNhap: 0,
      maSPKD: '',
      tenThanhPham: '',
      dvtNhap: '',
      dvtXuat: '',
      tinhTrang: 'Đang bán'
    };
    setProducts([...products, newProduct]);
  };

  // Delete product
  const handleDeleteProduct = (productId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">📋 Danh mục hàng hóa</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Quản lý danh mục, định mức, quy đổi với inline editing
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/product-catalog-settings')}
            className="px-3 sm:px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 flex items-center gap-1 sm:gap-2"
          >
            <span className="hidden sm:inline">⚙️</span> Cấu hình
          </button>
          <button
            onClick={() => navigate('/product-import')}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center gap-1 sm:gap-2"
          >
            <span className="hidden sm:inline">📊</span> Nhập hàng loạt
          </button>
          <button
            onClick={handleAddProduct}
            className="px-3 sm:px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center gap-1 sm:gap-2"
          >
            ➕ Thêm
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="🔍 Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span>📊 Tổng: <strong>{filteredProducts.length}</strong></span>
          <span>✅ Đang bán: <strong>{filteredProducts.filter(p => p.tinhTrang === 'Đang bán').length}</strong></span>
          <span>⏸️ Ngưng bán: <strong>{filteredProducts.filter(p => p.tinhTrang === 'Ngưng bán').length}</strong></span>
        </div>
      </div>

      {/* Instructions - hidden on mobile to save space */}
      <div className="hidden sm:block bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Hướng dẫn sử dụng:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h5 className="font-medium mb-1">🎯 Inline Editing:</h5>
            <ul className="space-y-1">
              <li>• <strong>Click vào ô:</strong> Chỉnh sửa trực tiếp</li>
              <li>• <strong>Enter:</strong> Lưu thay đổi</li>
              <li>• <strong>Escape:</strong> Hủy chỉnh sửa</li>
              <li>• <strong>Tab:</strong> Chuyển sang ô tiếp theo</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-1">⚙️ Tùy chỉnh:</h5>
            <ul className="space-y-1">
              <li>• <strong>Cấu hình bảng:</strong> Thay đổi cột, thứ tự</li>
              <li>• <strong>Nhập hàng loạt:</strong> Import từ Excel</li>
              <li>• <strong>Tìm kiếm:</strong> Filter theo từ khóa</li>
              <li>• <strong>Thêm/Xóa:</strong> Quản lý sản phẩm</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden sm:block bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    style={{ width: column.width }}
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.required && <span className="text-red-500">*</span>}
                      <span className="text-xs text-gray-400">
                        ({column.type === 'text' ? '📝' : 
                          column.type === 'number' ? '🔢' : 
                          column.type === 'date' ? '📅' : 
                          column.type === 'boolean' ? '☑️' : '📋'})
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {visibleColumns.map((column) => (
                    <td
                      key={`${product.id}-${column.key}`}
                      className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200 cursor-pointer hover:bg-blue-50"
                      onClick={() => handleCellClick(product.id, column.key, (product as any)[column.key])}
                    >
                      {renderCellContent(product, column)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-sm font-medium">
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900 text-xs px-2 py-1 rounded hover:bg-red-50"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Chưa có sản phẩm nào trong danh mục'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                ➕ Thêm sản phẩm đầu tiên
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-4xl mb-3">📋</div>
            <h3 className="text-base font-medium text-gray-900 mb-1">Không tìm thấy sản phẩm</h3>
            <p className="text-sm text-gray-500 mb-3">
              {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Chưa có sản phẩm nào'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                ➕ Thêm sản phẩm đầu tiên
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 space-y-2">
              {/* Product name + delete */}
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{product.tenThanhPham || '-'}</h3>
                  <p className="text-xs text-gray-500">{product.maSPKD || '-'}</p>
                </div>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-red-500 hover:text-red-700 text-sm ml-2 flex-shrink-0"
                >
                  🗑️
                </button>
              </div>
              {/* Key fields as rows */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Loại:</span>
                  <span className="font-medium text-gray-800 truncate ml-1">{product.loai || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã NVL:</span>
                  <span className="font-medium text-gray-800 truncate ml-1">{product.maNguyenVatLieu || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tên NVL:</span>
                  <span className="font-medium text-gray-800 truncate ml-1">{product.tenNguyenVatLieu || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Định lượng:</span>
                  <span className="font-medium text-gray-800">{product.dinhLuongXuat}/{product.dinhLuongNhap}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ĐVT:</span>
                  <span className="font-medium text-gray-800">{product.dvtNhap}/{product.dvtXuat}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className={`font-medium text-xs px-1.5 py-0.5 rounded ${
                    product.tinhTrang === 'Đang bán' ? 'bg-green-100 text-green-700' :
                    product.tinhTrang === 'Ngưng bán' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{product.tinhTrang || '-'}</span>
                </div>
              </div>
              {/* Ngày cập nhật */}
              <div className="text-xs text-gray-400 pt-1 border-t border-gray-50">
                📅 {product.ngayCapNhat || '-'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Paste Validation Modal */}
      <BulkPasteValidationModal
        isOpen={showBulkValidation}
        onClose={handleBulkValidationCancel}
        onConfirm={handleBulkValidationConfirm}
        pastedData={bulkPasteData}
      />
    </div>
  );
};

export default ProductCatalogPageNew;
