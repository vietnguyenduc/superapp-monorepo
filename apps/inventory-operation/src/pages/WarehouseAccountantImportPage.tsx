import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import InventoryBulkImport from '../components/InventoryBulkImport';
import { cashflowIntegrationService, Supplier } from '../services/cashflowIntegrationService';
import appSettingsService from '../services/appSettingsService';

// Mock pending sales orders from Sales App
const MOCK_PENDING_SALES_ORDERS = [
  { id: 'SO-2001', productCode: 'NVL-XO01', productName: 'Xoài cát Hòa Lộc', qty: 30, unit: 'kg', date: '2026-05-19', customer: 'Khách lẻ' },
  { id: 'SO-2002', productCode: 'NVL-DH01', productName: 'Dưa hấu không hạt', qty: 15, unit: 'trái', date: '2026-05-19', customer: 'Bàn 5' },
  { id: 'SO-2003', productCode: 'NVL-XO01', productName: 'Xoài cát Hòa Lộc', qty: 10, unit: 'kg', date: '2026-05-18', customer: 'KH Nguyễn Văn A' },
];

const WarehouseAccountantImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { createRecord } = useInventory();

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'bulk'>('export');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pendingSales, setPendingSales] = useState(MOCK_PENDING_SALES_ORDERS);
  const [selectedSO, setSelectedSO] = useState<typeof MOCK_PENDING_SALES_ORDERS[0] | null>(null);

  // Export (Xuất sổ) form
  const [exportForm, setExportForm] = useState({
    productCode: '',
    outputQuantity: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    linkedSOId: '',
  });

  // Import (Nhập sổ) form
  const [importForm, setImportForm] = useState({
    productCode: '',
    inputQuantity: 0,
    unitPrice: 0,
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    cashflowIntegrationService.getSuppliers().then(setSuppliers);
  }, []);

  const notify = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLinkSO = (so: typeof MOCK_PENDING_SALES_ORDERS[0]) => {
    setSelectedSO(so);
    setExportForm(prev => ({
      ...prev,
      productCode: so.productCode,
      outputQuantity: so.qty,
      linkedSOId: so.id,
      notes: `Xuất kho theo Đơn Bán Hàng [${so.id}] - KH: ${so.customer}`,
    }));
  };

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportForm.productCode) return;
    setLoading(true);
    const result = await createRecord({
      productCode: exportForm.productCode,
      productName: products.find(p => p.businessCode === exportForm.productCode)?.name || '',
      outputQuantity: exportForm.outputQuantity,
      date: new Date(exportForm.date),
      notes: exportForm.notes,
      source: 'warehouse_accountant',
      type: 'Xuất kho',
    } as any);
    setLoading(false);
    if (result.success) {
      notify('success', `Đã xuất sổ ${exportForm.outputQuantity} đơn vị!`);
      if (selectedSO) setPendingSales(prev => prev.filter(s => s.id !== selectedSO.id));
      setSelectedSO(null);
      setExportForm({ productCode: '', outputQuantity: 0, date: new Date().toISOString().split('T')[0], notes: '', linkedSOId: '' });
    } else {
      notify('error', result.error || 'Lỗi ghi nhận');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.productCode) return;
    setLoading(true);
    const config = appSettingsService.getSettings().priceVarianceConfig;
    const product = products.find(p => p.businessCode === importForm.productCode);
    let approvalStatus: any = undefined;
    if (product?.standardInputPrice && importForm.unitPrice) {
      const variance = ((importForm.unitPrice - product.standardInputPrice) / product.standardInputPrice) * 100;
      if (config) approvalStatus = Math.abs(variance) > config.tolerancePercentage ? 'pending' : 'approved';
    }
    const result = await createRecord({
      productCode: importForm.productCode,
      productName: product?.name || '',
      inputQuantity: importForm.inputQuantity,
      unitPrice: importForm.unitPrice,
      totalAmount: importForm.inputQuantity * importForm.unitPrice,
      supplierName: importForm.supplier,
      date: new Date(importForm.date),
      notes: importForm.notes,
      source: 'warehouse_accountant',
      approvalStatus,
    } as any);
    setLoading(false);
    if (result.success) {
      notify('success', `Đã nhập sổ ${importForm.inputQuantity} đơn vị!`);
      setImportForm({ productCode: '', inputQuantity: 0, unitPrice: 0, supplier: '', date: new Date().toISOString().split('T')[0], notes: '' });
    } else {
      notify('error', result.error || 'Lỗi ghi nhận');
    }
  };

  const sellableProducts = products.filter(p => p.canBeSold !== false);
  const purchasableProducts = products.filter(p => p.canBePurchased !== false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📊 Nhập liệu Kế toán kho</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Quản lý nghiệp vụ nhập/xuất sổ kho — liên kết Sales App & Cashflow App</p>
          </div>
          <button onClick={() => navigate('/inventory-records')}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            ← Quay lại
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-xl border text-sm font-medium ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
            {notification.type === 'success' ? '✅' : '❌'} {notification.msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
          {([
            { id: 'export', label: '📤 Xuất Sổ (Sales App)', color: 'orange' },
            { id: 'import', label: '📥 Nhập Sổ (NCC)', color: 'blue' },
            { id: 'bulk', label: '📁 Import Hàng Loạt', color: 'purple' },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-900 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── XUẤT SỔ (Export) ─── */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Sales Orders from Sales App */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-orange-50 dark:bg-orange-900/10">
                <h3 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-2">
                  <span>🛒</span> Đơn Bán Hàng chờ xuất kho <span className="ml-auto bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">{pendingSales.length}</span>
                </h3>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Đồng bộ từ Sales App · Bấm để điền tự động vào form xuất</p>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-80 overflow-y-auto">
                {pendingSales.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">✅ Không có đơn hàng chờ xử lý</div>
                ) : pendingSales.map(so => (
                  <button key={so.id} type="button" onClick={() => handleLinkSO(so)}
                    className={`w-full text-left px-5 py-4 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors ${selectedSO?.id === so.id ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500' : ''}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{so.id}</span>
                      <span className="text-xs font-black text-orange-600 dark:text-orange-400">{so.qty} {so.unit}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{so.productName}</div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-gray-400">{so.date}</span>
                      <span className="text-[10px] text-gray-500">{so.customer}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Export Form */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📤</span> Ghi nhận Xuất Sổ
                {selectedSO && <span className="ml-auto text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">Liên kết: {selectedSO.id}</span>}
              </h3>
              <form onSubmit={handleExportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Sản phẩm *</label>
                  <select required value={exportForm.productCode}
                    onChange={e => setExportForm(prev => ({ ...prev, productCode: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none dark:text-white">
                    <option value="">Chọn sản phẩm...</option>
                    {sellableProducts.map(p => <option key={p.id} value={p.businessCode}>{p.businessCode} - {p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Số lượng xuất *</label>
                    <input type="number" required min={1} value={exportForm.outputQuantity}
                      onChange={e => setExportForm(prev => ({ ...prev, outputQuantity: Number(e.target.value) }))}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none dark:text-white font-bold text-orange-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ngày xuất</label>
                    <input type="date" value={exportForm.date}
                      onChange={e => setExportForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ghi chú</label>
                  <textarea rows={2} value={exportForm.notes}
                    onChange={e => setExportForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none dark:text-white text-sm" />
                </div>
                <button type="submit" disabled={loading || !exportForm.productCode}
                  className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm">
                  {loading ? 'Đang ghi nhận...' : '📤 Ghi nhận Xuất Sổ'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── NHẬP SỔ (Import from Supplier) ─── */}
        {activeTab === 'import' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-5 flex items-center gap-2">
              <span>📥</span> Ghi nhận Nhập Sổ từ Nhà Cung Cấp
              <span className="ml-auto text-xs text-gray-400 font-normal">Danh sách NCC từ Cashflow App</span>
            </h3>
            <form onSubmit={handleImportSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Sản phẩm *</label>
                  <select required value={importForm.productCode}
                    onChange={e => setImportForm(prev => ({ ...prev, productCode: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
                    <option value="">Chọn sản phẩm...</option>
                    {purchasableProducts.map(p => <option key={p.id} value={p.businessCode}>{p.businessCode} - {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-blue-600 uppercase tracking-widest mb-2">🏭 Nhà Cung Cấp (Cashflow App)</label>
                  <select value={importForm.supplier}
                    onChange={e => setImportForm(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white">
                    <option value="">Chọn NCC...</option>
                    {suppliers.map(s => <option key={s.customer_code} value={s.customer_code}>{s.full_name}</option>)}
                  </select>
                  <p className="text-[10px] text-blue-500 mt-1">Đồng bộ từ danh sách đối tác trong Cashflow App</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Số lượng nhập *</label>
                  <input type="number" required min={0.01} step={0.01} value={importForm.inputQuantity}
                    onChange={e => setImportForm(prev => ({ ...prev, inputQuantity: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-bold text-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Đơn giá nhập (₫)</label>
                  <input type="number" min={0} value={importForm.unitPrice}
                    onChange={e => setImportForm(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-bold text-blue-700" />
                </div>
              </div>

              {/* Price variance indicator */}
              {importForm.productCode && importForm.unitPrice > 0 && (() => {
                const product = products.find(p => p.businessCode === importForm.productCode);
                if (!product?.standardInputPrice) return null;
                const variance = ((importForm.unitPrice - product.standardInputPrice) / product.standardInputPrice) * 100;
                const config = appSettingsService.getSettings().priceVarianceConfig;
                const needsApproval = config && Math.abs(variance) > config.tolerancePercentage;
                return (
                  <div className={`p-3 rounded-xl text-xs border flex items-center justify-between ${needsApproval ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    <span>Giá chuẩn: <strong>{product.standardInputPrice.toLocaleString()}₫</strong></span>
                    <span className="font-black">{variance > 0 ? '+' : ''}{variance.toFixed(1)}% {needsApproval ? '⚠️ Cần duyệt' : '✅ Hợp lệ'}</span>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tổng thanh toán</label>
                  <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 rounded-xl font-black text-blue-800 dark:text-blue-300">
                    {(importForm.inputQuantity * importForm.unitPrice).toLocaleString()}₫
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ngày nhập</label>
                  <input type="date" value={importForm.date}
                    onChange={e => setImportForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ghi chú</label>
                <textarea rows={2} value={importForm.notes}
                  onChange={e => setImportForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm" />
              </div>

              <button type="submit" disabled={loading || !importForm.productCode}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                {loading ? 'Đang ghi nhận...' : '📥 Ghi nhận Nhập Sổ'}
              </button>
            </form>
          </div>
        )}

        {/* ─── BULK IMPORT ─── */}
        {activeTab === 'bulk' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-8">
            <InventoryBulkImport
              type="warehouse_accountant"
              onImportComplete={() => navigate('/inventory-records')}
              onCancel={() => setActiveTab('export')}
            />
          </div>
        )}

        {/* Info */}
        {activeTab !== 'bulk' && (
          <div className="mt-5 p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 rounded-2xl">
            <h4 className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest mb-2">Lưu ý nghiệp vụ</h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5 font-medium opacity-80">
              <li>• <strong>Xuất Sổ</strong>: Chọn từ Đơn Bán Hàng của Sales App để tự động điền thông tin và trừ tồn sổ.</li>
              <li>• <strong>Nhập Sổ</strong>: Chọn NCC từ danh sách Cashflow App. Hệ thống tự kiểm tra giá so với giá chuẩn.</li>
              <li>• Giá vượt ngưỡng dung sai sẽ tự động được đánh dấu <strong>"Cần duyệt"</strong>.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseAccountantImportPage;
