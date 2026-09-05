import React, { useState, useEffect, useMemo } from 'react';
import { InventoryRecord, Product } from '../types';
import { useProducts } from '../hooks/useProducts';
import appSettingsService from '../services/appSettingsService';
import PartnerQuickAddModal from './UI/PartnerQuickAddModal';
import { supplierService, Supplier } from '../services/supplierService';

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
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partners, setPartners] = useState<Supplier[]>([]);
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [isLinkingSales, setIsLinkingSales] = useState(false);
  // Kế toán: 'purchase' = Nhập kho từ NCC | 'sales_sync' = Xuất sổ / Đối soát
  const [accountantMode, setAccountantMode] = useState<'purchase' | 'sales_sync'>('purchase');
  const [linkedSOId, setLinkedSOId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch suppliers from Cashflow App
    supplierService.getSuppliers().then(res => setPartners(res.data || []));
    
    // Mock fetching pending sales export requests from Sales App
    setPendingSales([
      { id: 'SO-1001', productCode: 'SP001', productName: 'Cà phê', qty: 50, date: new Date().toLocaleDateString() },
      { id: 'SO-1002', productCode: 'SP002', productName: 'Trà Sữa', qty: 20, date: new Date().toLocaleDateString() }
    ]);
  }, []);

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

  const handleLinkSalesOrder = (so: any) => {
    const product = products.find(p => p.businessCode === so.productCode);
    if (product) handleProductSelect(product);
    setLinkedSOId(so.id);
    setFormData(prev => ({
      ...prev,
      outputQuantity: so.qty,
      notes: `Xuất sổ theo Đơn Bán Hàng [${so.id}] từ Sales App.`
    }));
    setIsLinkingSales(false);
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

        {/* ═══════ ACCOUNTANT FIELDS: 2 luồng nghiệp vụ rõ ràng ═══════ */}
        {isAccountant && (
          <div className="space-y-5">

            {/* ── Mode Toggle ── */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => { setAccountantMode('purchase'); setLinkedSOId(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                  accountantMode === 'purchase'
                    ? 'bg-white shadow-md text-blue-700 border border-blue-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>📥</span> Nhập kho từ NCC
              </button>
              <button
                type="button"
                onClick={() => setAccountantMode('sales_sync')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                  accountantMode === 'sales_sync'
                    ? 'bg-white shadow-md text-orange-700 border border-orange-100'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>📤</span> Đồng bộ Xuất sổ / Đối soát
              </button>
            </div>

            {/* ── MODE A: NHẬP KHO TỪ NCC ── */}
            {accountantMode === 'purchase' && (
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-black">1</span>
                  <div>
                    <h3 className="font-bold text-blue-900 text-base">Nhập kho — Ghi nhận hàng về từ Nhà Cung Cấp</h3>
                    <p className="text-xs text-blue-600">Tồn sổ sẽ tăng · Kiểm tra giá vs giá chuẩn · Cần duyệt nếu vượt ngưỡng</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* NCC */}
                  <div className="space-y-4">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-black text-blue-700 uppercase tracking-widest mb-2">🏭 Nhà Cung Cấp (Cashflow App)</label>
                        <select
                          value={formData.supplier || ''}
                          onChange={(e) => handleInputChange('supplier', e.target.value)}
                          className="w-full px-4 py-2.5 border border-blue-200 bg-white rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Chọn NCC...</option>
                          {partners.map(p => (
                            <option key={p.customer_code} value={p.customer_code}>{p.full_name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPartnerModalOpen(true)}
                        className="px-3 py-2.5 bg-blue-100 text-blue-700 rounded-xl font-black text-sm hover:bg-blue-200 transition-colors"
                        title="Thêm NCC mới (lưu vào Cashflow)"
                      >+ NCC</button>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-2">📸 Ảnh Hóa đơn / Chứng từ</label>
                      <div className="border-2 border-dashed border-blue-200 rounded-xl p-3 text-center bg-white hover:border-blue-400 transition-all cursor-pointer">
                        {formData.invoiceImage ? (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                            <img src={formData.invoiceImage} alt="Invoice" className="w-full h-full object-cover" />
                            <button onClick={() => handleInputChange('invoiceImage', '')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full text-xs">✕</button>
                          </div>
                        ) : (
                          <div className="py-3">
                            <span className="text-2xl block mb-1">📄</span>
                            <p className="text-xs text-gray-400 font-medium">Bấm để tải ảnh hóa đơn</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Số liệu tài chính */}
                  <div className="space-y-4 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Số lượng nhập</label>
                        <div className="flex gap-1">
                          <input
                            type="number" min="0"
                            value={formData.inputQuantity || 0}
                            onChange={(e) => handleInputChange('inputQuantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <span className="px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 whitespace-nowrap">{formData.rawMaterialUnit || 'ĐVT'}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Đơn giá (₫)</label>
                        <input
                          type="number" min="0"
                          value={formData.unitPrice || 0}
                          onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-right text-blue-700 focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-dashed border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500">Tổng thanh toán:</span>
                        <span className="text-xl font-black text-gray-900">{(formData.totalAmount || 0).toLocaleString()}<span className="text-xs font-bold text-gray-400 ml-1">₫</span></span>
                      </div>
                    </div>

                    {/* Price variance indicator */}
                    {selectedProduct?.standardInputPrice && formData.unitPrice ? (() => {
                      const std = selectedProduct.standardInputPrice;
                      const variance = ((formData.unitPrice - std) / std) * 100;
                      const config = appSettingsService.getSettings().priceVarianceConfig;
                      const needsApproval = config && Math.abs(variance) > config.tolerancePercentage;
                      return (
                        <div className={`p-3 rounded-xl text-xs border flex items-center justify-between ${
                          needsApproval ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
                        }`}>
                          <span>Giá chuẩn: <strong>{std.toLocaleString()}₫</strong></span>
                          <span className="font-black">
                            {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                            {needsApproval ? ' ⚠️ Cần duyệt' : ' ✅ Hợp lệ'}
                          </span>
                        </div>
                      );
                    })() : null}
                  </div>
                </div>
              </div>
            )}

            {/* ── MODE B: ĐỒNG BỘ XUẤT SỔ / ĐỐI SOÁT ── */}
            {accountantMode === 'sales_sync' && (
              <div className="space-y-5">
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white text-sm font-black">2</span>
                    <div>
                      <h3 className="font-bold text-orange-900 text-base">Đồng bộ Xuất sổ từ Sales App</h3>
                      <p className="text-xs text-orange-600">Chọn Đơn Bán Hàng → Tồn sổ giảm → Tự động đối soát với Tồn thật của Thủ kho</p>
                    </div>
                    {linkedSOId && (
                      <span className="ml-auto bg-orange-600 text-white text-xs px-2 py-1 rounded-full font-bold">🔗 {linkedSOId}</span>
                    )}
                  </div>

                  {/* Sales Orders Panel */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-orange-700 uppercase tracking-widest">🛒 Đơn Bán Hàng chờ xuất ({pendingSales.length})</label>
                      <button type="button" onClick={() => setIsLinkingSales(!isLinkingSales)}
                        className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-orange-700 transition-colors">
                        {isLinkingSales ? 'Đóng' : 'Chọn đơn hàng ▾'}
                      </button>
                    </div>

                    {isLinkingSales && (
                      <div className="bg-white rounded-xl border border-orange-100 shadow-lg overflow-hidden">
                        {pendingSales.length === 0 ? (
                          <div className="py-6 text-center text-sm text-gray-400">✅ Không có đơn chờ xử lý</div>
                        ) : pendingSales.map(so => (
                          <button key={so.id} type="button" onClick={() => handleLinkSalesOrder(so)}
                            className={`w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors ${
                              linkedSOId === so.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                            }`}>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm text-gray-900">{so.id}</span>
                              <span className="text-xs font-black text-orange-600">{so.qty} {so.unit || 'ĐVT'}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{so.productName} · {so.date}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Số lượng xuất */}
                  <div>
                    <label className="block text-xs font-black text-orange-700 uppercase tracking-widest mb-2">Số lượng xuất sổ</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number" min="0"
                        value={formData.outputQuantity || 0}
                        onChange={(e) => handleInputChange('outputQuantity', parseFloat(e.target.value) || 0)}
                        className="flex-1 px-4 py-2.5 border border-orange-300 bg-white rounded-xl font-bold text-orange-900 focus:ring-2 focus:ring-orange-500 text-lg"
                      />
                      <span className="text-sm font-bold text-orange-500">{formData.rawMaterialUnit || 'ĐVT'} · Tồn sổ sẽ giảm</span>
                    </div>
                  </div>
                </div>

                {/* ── PANEL ĐỐI SOÁT TỒN ── */}
                {selectedProduct && (
                  <div className="bg-gradient-to-br from-slate-800 to-indigo-900 rounded-2xl p-5 text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">🔍</span>
                      <h4 className="font-black text-white text-sm uppercase tracking-wider">Đối soát Tồn kho: {selectedProduct.name}</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Tồn sổ (trước)</div>
                        <div className="text-2xl font-black text-white">
                          {(selectedProduct as any).ledgerStock ?? '—'}
                        </div>
                        <div className="text-[10px] text-blue-200 mt-1">{formData.rawMaterialUnit || 'ĐVT'}</div>
                      </div>
                      <div className="bg-orange-500/30 rounded-xl p-3 text-center border border-orange-400/30">
                        <div className="text-[10px] font-black text-orange-300 uppercase tracking-widest mb-1">Xuất sổ hôm nay</div>
                        <div className="text-2xl font-black text-orange-300">−{formData.outputQuantity || 0}</div>
                        <div className="text-[10px] text-orange-200 mt-1">{linkedSOId ? `Từ ${linkedSOId}` : 'Nhập thủ công'}</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">Tồn thật (Thủ kho)</div>
                        <div className="text-2xl font-black text-emerald-300">
                          {(selectedProduct as any).actualStock ?? '—'}
                        </div>
                        <div className="text-[10px] text-emerald-200 mt-1">Từ kiểm kê gần nhất</div>
                      </div>
                    </div>
                    {/* Chênh lệch */}
                    {(selectedProduct as any).ledgerStock != null && (selectedProduct as any).actualStock != null && (
                      (() => {
                        const ledgerAfter = ((selectedProduct as any).ledgerStock - (formData.outputQuantity || 0));
                        const actual = (selectedProduct as any).actualStock;
                        const diff = ledgerAfter - actual;
                        const isOk = Math.abs(diff) < 0.01;
                        return (
                          <div className={`mt-3 p-3 rounded-xl flex items-center justify-between text-sm ${
                            isOk ? 'bg-green-500/20 border border-green-400/30' : 'bg-red-500/20 border border-red-400/30'
                          }`}>
                            <span className="font-bold">{isOk ? '✅ Tồn khớp — không có chênh lệch' : `⚠️ Chênh lệch: ${diff > 0 ? '+' : ''}${diff.toFixed(2)} ${formData.rawMaterialUnit || 'ĐVT'}`}</span>
                            {!isOk && <span className="text-xs opacity-70">{diff > 0 ? 'Tồn sổ > Tồn thật (thiếu hàng thực tế)' : 'Tồn sổ < Tồn thật (hàng thực tế dư)'}</span>}
                          </div>
                        );
                      })()
                    )}
                    {((selectedProduct as any).ledgerStock == null || (selectedProduct as any).actualStock == null) && (
                      <div className="mt-3 p-3 bg-white/5 rounded-xl text-xs text-blue-200 text-center">
                        💡 Chưa có dữ liệu tồn để đối soát. Vui lòng kiểm tra sau khi Thủ kho đã ghi nhận kiểm kê.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
                <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded-full font-bold uppercase">{appSettingsService.isCommercial() ? 'Thành phẩm' : 'Đa đơn vị'}</span>
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
      <PartnerQuickAddModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        defaultType="supplier"
        onAdded={async (p) => {
          // Sync with cashflow app via integration service
          const res = await supplierService.createSupplier({
            full_name: p.full_name,
            customer_code: p.customer_code,
          });
          if (res.success && res.data) {
            const newSupplier = res.data;
            setPartners(prev => [...prev, newSupplier]);
            handleInputChange('supplier', newSupplier.customer_code);
          }
          setIsPartnerModalOpen(false);
        }}
      />
    </div>
  );
};

export default InventoryInputForm;
