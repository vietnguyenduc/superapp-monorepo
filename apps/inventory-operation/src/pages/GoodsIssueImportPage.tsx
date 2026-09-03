import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoodsIssueForm, { GoodsIssueFormData } from '../components/Form/GoodsIssueForm';
import GoodsIssueBulkGrid, { BulkGoodsIssueRow } from '../components/GoodsIssueBulkGrid';
import { goodsIssueService, SalesSyncRecord } from '../services/goodsIssueService';
import { useProducts } from '../hooks/useProducts';

type MainMode = 'manual' | 'sales_sync';
type ImportMode = 'single' | 'bulk';

const MODE_CONFIG: { id: MainMode; label: string; icon: string; desc: string }[] = [
  { id: 'manual', label: 'Nhập thủ công', icon: '✍️', desc: 'Nhập phiếu xuất bằng form hoặc Excel' },
  { id: 'sales_sync', label: 'Đồng bộ Sales', icon: '🔄', desc: 'Tự động tạo phiếu xuất từ dữ liệu bán hàng' },
];

const GoodsIssueImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = (searchParams.get('mode') as MainMode) || 'manual';
  const initialImportMode = (searchParams.get('tab') as ImportMode) || 'single';

  const [activeMode, setActiveMode] = useState<MainMode>(initialMode);
  const [importMode, setImportMode] = useState<ImportMode>(initialImportMode);
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Sales sync state
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [salesRecords, setSalesRecords] = useState<SalesSyncRecord[]>([]);
  const [selectedSalesIds, setSelectedSalesIds] = useState<Set<string>>(new Set());
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { products } = useProducts();

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load existing goods issues
  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await goodsIssueService.getGoodsIssues();
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleModeChange = (mode: MainMode) => {
    setActiveMode(mode);
    setSearchParams({ mode, tab: importMode });
  };

  const handleImportModeChange = (mode: ImportMode) => {
    setImportMode(mode);
    setSearchParams({ mode: activeMode, tab: mode });
  };

  // Manual submit
  const handleSingleSubmit = async (data: GoodsIssueFormData) => {
    setIsSaving(true);
    try {
      const res = await goodsIssueService.createGoodsIssue({
        date: data.date,
        productCode: data.productCode,
        outputQuantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
      });
      if (res.success) {
        showNotification('success', 'Lưu phiếu xuất thành công!');
        loadRecords();
      } else {
        showNotification('error', res.error || 'Có lỗi xảy ra');
      }
    } catch {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSave = async (rows: BulkGoodsIssueRow[]) => {
    setIsSaving(true);
    try {
      const inputs = rows.map((r) => ({
        date: r.date,
        productCode: r.product_code,
        outputQuantity: parseFloat(r.quantity) || 0,
        reason: r.reason,
        notes: r.notes,
      }));
      const res = await goodsIssueService.bulkCreateGoodsIssues(inputs);
      if (res.success && res.data) {
        const { created, errors } = res.data;
        if (errors.length > 0) {
          showNotification('error', `Đã lưu ${created} dòng. Lỗi: ${errors.length} dòng.`);
        } else {
          showNotification('success', `Đã lưu ${created} dòng thành công!`);
        }
        loadRecords();
      }
    } catch {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
  };

  // Sales sync
  const handleLoadSales = async () => {
    setIsLoadingSales(true);
    setSelectedSalesIds(new Set());
    try {
      const res = await goodsIssueService.getSalesRecordsForSync(dateFrom, dateTo);
      if (res.success && res.data) {
        setSalesRecords(res.data);
        if (res.data.length === 0) {
          showNotification('info', 'Không có dữ liệu bán hàng trong khoảng thời gian này');
        }
      } else {
        showNotification('error', res.error || 'Không thể tải dữ liệu bán hàng');
      }
    } catch {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại');
    } finally {
      setIsLoadingSales(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedSalesIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const unsynced = salesRecords.filter((r) => !r.alreadySynced);
    if (selectedSalesIds.size === unsynced.length) {
      setSelectedSalesIds(new Set());
    } else {
      setSelectedSalesIds(new Set(unsynced.map((r) => r.id)));
    }
  };

  const handleSync = async () => {
    if (selectedSalesIds.size === 0) return;
    setIsSyncing(true);
    try {
      const selected = salesRecords.filter((r) => selectedSalesIds.has(r.id));
      const res = await goodsIssueService.syncFromSalesRecords(selected);
      if (res.success && res.data) {
        const { created, skipped, errors } = res.data;
        showNotification(
          'success',
          `Đã đồng bộ ${created} phiếu xuất${skipped > 0 ? `, bỏ qua ${skipped} đã sync` : ''}${
            errors.length > 0 ? `, ${errors.length} lỗi` : ''
          }`
        );
        loadRecords();
        // Refresh sales list to update alreadySynced flags
        handleLoadSales();
      } else {
        showNotification('error', res.error || 'Lỗi đồng bộ');
      }
    } catch {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/goods-issues')}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
              title="Quay lại"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-11 h-11 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-2xl">
              📤
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Xuất hàng</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nhập phiếu xuất thủ công hoặc đồng bộ từ Sales
              </p>
            </div>
          </div>
        </div>

        {/* Main mode tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
          <div className="grid grid-cols-2 gap-3">
            {MODE_CONFIG.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  activeMode === mode.id
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{mode.icon}</span>
                  <span className={`font-semibold text-sm ${activeMode === mode.id ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {mode.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`p-3 rounded-lg text-sm ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : notification.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Content */}
        {activeMode === 'manual' ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleImportModeChange('single')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  importMode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                📝 Nhập từng dòng
              </button>
              <button
                onClick={() => handleImportModeChange('bulk')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  importMode === 'bulk'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                📊 Nhập hàng loạt
              </button>
            </div>

            {importMode === 'single' ? (
              <GoodsIssueForm
                onSubmit={handleSingleSubmit}
                onCancel={() => navigate('/goods-issues')}
                products={products}
                isLoading={isSaving}
              />
            ) : (
              <GoodsIssueBulkGrid
                onSave={handleBulkSave}
                onCancel={() => navigate('/goods-issues')}
                isLoading={isSaving}
              />
            )}
          </div>
        ) : (
          /* Sales sync mode */
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 space-y-4">
            {/* Date range + load button */}
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleLoadSales}
                disabled={isLoadingSales}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300"
              >
                {isLoadingSales ? 'Đang tải...' : '🔄 Tải dữ liệu bán hàng'}
              </button>
            </div>

            {/* Sales records table */}
            {salesRecords.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedSalesIds.size === salesRecords.filter((r) => !r.alreadySynced).length
                        ? 'Bỏ chọn tất cả'
                        : 'Chọn tất cả (chưa sync)'}
                    </button>
                    <span className="text-sm text-gray-500">
                      Đã chọn: {selectedSalesIds.size} / {salesRecords.length}
                    </span>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={selectedSalesIds.size === 0 || isSyncing}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isSyncing ? 'Đang đồng bộ...' : `Tạo ${selectedSalesIds.size} phiếu xuất`}
                  </button>
                </div>

                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 w-10">
                          <input
                            type="checkbox"
                            checked={selectedSalesIds.size === salesRecords.filter((r) => !r.alreadySynced).length && salesRecords.filter((r) => !r.alreadySynced).length > 0}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="px-3 py-2">Ngày</th>
                        <th className="px-3 py-2">Mã hàng</th>
                        <th className="px-3 py-2">Sản phẩm</th>
                        <th className="px-3 py-2">Số lượng</th>
                        <th className="px-3 py-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {salesRecords.map((sr) => (
                        <tr
                          key={sr.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${sr.alreadySynced ? 'opacity-50' : ''}`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedSalesIds.has(sr.id)}
                              onChange={() => handleToggleSelect(sr.id)}
                              disabled={sr.alreadySynced}
                              className="rounded"
                            />
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{sr.date}</td>
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                            {sr.productCode || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                            {sr.productName || '—'}
                          </td>
                          <td className="px-3 py-2 text-gray-900 dark:text-white">
                            {sr.sales_quantity} {sr.unit}
                          </td>
                          <td className="px-3 py-2">
                            {sr.alreadySynced ? (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                ✓ Đã đồng bộ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                Chưa đồng bộ
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {salesRecords.length === 0 && !isLoadingSales && (
              <div className="text-center py-8 text-gray-500">
                Chọn khoảng thời gian và nhấn "Tải dữ liệu bán hàng" để bắt đầu
              </div>
            )}
          </div>
        )}

        {/* Existing goods issues list */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              📋 Phiếu xuất hàng gần đây
            </h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Đang tải...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Chưa có phiếu xuất nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3">Ngày</th>
                    <th className="px-4 py-3">Mã hàng</th>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Số lượng</th>
                    <th className="px-4 py-3">Nguồn</th>
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
                        {r.outputQuantity || 0}
                      </td>
                      <td className="px-4 py-3">
                        {r.sourceType === 'sales_sync' ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            🔄 Sales sync
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            ✍️ Thủ công
                          </span>
                        )}
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

export default GoodsIssueImportPage;
