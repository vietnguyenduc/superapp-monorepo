import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoodsReceiptForm, { GoodsReceiptFormData } from '../components/Form/GoodsReceiptForm';
import GoodsReceiptBulkGrid, { BulkGoodsReceiptRow } from '../components/GoodsReceiptBulkGrid';
import { goodsReceiptService } from '../services/goodsReceiptService';
import { supplierService, Supplier } from '../services/supplierService';
import { useProducts } from '../hooks/useProducts';
import { InventorySourceType } from '../types';

type SubTab = 'po' | 'gr' | 'return';
type ImportMode = 'single' | 'bulk';

const SUB_TAB_CONFIG: { id: SubTab; label: string; icon: string; desc: string }[] = [
  { id: 'po', label: 'Đặt hàng (PO)', icon: '📋', desc: 'Lập đơn đặt hàng tới NCC' },
  { id: 'gr', label: 'Nhận hàng (GR)', icon: '📦', desc: 'Kiểm đếm & nhập kho' },
  { id: 'return', label: 'Trả hàng NCC', icon: '↩️', desc: 'Trả/đổi hàng lỗi với NCC' },
];

const MODE_CONFIG: { id: ImportMode; label: string; icon: string }[] = [
  { id: 'single', label: 'Nhập từng dòng', icon: '📝' },
  { id: 'bulk', label: 'Nhập hàng loạt', icon: '📊' },
];

const GoodsReceiptImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubTab = (searchParams.get('subTab') as SubTab) || 'gr';
  const initialMode = (searchParams.get('tab') as ImportMode) || 'single';

  const [activeSubTab, setActiveSubTab] = useState<SubTab>(initialSubTab);
  const [activeMode, setActiveMode] = useState<ImportMode>(initialMode);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const { products } = useProducts();

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      const res = await supplierService.getSuppliers();
      if (res.success && res.data) {
        setSuppliers(res.data);
      }
    };
    loadSuppliers();
  }, []);

  // Load records based on sub-tab
  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const sourceType =
        activeSubTab === 'po'
          ? InventorySourceType.PURCHASE_ORDER
          : activeSubTab === 'gr'
            ? InventorySourceType.GOODS_RECEIPT
            : InventorySourceType.SUPPLIER_RETURN;

      const res = await goodsReceiptService.getGoodsReceipts({ sourceType });
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeSubTab]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleSubTabChange = (tab: SubTab) => {
    setActiveSubTab(tab);
    setSearchParams({ subTab: tab, tab: activeMode });
  };

  const handleModeChange = (mode: ImportMode) => {
    setActiveMode(mode);
    setSearchParams({ subTab: activeSubTab, tab: mode });
  };

  const getSourceType = (): InventorySourceType => {
    if (activeSubTab === 'po') return InventorySourceType.PURCHASE_ORDER;
    if (activeSubTab === 'gr') return InventorySourceType.GOODS_RECEIPT;
    return InventorySourceType.SUPPLIER_RETURN;
  };

  const handleSingleSubmit = async (data: GoodsReceiptFormData) => {
    setIsSaving(true);
    try {
      const res = await goodsReceiptService.createGoodsReceipt({
        date: data.date,
        productCode: data.productCode,
        inputQuantity: data.quantity,
        unitPrice: data.unitPrice,
        supplierId: suppliers.find((s) => s.customer_code === data.supplierCode)?.id,
        supplierName: suppliers.find((s) => s.customer_code === data.supplierCode)?.full_name,
        notes: data.notes,
        sourceType: getSourceType(),
      });
      if (res.success) {
        showNotification('success', 'Lưu phiếu thành công!');
        loadRecords();
      } else {
        showNotification('error', res.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSave = async (rows: BulkGoodsReceiptRow[]) => {
    setIsSaving(true);
    try {
      const inputs = rows.map((r) => ({
        date: r.date,
        productCode: r.product_code,
        inputQuantity: parseFloat(r.quantity) || 0,
        unitPrice: parseFloat(r.unit_price) || 0,
        supplierId: suppliers.find((s) => s.customer_code === r.supplier_code)?.id,
        supplierName: suppliers.find((s) => s.customer_code === r.supplier_code)?.full_name,
        notes: r.notes,
        sourceType: getSourceType(),
      }));
      const res = await goodsReceiptService.bulkCreateGoodsReceipts(inputs);
      if (res.success && res.data) {
        const { created, errors } = res.data;
        if (errors.length > 0) {
          showNotification('error', `Đã lưu ${created} dòng. Lỗi: ${errors.length} dòng.`);
        } else {
          showNotification('success', `Đã lưu ${created} dòng thành công!`);
        }
        loadRecords();
      }
    } catch (err) {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  const subTabConfig = SUB_TAB_CONFIG.find((t) => t.id === activeSubTab)!;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/goods-receipts')}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                title="Quay lại"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-11 h-11 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-2xl">
                📥
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nhập hàng</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Đặt hàng · Nhận hàng · Trả hàng NCC
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-tabs (PO / GR / Return) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
          <div className="grid grid-cols-3 gap-3">
            {SUB_TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleSubTabChange(tab.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  activeSubTab === tab.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{tab.icon}</span>
                  <span className={`font-semibold text-sm ${activeSubTab === tab.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {tab.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{tab.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Import mode tabs (single / bulk) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
          <div className="flex gap-2 mb-4">
            {MODE_CONFIG.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeMode === mode.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span>{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>

          {/* Notification */}
          {notification && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                notification.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Form / Grid */}
          {activeMode === 'single' ? (
            <GoodsReceiptForm
              onSubmit={handleSingleSubmit}
              onCancel={() => navigate('/goods-receipts')}
              suppliers={suppliers}
              products={products}
              isLoading={isSaving}
            />
          ) : (
            <GoodsReceiptBulkGrid
              onSave={handleBulkSave}
              onCancel={() => navigate('/goods-receipts')}
              isLoading={isSaving}
            />
          )}
        </div>

        {/* Records list */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {subTabConfig.icon} {subTabConfig.label} — Danh sách phiếu
            </h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có phiếu nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3">Ngày</th>
                    <th className="px-4 py-3">Mã hàng</th>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Số lượng</th>
                    <th className="px-4 py-3">Đơn giá</th>
                    <th className="px-4 py-3">NCC</th>
                    <th className="px-4 py-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {records.slice(0, 20).map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {r.date instanceof Date ? r.date.toLocaleDateString('vi-VN') : r.date}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {r.productCode}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {r.productName}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {r.inputQuantity || r.outputQuantity || 0}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {r.unitPrice ? r.unitPrice.toLocaleString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {r.supplierName || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-xs">
                        {r.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoodsReceiptImportPage;
