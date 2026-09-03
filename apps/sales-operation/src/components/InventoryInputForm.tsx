import React, { useState, useEffect, useMemo } from 'react';
import { InventoryRecord, Product } from '../types';
import { useProducts } from '../hooks/useProducts';
import appSettingsService from '../services/appSettingsService';

type ViewRole = 'warehouse_keeper' | 'warehouse_accountant';

interface InventoryInputFormProps {
  onSubmit: (data: Partial<InventoryRecord>) => void;
  onCancel: () => void;
  initialData?: Partial<InventoryRecord>;
  isLoading?: boolean;
  viewRole?: ViewRole;
}

const InventoryInputForm: React.FC<InventoryInputFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  viewRole = 'warehouse_keeper',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const initialFormState = {
    date: new Date(),
    productCode: '',
    productName: '',
    inputQuantity: 0,
    unitPrice: 0,
    totalAmount: 0,
    supplier: '',
    invoiceImage: '',
    rawMaterialStock: 0,
    rawMaterialUnit: '',
    processedStock: 0,
    processedUnit: '',
    finishedProductStock: 0,
    finishedProductUnit: '',
    notes: '',
    ...initialData,
  };

  const [formData, setFormData] = useState<Partial<InventoryRecord>>(initialFormState);

  const { products, loading: productsLoading } = useProducts();

  // Filter products for the searchable dropdown
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.businessCode.toLowerCase().includes(lower)
    );
  }, [products, searchTerm]);

  // Special filter for "Nhập kho" (Inflow)
  const purchasableProducts = useMemo(() => {
    return products.filter(p => p.canBePurchased);
  }, [products]);

  // Helper to get all valid units for a product
  const getAvailableUnits = (product: Product | null) => {
    if (!product) return [];
    // In commercial mode, only show output unit (finished goods only)
    if (appSettingsService.isCommercial()) {
      return [product.outputUnit].filter(Boolean);
    }
    return Array.from(new Set([
      product.inputUnit,
      ...(product.intermediateUnits || []),
      product.outputUnit
    ])).filter(Boolean);
  };

  const availableUnits = useMemo(() => getAvailableUnits(selectedProduct), [selectedProduct]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setIsDropdownOpen(false);
    
    const units = getAvailableUnits(product);
    setFormData(prev => ({
      ...prev,
      productCode: product.businessCode,
      productName: product.name,
      rawMaterialUnit: product.inputUnit || '',
      processedUnit: product.intermediateUnits?.[0] || '',
      finishedProductUnit: product.outputUnit || '',
      // Default price/supplier if available
      supplier: prev.supplier || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    let submissionData = { ...formData };
    
    // Calculate price variance if applicable
    if (isAccountant && formData.unitPrice !== undefined && selectedProduct.standardInputPrice) {
      const standard = selectedProduct.standardInputPrice;
      const actual = formData.unitPrice;
      const variance = ((actual - standard) / standard) * 100;
      
      submissionData.priceVariancePercentage = variance;
      
      const config = appSettingsService.getSettings().priceVarianceConfig;
      if (config) {
        if (Math.abs(variance) > config.tolerancePercentage) {
          submissionData.approvalStatus = 'pending';
        } else {
          submissionData.approvalStatus = 'approved';
        }
      }
    }
    
    // Call onSubmit
    await onSubmit(submissionData);
    
    // Clear form if it's a new entry (not editing)
    if (!initialData?.id) {
      setFormData(initialFormState);
      setSelectedProduct(null);
      setSearchTerm('');
    }
  };

  const handleInputChange = (field: keyof InventoryRecord, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-calculate total amount
      if (field === 'inputQuantity' || field === 'unitPrice') {
        const qty = field === 'inputQuantity' ? value : (prev.inputQuantity || 0);
        const price = field === 'unitPrice' ? value : (prev.unitPrice || 0);
        newData.totalAmount = qty * price;
      }
      
      return newData;
    });
  };

  const isKeeper = viewRole === 'warehouse_keeper';
  const isAccountant = viewRole === 'warehouse_accountant';

  // Helper to check if a form is allowed for current product
  const isFormAllowed = (form: 'raw' | 'processed' | 'finished') => {
    if (!selectedProduct) return true; // Show all if no product selected (default)
    return selectedProduct.allowedForms?.includes(form);
  };

  return (
    <div className="card max-w-4xl mx-auto overflow-visible">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            {isKeeper ? 'Nhập tồn kho thực tế' : 'Nhập giao dịch sổ kho'}
          </h2>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
            isKeeper
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            {isKeeper ? '👷 Thủ kho' : '📊 Kế toán kho'}
          </span>
        </div>
        <p className="text-gray-600">
          {isKeeper
            ? 'Ghi nhận tồn kho thực tế từ kiểm kho (Chỉ hiển thị các dạng tồn phù hợp với SP)'
            : 'Ghi nhận nhập/xuất kho theo sổ sách (Chỉ chọn được SP cho phép nhập)'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
              onChange={(e) => handleInputChange('date', new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn sản phẩm <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                  if (!e.target.value) setSelectedProduct(null);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Tìm theo tên hoặc mã SP..."
                required
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {isDropdownOpen && filteredProducts.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProductSelect(p)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex flex-col border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-xs text-gray-500">{p.businessCode} • {p.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══════ ACCOUNTANT FIELDS: Nhập sổ / Xuất sổ ═══════ */}
        {isAccountant && (
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-6">
            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
              <span className="text-xl">📊</span> Hạch toán Nhập kho
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supplier & Invoice */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nhà cung cấp</label>
                  <select 
                    value={formData.supplier || ''} 
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn nhà cung cấp...</option>
                    <option value="Hộ kinh doanh Trái cây">Hộ kinh doanh Trái cây</option>
                    <option value="Công ty Thực phẩm Sạch">Công ty Thực phẩm Sạch</option>
                    <option value="Chợ đầu mối">Chợ đầu mối</option>
                  </select>
                </div>
                
                <div className="relative group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 text-blue-600">📸 Ảnh hóa đơn / Chứng từ</label>
                  <div className="border-2 border-dashed border-blue-200 rounded-2xl p-4 flex flex-col items-center justify-center bg-white hover:border-blue-400 transition-all cursor-pointer">
                    {formData.invoiceImage ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm">
                        <img src={formData.invoiceImage} alt="Invoice" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => handleInputChange('invoiceImage', '')}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >✕</button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <span className="text-3xl mb-2 block">📄</span>
                        <p className="text-xs text-gray-500 font-medium">Bấm để tải ảnh hoặc kéo thả vào đây</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Stats */}
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">Số lượng nhập</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.inputQuantity || 0}
                        onChange={(e) => handleInputChange('inputQuantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
                        min="0"
                      />
                      <div className="min-w-[80px] px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 flex items-center justify-center">
                        {formData.rawMaterialUnit || 'ĐVT'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">Đơn giá nhập</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.unitPrice || 0}
                        onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl font-bold text-right text-blue-600 focus:ring-2 focus:ring-blue-500 transition-all"
                        min="0"
                      />
                      <span className="absolute right-4 top-2.5 text-sm text-gray-400 font-bold">₫</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-dashed border-gray-100 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-gray-500">Tổng giá trị thanh toán:</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-gray-900 tracking-tight">
                        {(formData.totalAmount || 0).toLocaleString()}
                      </span>
                      <span className="ml-1 text-sm font-bold text-gray-400 uppercase">VND</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-gray-400 font-medium bg-gray-50 px-2 py-0.5 rounded border border-gray-100 italic">Ghi nhận hạch toán Kế toán</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">Sẵn sàng đối soát</span>
                    </div>
                  </div>
                  
                  {selectedProduct?.standardInputPrice ? (
                    <div className="flex justify-between items-center mt-2 p-2 bg-indigo-50 rounded text-xs border border-indigo-100">
                      <span className="text-indigo-700 font-medium">Giá chuẩn: {selectedProduct.standardInputPrice.toLocaleString()}đ</span>
                      {formData.unitPrice ? (() => {
                        const variance = ((formData.unitPrice - selectedProduct.standardInputPrice) / selectedProduct.standardInputPrice) * 100;
                        const config = appSettingsService.getSettings().priceVarianceConfig;
                        const requiresApproval = config && Math.abs(variance) > config.tolerancePercentage;
                        
                        return (
                          <span className={`font-bold ${requiresApproval ? 'text-red-600' : 'text-green-600'}`}>
                            {variance > 0 ? '+' : ''}{variance.toFixed(1)}% 
                            {requiresApproval ? ' (Cần duyệt)' : ' (Hợp lệ)'}
                          </span>
                        );
                      })() : null}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2 tracking-wider">Số lượng xuất sổ (Dự kiến)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={formData.outputQuantity || 0}
                      onChange={(e) => handleInputChange('outputQuantity', parseFloat(e.target.value) || 0)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white font-medium"
                      min="0"
                    />
                    <span className="text-xs font-bold text-gray-400 italic">Dùng cho báo cáo lệch kho</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ KEEPER FIELDS: Nhập kho + Tồn thực ═══════ */}
        {isKeeper && (
          <div className="space-y-6">
            {/* 1. Nhập hàng thực tế (Inbound) */}
            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-4">
              <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                <span className="text-xl">📦</span> Ghi nhận Nhập kho thực tế
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Số lượng thực nhận</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.inputQuantity || 0}
                      onChange={(e) => handleInputChange('inputQuantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-emerald-600"
                      min="0"
                      step="0.01"
                      disabled={selectedProduct && !selectedProduct.canBePurchased}
                    />
                    <select 
                      value={formData.rawMaterialUnit} 
                      onChange={(e) => handleInputChange('rawMaterialUnit', e.target.value)}
                      className="w-32 px-2 py-2 border border-gray-300 rounded-lg text-xs font-bold"
                    >
                      {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  {selectedProduct && !selectedProduct.canBePurchased && (
                    <p className="text-[10px] text-red-500 mt-2 font-medium">⚠️ Sản phẩm này thường không nhập kho trực tiếp</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Kiểm kê Tồn thực tế (Stocktaking) */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">🔍</span> Kiểm kê Tồn thực tế
                </h3>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-bold uppercase">Đa đơn vị</span>
              </div>
              
              {!selectedProduct ? (
                <div className="py-8 text-center bg-white rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">Vui lòng chọn sản phẩm để bắt đầu kiểm kê</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Render an input for each available unit */}
                  {availableUnits.map((unit, index) => {
                    let field: keyof InventoryRecord = 'rawMaterialStock';
                    let label = "Tồn kho Nguyên liệu";
                    let color = "text-emerald-600";
                    let bgColor = "bg-emerald-50";

                    if (unit === selectedProduct?.intermediateUnits?.[0]) {
                      field = 'processedStock';
                      label = "Tồn kho Sơ chế";
                      color = "text-amber-600";
                      bgColor = "bg-amber-50";
                    } else if (unit === selectedProduct?.outputUnit) {
                      field = 'finishedProductStock';
                      label = "Tồn kho Thành phẩm";
                      color = "text-purple-600";
                      bgColor = "bg-purple-50";
                    }
                    
                    return (
                      <div key={unit} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${color.replace('text', 'bg')}`}></div>
                        <div className="flex flex-col mb-4">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${color.replace('text', 'bg')}`}></span>
                            <span className="text-sm font-black text-gray-800">{unit}</span>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={(formData as any)[field] || 0}
                            onChange={(e) => handleInputChange(field, parseFloat(e.target.value) || 0)}
                            className={`w-full px-4 py-3 border border-gray-100 rounded-xl text-right font-black text-xl ${color} focus:ring-2 focus:ring-blue-500 focus:bg-white bg-gray-50/50 transition-all`}
                            min="0"
                            step="0.01"
                            placeholder="0"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold text-gray-300">NHẬP SỐ...</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              )}

              {selectedProduct && availableUnits.length > 1 && !appSettingsService.isCommercial() && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[10px] text-blue-600 font-bold italic">
                    💡 Mẹo: Bạn có thể nhập tồn kho cho cả {availableUnits.join(', ')}. Hệ thống sẽ tự động tổng hợp dựa trên tỷ lệ quy đổi.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ghi chú */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ghi chú
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ghi chú thêm..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-sm transition-colors disabled:opacity-50"
            disabled={isLoading || !selectedProduct}
          >
            {isLoading ? 'Đang lưu...' : 'Lưu bản ghi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryInputForm;
