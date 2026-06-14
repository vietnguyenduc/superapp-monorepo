﻿﻿import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inventoryVarianceService } from '../services/inventoryVarianceService';
import { INVENTORY_VIEWS } from '../types/InventoryMovement';
import { getTrialInventoryRecords, seedTrialDataIfNeeded } from '../data/trialMockData';
import InventoryMovementLedger from '../components/InventoryMovementLedger';
import { useProducts } from '../hooks/useProducts';
import { useAuthContext, useCompany } from '@superapp/iam';
import { UserRole } from '../types/UserRole';
import { ConversionEngine } from '../utils/conversionLogic';

const InventoryRecordsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'operational_ledger';
  const initialProductCode = searchParams.get('productCode') || '';
  const { user } = useAuthContext();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id || 'trial-company';
  
  const [activeView, setActiveView] = useState<string>(initialTab);
  const [searchText, setSearchText] = useState(initialProductCode);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'book' | 'actual'>('all');
  const [varianceFilter, setVarianceFilter] = useState<'all' | 'matched' | 'variance'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formFilter, setFormFilter] = useState<'all' | 'raw' | 'processed' | 'finished'>('all');
  const [viewMode, setViewMode] = useState<'standard' | 'equivalent'>('standard');
  const [targetReportUnitMode, setTargetReportUnitMode] = useState<'purchase' | 'intermediate' | 'output'>('purchase');
  const [timeFilter, setTimeFilter] = useState('all');
  const [reports, setReports] = useState<any[]>([]);

  const { products } = useProducts();
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats);
  }, [products]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Trial mode: load from localStorage mock data
        const isTrial = localStorage.getItem('isTrial') === 'true';
        if (isTrial) {
          seedTrialDataIfNeeded();
          const trialRecords = getTrialInventoryRecords();
          // Map trial inventory records to the variance report format
          const mappedRecords = trialRecords.map(r => {
            const inQty = r.inputQuantity || 0;
            const outQty = r.outputQuantity || 0;
            const bookInv = (r.rawMaterialStock || 0) + (r.processedStock || 0) + (r.finishedProductStock || 0);
            
            return {
              id: r.id,
              date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
              productCode: r.productCode,
              productName: r.productName,
              beginning_inventory: bookInv + outQty - inQty,
              inbound_quantity: inQty,
              book_inventory: bookInv,
              actual_inventory: bookInv,
              sales_quantity: outQty,
              promotion_quantity: 0,
              special_outbound_quantity: 0,
              variance: 0,
              notes: r.notes || '',
              created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
            };
          });
          setReports(mappedRecords);
          console.log('🧪 Trial mode: loaded', mappedRecords.length, 'inventory records for table');
          return;
        }

        console.log('🔄 Loading variance reports from database...');
        const data = await inventoryVarianceService.getReports();
        console.log('✅ Variance reports loaded:', data.length, 'records');
        
        if (data.length === 0) {
          console.warn('⚠️ No variance reports found in database');
          setReports([]);
        } else {
          setReports(data);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Error loading variance reports:', errorMessage);
        setError(`Lỗi tải dữ liệu: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, []);

  // Get current view config
  const currentView = INVENTORY_VIEWS[activeView] || INVENTORY_VIEWS.operational_ledger;
  
  // Memoized product lookup map for O(1) performance
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      map.set(p.id, p);
      if (p.businessCode) map.set(p.businessCode, p);
    });
    return map;
  }, [products]);

  const filteredRecords = useMemo(() => {
    const filtered = reports.filter((record: any) => {
      // Search filter
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const matchesSearch =
          (record.productName || '').toLowerCase().includes(q) ||
          (record.productCode || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Use canonical fields from inventory_variance_reports
      const tonSo = Number(record.book_inventory) || 0;
      const tonThat = Number(record.actual_inventory) || 0;
      const hasVariance = tonSo !== tonThat;

      // Source filter
      const inferredSource = tonSo === tonThat ? 'book' : tonThat > 0 ? 'actual' : 'book';
      const matchesSource = sourceFilter === 'all' || inferredSource === sourceFilter;
      const matchesVariance =
        varianceFilter === 'all' ||
        (varianceFilter === 'matched' && !hasVariance) ||
        (varianceFilter === 'variance' && hasVariance);

      // Category filter
      let matchesCategory = true;
      if (categoryFilter !== 'all') {
        const product = productMap.get(record.productCode);
        if (product && product.category !== categoryFilter) matchesCategory = false;
        if (!product) matchesCategory = false;
      }

      // Time filter
      let matchesTime = true;
      if (timeFilter !== 'all' && record.date) {
        const recordDate = new Date(record.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (timeFilter === 'today') {
          matchesTime = recordDate >= today;
        } else if (timeFilter === 'this_week') {
          const firstDay = new Date(today.setDate(today.getDate() - today.getDay() + 1));
          matchesTime = recordDate >= firstDay;
        } else if (timeFilter === 'this_month') {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          matchesTime = recordDate >= firstDay;
        }
      }

      // Form Filter (Type of stock)
      let matchesForm = true;
      if (formFilter !== 'all') {
        if (formFilter === 'raw' && (record.raw_material_stock || record.rawMaterialStock) === undefined) matchesForm = false;
        if (formFilter === 'processed' && (record.processed_stock || record.processedStock) === undefined) matchesForm = false;
        if (formFilter === 'finished' && (record.finished_product_stock || record.finishedProductStock) === undefined) matchesForm = false;
      }

      return matchesSource && matchesVariance && matchesCategory && matchesTime && matchesForm;
    });
    
    return filtered;
  }, [reports, searchText, sourceFilter, varianceFilter, categoryFilter, timeFilter, productMap]);

  const summary = useMemo(() => {
    return filteredRecords.reduce((acc, record: any) => {
      let inQty = Number(record.inbound_quantity) || 0;
      let tonSo = Number(record.book_inventory) || 0;
      let tonThat = Number(record.actual_inventory) || 0;
      let xuat = (Number(record.sales_quantity) || 0) + (Number(record.promotion_quantity) || 0) + (Number(record.special_outbound_quantity) || 0);

      if (viewMode === 'equivalent') {
        const product = products.find(p => p.id === record.productCode || p.businessCode === record.productCode);
        if (product) {
          let targetUnit = product.inputUnit;
          if (targetReportUnitMode === 'intermediate') targetUnit = product.intermediateUnits?.[0] || product.inputUnit;
          else if (targetReportUnitMode === 'output') targetUnit = product.outputUnit || product.inputUnit;

          // Convert all values
          inQty = ConversionEngine.convert(product, record.rawMaterialUnit || product.inputUnit, targetUnit, inQty).convertedValue;
          
          // For inventory, we need to sum converted components if standard record, or convert equivalent if provided
          const rawStock = record.raw_material_stock ?? record.rawMaterialStock ?? 0;
          const procStock = record.processed_stock ?? record.processedStock ?? 0;
          const finStock = record.finished_product_stock ?? record.finishedProductStock ?? 0;

          const rawVal = ConversionEngine.convert(product, record.rawMaterialUnit || product.inputUnit, targetUnit, rawStock).convertedValue;
          const procVal = ConversionEngine.convert(product, record.processedUnit || product.intermediateUnits?.[0] || product.inputUnit, targetUnit, procStock).convertedValue;
          const finVal = ConversionEngine.convert(product, record.finishedProductUnit || product.outputUnit || product.inputUnit, targetUnit, finStock).convertedValue;
          
          tonThat = rawVal + procVal + finVal;
          
          // Approximate tonSo conversion (since it's a single number usually in base unit)
          tonSo = ConversionEngine.convert(product, product.inputUnit, targetUnit, tonSo).convertedValue;
          xuat = ConversionEngine.convert(product, product.outputUnit || product.inputUnit, targetUnit, xuat).convertedValue;
        }
      }

      acc.totalNhap += inQty;
      acc.totalTonSo += tonSo;
      acc.totalTonThat += tonThat;
      acc.totalXuat += xuat;
      return acc;
    }, { totalNhap: 0, totalXuat: 0, totalTonSo: 0, totalTonThat: 0 });
  }, [filteredRecords, viewMode, targetReportUnitMode, productMap]);

  const summaryDisplay = useMemo(() => ({
    ...summary,
    chenhlech: summary.totalTonThat - summary.totalTonSo
  }), [summary]);

  // Role-based visibility flags
  const isAccountant = user?.role === UserRole.WAREHOUSE_ACCOUNTANT;
  const isKeeper = user?.role === UserRole.WAREHOUSE_KEEPER;
  const showBookInventory = !isKeeper; // Accountant, Admin, etc. see Book
  const showActualInventory = !isAccountant; // Keeper, Admin, etc. see Actual
  const showVariance = !isAccountant && !isKeeper; // Only Admin sees Variance

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6 transition-colors">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Quản lý Xuất Nhập Tồn</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                Theo dõi giao dịch xuất - nhập - tồn, so sánh tồn sổ và tồn thật.
              </p>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6 transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Trạng thái kho</label>
              <select
                value={formFilter}
                onChange={(e) => setFormFilter(e.target.value as any)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="raw">Nguyên vật liệu</option>
                <option value="processed">Sơ chế</option>
                <option value="finished">Thành phẩm</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Chế độ xem</label>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('standard')}
                  className={`flex-1 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-lg transition-all ${
                    viewMode === 'standard' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Chi tiết
                </button>
                <button
                  onClick={() => setViewMode('equivalent')}
                  className={`flex-1 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium rounded-lg transition-all ${
                    viewMode === 'equivalent' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  Quy đổi
                </button>
              </div>
            </div>

            {viewMode === 'equivalent' && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300 sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">Đơn vị quy đổi</label>
                <div className="flex bg-blue-50 dark:bg-blue-900/20 p-1 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <button
                    onClick={() => setTargetReportUnitMode('purchase')}
                    className={`flex-1 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                      targetReportUnitMode === 'purchase' ? 'bg-blue-600 shadow-md text-white' : 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                    }`}
                  >
                    🛒 Nhập
                  </button>
                  <button
                    onClick={() => setTargetReportUnitMode('intermediate')}
                    className={`flex-1 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                      targetReportUnitMode === 'intermediate' ? 'bg-blue-600 shadow-md text-white' : 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                    }`}
                  >
                    🔪 Sơ chế
                  </button>
                  <button
                    onClick={() => setTargetReportUnitMode('output')}
                    className={`flex-1 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                      targetReportUnitMode === 'output' ? 'bg-blue-600 shadow-md text-white' : 'text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                    }`}
                  >
                    🍽️ Bán lẻ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 sm:p-5 transition-colors">
            <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Xuất</div>
            <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400 truncate">
              {summaryDisplay.totalXuat.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 sm:p-5 transition-colors">
            <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Nhập</div>
            <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 truncate">
              {summaryDisplay.totalNhap.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
          </div>
          {showBookInventory && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 sm:p-5 transition-colors">
              <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Tồn sổ</div>
              <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate">
                {summaryDisplay.totalTonSo.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
            </div>
          )}
          {showActualInventory && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 sm:p-5 transition-colors">
              <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Tồn thật</div>
              <div className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400 truncate">
                {summaryDisplay.totalTonThat.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
            </div>
          )}
          {showVariance && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 sm:p-5 transition-colors">
              <div className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">Lệch kho</div>
              <div className={`mt-1 sm:mt-2 text-lg sm:text-2xl font-bold truncate ${summaryDisplay.chenhlech === 0 ? 'text-gray-900 dark:text-gray-100' : 'text-rose-600 dark:text-rose-400'}`}>
                {summaryDisplay.chenhlech.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </div>
            </div>
          )}
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
          <div className="border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 pt-3 sm:pt-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Title */}
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Danh sách giao dịch</h2>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{filteredRecords.length} bản ghi</span>
              </div>

              {/* Role-based view selector */}
              <div className="flex gap-1 sm:gap-2 pb-2 sm:pb-3 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveView('operational_ledger')}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeView === 'operational_ledger'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Sổ vận hành
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('accounting_summary')}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeView === 'accounting_summary'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Báo cáo XNT
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('variance_view')}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeView === 'variance_view'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  Chênh lệch
                </button>
              </div>
            </div>
          </div>

          {activeView === 'operational_ledger' ? (
            <div className="border-t border-gray-100 dark:border-gray-800">
              <InventoryMovementLedger companyId={companyId} productCode={searchParams.get('productCode') || undefined} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              {error && (
                <div className="px-4 sm:px-6 pt-4 sm:pt-6 text-xs sm:text-sm text-red-600 dark:text-red-400">{error}</div>
              )}
            {isLoading ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-500 mt-2 sm:mt-3 text-xs sm:text-sm">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <table className="min-w-[700px] sm:min-w-full w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">Ngày</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">Sản phẩm</th>
                    {viewMode === 'standard' ? (
                      <>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Tồn NVL</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Tồn Sơ chế</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Tồn TP</th>
                      </>
                    ) : (
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider text-right">
                        Tồn quy đổi
                      </th>
                    )}
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Lệch kho</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {filteredRecords.map((record: any, index: number) => {
                    const product = products.find(p => p.id === record.productCode || p.businessCode === record.productCode);
                    const allowedForms = product?.allowedForms || ['raw', 'processed', 'finished'];
                    
                    const rawStock = record.raw_material_stock ?? record.rawMaterialStock;
                    const processedStock = record.processed_stock ?? record.processedStock;
                    const finishedStock = record.finished_product_stock ?? record.finishedProductStock;
                    const equivalentStock = record.equivalent_stock ?? record.equivalentStock;

                    return (
                      <tr key={record.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {record.date ? new Date(record.date).toLocaleDateString('vi-VN') : '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          <div className="truncate max-w-[120px] sm:max-w-none">{record.productName || '-'}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">{record.productCode}</div>
                        </td>
                        
                        {viewMode === 'standard' ? (
                          <>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm text-right whitespace-nowrap">
                              {allowedForms.includes('raw') ? (
                                <span className="font-medium text-gray-900 dark:text-gray-100">{rawStock ?? 0} <span className="text-[9px] sm:text-xs text-gray-400">{record.rawMaterialUnit}</span></span>
                              ) : (
                                <span className="text-gray-300 dark:text-gray-600 italic text-[10px] sm:text-xs">N/A</span>
                              )}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm text-right whitespace-nowrap">
                              {allowedForms.includes('processed') ? (
                                <span className="font-medium text-gray-900 dark:text-gray-100">{processedStock ?? 0} <span className="text-[9px] sm:text-xs text-gray-400">{record.processedUnit}</span></span>
                              ) : (
                                <span className="text-gray-300 dark:text-gray-600 italic text-[10px] sm:text-xs">N/A</span>
                              )}
                            </td>
                            <td className="px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm text-right whitespace-nowrap">
                              {allowedForms.includes('finished') ? (
                                <span className="font-medium text-gray-900 dark:text-gray-100">{finishedStock ?? 0} <span className="text-[9px] sm:text-xs text-gray-400">{record.finishedProductUnit}</span></span>
                              ) : (
                                <span className="text-gray-300 dark:text-gray-600 italic text-[10px] sm:text-xs">N/A</span>
                              )}
                            </td>
                          </>
                        ) : (() => {
                          const product = products.find(p => p.id === record.productCode || p.businessCode === record.productCode);
                          if (!product) return <td className="px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm text-right text-gray-300 dark:text-gray-600 italic">N/A</td>;

                          let targetUnit = product.inputUnit;
                          if (targetReportUnitMode === 'intermediate') targetUnit = product.intermediateUnits?.[0] || product.inputUnit;
                          else if (targetReportUnitMode === 'output') targetUnit = product.outputUnit || product.inputUnit;

                          const rawVal = ConversionEngine.convert(product, record.rawMaterialUnit || product.inputUnit, targetUnit, rawStock || 0).convertedValue;
                          const procVal = ConversionEngine.convert(product, record.processedUnit || product.intermediateUnits?.[0] || product.inputUnit, targetUnit, processedStock || 0).convertedValue;
                          const finVal = ConversionEngine.convert(product, record.finishedProductUnit || product.outputUnit || product.inputUnit, targetUnit, finishedStock || 0).convertedValue;
                          
                          const totalEquivalent = rawVal + procVal + finVal;

                          return (
                            <td className="px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm text-right whitespace-nowrap">
                              <span className="font-black text-blue-600 dark:text-blue-400 text-sm sm:text-lg">{totalEquivalent.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                              <span className="ml-0.5 sm:ml-1 text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase">{targetUnit}</span>
                            </td>
                          );
                        })()}

                        <td className={`px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm text-right font-medium whitespace-nowrap ${record.variance === 0 ? 'text-gray-700 dark:text-gray-300' : 'text-rose-600 dark:text-rose-400'}`}>
                          {record.variance || 0}
                        </td>
                        <td className="px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[80px] sm:max-w-[150px]">
                          {record.notes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Không có giao dịch phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryRecordsPage;
