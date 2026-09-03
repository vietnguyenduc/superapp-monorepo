// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useProducts } from "../hooks/useProducts";
import { useInventory } from "../hooks/useInventory";
import { useSalesReport } from "../hooks/useSales";
import { formatNumber } from "../utils/formatting";
import LoadingFallback from "../components/UI/LoadingFallback";
import ErrorFallback from "../components/UI/ErrorFallback";
import Button from "../components/UI/Button";
import appSettingsService from "../services/appSettingsService";
import InventoryMetricsCard from "../components/InventoryMetricsCard";
import InventoryTimeRangeSelector, { InventoryTimeRange } from "../components/InventoryTimeRangeSelector";
import InventoryVarianceReportPage from "./InventoryVarianceReportPage";
import InventoryExportPage from "./InventoryExportPage";
import FeaturedProducts from "../components/Dashboard/FeaturedProducts";
import InventoryWaterfallChart from "../components/Dashboard/InventoryWaterfallChart";

const DashboardPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [timeRange, setTimeRange] = useState<InventoryTimeRange>("month");
  const [rangeCount, setRangeCount] = useState<Record<string, number>>({
    day: 24,
    week: 7,
    month: 30,
    quarter: 4,
    year: 12,
  });
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeTab = searchParams.get("tab") || "overview";
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [topStockSort, setTopStockSort] = useState<"desc" | "asc">("desc");
  const [topStockType, setTopStockType] = useState<"all" | "rawMaterial" | "processed" | "finished">("all");
  const isCommercial = appSettingsService.isCommercial();
  
  const { products, loading: productsLoading } = useProducts();
  const { records: rawInventoryRecords, isLoading: inventoryLoading } = useInventory();
  const { salesRecords: rawSalesRecords, loading: salesLoading } = useSalesReport();
  
  // Memoized product lookup map for O(1) performance
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      map.set(p.id, p);
      if (p.businessCode) map.set(p.businessCode, p);
    });
    return map;
  }, [products]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats);
  }, [products]);

  const availableProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const inventoryRecords = useMemo(() => {
    return rawInventoryRecords.filter(r => {
      const p = productMap.get(r.productCode);
      if (selectedCategory !== "all" && p?.category !== selectedCategory) return false;
      if (selectedProduct !== "all" && (r.productCode !== selectedProduct && p?.id !== selectedProduct)) return false;
      return true;
    });
  }, [rawInventoryRecords, productMap, selectedCategory, selectedProduct]);

  const salesRecords = useMemo(() => {
    return rawSalesRecords.filter(r => {
      const p = productMap.get(r.productCode);
      if (selectedCategory !== "all" && p?.category !== selectedCategory) return false;
      if (selectedProduct !== "all" && (r.productCode !== selectedProduct && p?.id !== selectedProduct)) return false;
      return true;
    });
  }, [rawSalesRecords, productMap, selectedCategory, selectedProduct]);


  // ────────── Compute chart data ──────────
  const chartData = useMemo(() => {
    if (!inventoryRecords.length) return { waterfallData: [], startBalance: 0, lineData: [], categoryData: [] };

    const sorted = [...inventoryRecords].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const latestDate = sorted.length ? new Date(sorted[sorted.length - 1].date) : new Date();
    const groupedData: Record<string, { date: string; dateObj: Date; nhap: number; xuat: number }> = {};
    const count = rangeCount[timeRange] || 7;

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(latestDate);
      let key = '';
      let displayDate = '';

      if (timeRange === 'day') {
        d.setHours(d.getHours() - i, 0, 0, 0);
        key = d.toISOString().substring(0, 13);
        displayDate = `${d.getHours()}h`;
      } else if (timeRange === 'week' || timeRange === 'month') {
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        key = d.toISOString().split('T')[0];
        displayDate = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      } else if (timeRange === 'quarter') {
        d.setMonth(d.getMonth() - i * 3);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        const q = Math.floor(d.getMonth() / 3) + 1;
        key = `${d.getFullYear()}-Q${q}`;
        displayDate = `Q${q}/${d.getFullYear()}`;
      } else if (timeRange === 'year') {
        d.setMonth(d.getMonth() - i);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        displayDate = `T${d.getMonth() + 1}/${d.getFullYear()}`;
      }

      groupedData[key] = { date: displayDate, dateObj: new Date(d), nhap: 0, xuat: 0 };
    }

    const sortedGroups = Object.keys(groupedData).sort().map(k => groupedData[k]);
    const firstBucketDate = sortedGroups.length ? sortedGroups[0].dateObj : new Date();

    let startBalance = 0;
    sorted.forEach(r => {
      const rDate = new Date(r.date);
      let key = '';
      if (timeRange === 'day') key = rDate.toISOString().substring(0, 13);
      else if (timeRange === 'week' || timeRange === 'month') key = rDate.toISOString().split('T')[0];
      else if (timeRange === 'quarter') key = `${rDate.getFullYear()}-Q${Math.floor(rDate.getMonth() / 3) + 1}`;
      else if (timeRange === 'year') key = `${rDate.getFullYear()}-${(rDate.getMonth() + 1).toString().padStart(2, '0')}`;

      const product = productMap.get(r.productCode);
      const allowedForms = product?.allowedForms || ['raw', 'processed', 'finished'];
      
      let totalStock = 0;
      if (allowedForms.includes('raw')) totalStock += (r.rawMaterialStock || 0);
      if (allowedForms.includes('processed')) totalStock += (r.processedStock || 0);
      if (allowedForms.includes('finished')) totalStock += (r.finishedProductStock || 0);

      const out = Math.max(0, (r.inputQuantity || 0) - totalStock);

      if (groupedData[key]) {
        groupedData[key].nhap += r.inputQuantity || 0;
        groupedData[key].xuat += out;
      } else if (rDate < firstBucketDate) {
        startBalance += (r.inputQuantity || 0) - out;
      }
    });

    const waterfallData = sortedGroups.map(item => ({
      date: item.date,
      inflow: item.nhap,
      outflow: item.xuat,
      netFlow: item.nhap - item.xuat
    }));

    // Line chart: running stock level
    let runningStock = 0;
    const lineData = sorted.map(r => {
      const p = productMap.get(r.productCode);
      const allowed = p?.allowedForms || ['raw', 'processed', 'finished'];
      let currentTotal = 0;
      if (allowed.includes('raw')) currentTotal += (r.rawMaterialStock || 0);
      if (allowed.includes('processed')) currentTotal += (r.processedStock || 0);
      if (allowed.includes('finished')) currentTotal += (r.finishedProductStock || 0);

      runningStock += r.inputQuantity || 0;
      runningStock -= Math.max(0, (r.inputQuantity || 0) - currentTotal);
      return {
        date: new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        stock: runningStock,
        product: r.productName,
      };
    }).slice(-20);

    // Category Distribution Pie/Bar Data
    const categoryStockMap: Record<string, number> = {};
    inventoryRecords.forEach(r => {
      const product = productMap.get(r.productCode);
      const category = product?.category || 'Khác';
      const allowed = product?.allowedForms || ['raw', 'processed', 'finished'];
      
      let totalStock = 0;
      if (allowed.includes('raw')) totalStock += (r.rawMaterialStock || 0);
      if (allowed.includes('processed')) totalStock += (r.processedStock || 0);
      if (allowed.includes('finished')) totalStock += (r.finishedProductStock || 0);
      
      categoryStockMap[category] = (categoryStockMap[category] || 0) + totalStock;
    });
    const categoryData = Object.keys(categoryStockMap).map(key => ({
      name: key,
      value: categoryStockMap[key]
    })).sort((a, b) => b.value - a.value);

    return { waterfallData, startBalance, lineData, categoryData };
  }, [inventoryRecords, timeRange, rangeCount, productMap]);

  // ────────── Top stock table ──────────
  const topStockProducts = useMemo(() => {
    if (!inventoryRecords.length) return [];

    // Aggregate latest stock by product
    const latestByProduct: Record<string, { productName: string; code: string; rawMaterial: number; processed: number; finished: number; total: number; date: Date }> = {};
    inventoryRecords.forEach(r => {
      const existing = latestByProduct[r.productCode];
      if (!existing || new Date(r.date) > new Date(existing.date)) {
        const product = productMap.get(r.productCode);
        const allowed = product?.allowedForms || ['raw', 'processed', 'finished'];
        
        let total = 0;
        if (topStockType === 'all') {
          if (allowed.includes('raw')) total += (r.rawMaterialStock || 0);
          if (allowed.includes('processed')) total += (r.processedStock || 0);
          if (allowed.includes('finished')) total += (r.finishedProductStock || 0);
        }
        else if (topStockType === 'rawMaterial' && allowed.includes('raw')) total = r.rawMaterialStock || 0;
        else if (topStockType === 'processed' && allowed.includes('processed')) total = r.processedStock || 0;
        else if (topStockType === 'finished' && allowed.includes('finished')) total = r.finishedProductStock || 0;

        latestByProduct[r.productCode] = {
          productName: r.productName, code: r.productCode,
          rawMaterial: r.rawMaterialStock || 0, processed: r.processedStock || 0,
          finished: r.finishedProductStock || 0, total, date: new Date(r.date),
        };
      }
    });

    let result = Object.values(latestByProduct);
    if (topStockSort === 'desc') {
      result = result.sort((a, b) => b.total - a.total);
    } else {
      result = result.sort((a, b) => a.total - b.total);
    }
    return result.slice(0, 8);
  }, [inventoryRecords, topStockType, topStockSort, productMap]);

  const maxStock = topStockProducts.length ? Math.max(...topStockProducts.map(p => p.total)) : 1;

  // ────────── Recent records ──────────
  const recentRecords = useMemo(() => {
    return [...inventoryRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [inventoryRecords]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.status === 'active').length;
      
      // Get the latest inventory record for each product to calculate current stock value
      const latestRecordsMap = new Map();
      inventoryRecords.forEach(r => {
        const existing = latestRecordsMap.get(r.productCode);
        if (!existing || new Date(r.date) > new Date(existing.date)) {
          latestRecordsMap.set(r.productCode, r);
        }
      });

      const latestRecords = Array.from(latestRecordsMap.values());
      
      // Calculate total inventory value from LATEST stock levels only
      const totalInventoryValue = latestRecords.reduce((sum: number, record: any) => {
        const totalStock = (record.rawMaterialStock || 0) + (record.processedStock || 0) + (record.finishedProductStock || 0);
        return sum + (totalStock * 15000); // Using an average estimated unit price
      }, 0);
      
      // Sales should be summed over the entire period
      const totalSales = salesRecords.reduce((sum: number, record: any) => {
        return sum + (record.quantitySold || 0);
      }, 0);

      // Calculate changes vs previous period (simple estimation for demo)
      const prevTotalSales = totalSales * 0.85; 
      const salesChange = totalSales > 0 ? ((totalSales - prevTotalSales) / prevTotalSales) * 100 : 0;

      setMetrics({
        totalProducts, 
        activeProducts, 
        totalInventoryValue, 
        totalSales,
        salesChange: Math.round(salesChange),
        inventoryRecords: inventoryRecords.slice(0, 20),
        salesRecords: salesRecords.slice(0, 20),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [products, inventoryRecords, salesRecords]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const isLoading = loading || productsLoading || inventoryLoading || salesLoading;

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 py-8 w-full"><div className="px-4 sm:px-6 lg:px-8 w-full">
      <LoadingFallback title="Đang tải dashboard..." message="Đang tải dữ liệu tồn kho" size="lg" />
    </div></div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-50 py-8 w-full"><div className="px-4 sm:px-6 lg:px-8 w-full">
      <ErrorFallback title="Lỗi tải dashboard" message={error} retry={fetchDashboardData} />
    </div></div>
  );
  if (!metrics) return (
    <div className="min-h-screen bg-gray-50 py-8 w-full"><div className="px-4 sm:px-6 lg:px-8 w-full text-center">
      <h3 className="text-lg font-medium text-gray-900">Không có dữ liệu</h3>
    </div></div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 w-full relative transition-colors duration-300">
      {/* Sticky Filter Header - Higher z-index and forced top-16 */}
      <div className="sticky top-16 z-[40] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 border-b border-gray-200 dark:border-gray-800 shadow-md w-full -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-5 lg:-mt-6 !max-w-none mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">Dashboard Tồn Kho</div>
            <select
              className="text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-1.5 px-2 rounded-lg border border-gray-200 dark:border-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedProduct("all"); // Reset product when category changes
                }}
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                className="text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-1.5 px-2 rounded-lg border border-gray-200 dark:border-gray-700 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 max-w-[150px]"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="all">Tất cả sản phẩm</option>
                {availableProducts.map(p => (
                  <option key={p.id} value={p.businessCode || p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-1.5 px-2 rounded-lg border border-gray-200 dark:border-gray-700 w-16 mr-2 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={rangeCount[timeRange] || 1}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 100) {
                      setRangeCount(prev => ({ ...prev, [timeRange]: val }));
                    }
                  }}
                  title="Số lượng kỳ muốn hiển thị"
                />
              </div>
              <div className="relative">
                <button 
                  className="text-xs bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 py-1.5 px-3 rounded-lg border border-red-200 dark:border-red-900/50 font-bold ml-2 transition-colors"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn reset toàn bộ dữ liệu Trial? Tất cả giao dịch tự tạo sẽ bị xóa.')) {
                      import('../data/trialMockData').then(m => {
                        m.seedTrialDataIfNeeded(true);
                        window.location.reload();
                      });
                    }
                  }}
                >
                  Reset Trial
                </button>
                <button className="text-xs bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 py-1.5 px-3 rounded-lg border border-blue-200 dark:border-blue-800 font-bold ml-2 transition-colors"
                  onClick={() => setShowExportMenu(!showExportMenu)}>Export</button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10 min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                      onClick={() => {
                        const ws = XLSX.utils.json_to_sheet(metrics.inventoryRecords);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Inventory");
                        XLSX.writeFile(wb, `inventory_${timeRange}_${new Date().toISOString().split("T")[0]}.xlsx`);
                        setShowExportMenu(false);
                      }}>Export Excel</button>
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                      onClick={() => {
                        const ws = XLSX.utils.json_to_sheet(metrics.salesRecords);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Sales");
                        XLSX.writeFile(wb, `sales_${timeRange}_${new Date().toISOString().split("T")[0]}.xlsx`);
                        setShowExportMenu(false);
                      }}>Export Sales</button>
                  </div>
                )}
              </div>
              <div className="inline-flex rounded-2xl bg-white/90 dark:bg-gray-800/90 p-1 shadow-[0_4px_12px_rgba(15,23,42,0.10)] border border-gray-200/80 dark:border-gray-700/80 ring-1 ring-gray-200/60 dark:ring-gray-700/60">
                <InventoryTimeRangeSelector value={timeRange} onChange={setTimeRange} />
              </div>
            </div>
          </div>
        </div>
      
      {/* Main Content Body */}
      <div className="px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto py-6 space-y-6 transition-colors">
        
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Tồn Kho</h1>
          <p className="text-gray-600 dark:text-gray-400">Tổng quan tình hình tồn kho và giao dịch</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
            <button type="button" onClick={() => setSearchParams(new URLSearchParams())}
              className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-all ${activeTab === "overview" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
              Tổng quan
            </button>
            <button type="button" onClick={() => setSearchParams(new URLSearchParams([["tab", "variance"]]))}
              className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-all ${activeTab === "variance" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
              Báo cáo lệch kho
            </button>
            <button type="button" onClick={() => setSearchParams(new URLSearchParams([["tab", "export"]]))}
              className={`px-4 py-2 rounded-t-xl text-sm font-medium transition-all ${activeTab === "export" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
              Xuất file kiểm kho
            </button>
          </div>
        </div>

        {activeTab === "variance" && <div className="mb-6"><InventoryVarianceReportPage /></div>}
        {activeTab === "export" && <div className="mb-6"><InventoryExportPage /></div>}

        {activeTab === "overview" && (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 w-full min-w-0 overflow-hidden">
              <InventoryMetricsCard title="Tổng sản phẩm" value={formatNumber(metrics.totalProducts)} change={metrics.totalProducts > 0 ? 2 : 0} changeType="increase" icon="products" color="primary" />
              <InventoryMetricsCard title="Sản phẩm hoạt động" value={formatNumber(metrics.activeProducts)} change={metrics.activeProducts > 0 ? 5 : 0} changeType="increase" icon="inventory" color="success" />
              <InventoryMetricsCard title="Giá trị tồn kho" value={formatNumber(metrics.totalInventoryValue)} change={metrics.totalInventoryValue > 0 ? 12 : 0} changeType="increase" icon="warehouse" color="warning" />
              <InventoryMetricsCard title="Tổng bán hàng" value={formatNumber(metrics.totalSales)} change={metrics.salesChange || 0} changeType={metrics.salesChange >= 0 ? "increase" : "decrease"} icon="transactions" color="info" />
            </div>

            {/* Quick Actions */}
            <div className="mb-6 w-full">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full overflow-hidden transition-colors">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Thao tác nhanh</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button variant="primary" size="md" onClick={() => navigate("/inventory-transaction-import?tab=single")} className="flex items-center justify-center font-bold">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      Nhập kho
                    </Button>
                    <Button variant="secondary" size="md" onClick={() => navigate("/product-management")} className="flex items-center justify-center font-bold">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      Sản phẩm
                    </Button>
                    <Button variant="secondary" size="md" onClick={() => navigate("/sales-input")} className="flex items-center justify-center font-bold">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      Báo cáo bán
                    </Button>
                    <Button variant="secondary" size="md" onClick={() => navigate("/variance-report")} className="flex items-center justify-center font-bold">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" /></svg>
                      Báo cáo chênh lệch
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════ CHARTS ═══════ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6 w-full transition-colors">
              {/* Waterfall Chart: Nhập vs Xuất */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">📊 Nhập vs Xuất theo {timeRange === 'day' ? 'ngày' : timeRange === 'week' ? 'tuần' : timeRange === 'month' ? 'tháng' : timeRange === 'year' ? 'năm' : 'kỳ'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Biểu đồ dòng thác chênh lệch tồn kho</p>
                </div>
                <div className="p-4" style={{ height: 320 }}>
                  <InventoryWaterfallChart data={chartData.waterfallData} startBalance={chartData.startBalance} />
                </div>
              </div>

              {/* Line Chart: Stock level trend */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">📈 Xu hướng tồn kho</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tổng tồn theo thời gian</p>
                </div>
                <div className="p-4" style={{ height: 300 }}>
                  {chartData.lineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13, backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="stock" name="Tổng tồn" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-sm italic">Chưa có dữ liệu</div>
                  )}
                </div>
              </div>

              {/* Pie Chart: Category Distribution */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">📦 Tồn kho theo danh mục</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Phân bổ tồn kho theo loại sản phẩm</p>
                </div>
                <div className="p-4" style={{ height: 300 }}>
                  {chartData.categoryData && chartData.categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.categoryData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13, backgroundColor: '#1f2937', border: 'none', color: '#fff' }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 text-sm italic">Chưa có dữ liệu</div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══════ TWO TABLES ═══════ */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 w-full transition-colors">

              {/* Table 1: Giao dịch gần đây */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">📋 Giao dịch gần đây</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">8 giao dịch nhập/xuất mới nhất</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => navigate("/inventory-records")} className="font-bold">Xem tất cả</Button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Ngày</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Loại</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Sản phẩm</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">SL Nhập</th>
                          <th className="px-3 py-2 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Tồn kho</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {recentRecords.map((record: any, index: number) => {
                          const totalStock = (record.rawMaterialStock || 0) + (record.processedStock || 0) + (record.finishedProductStock || 0);
                          const type = record.inputQuantity > 0 ? 'Nhập' : 'Xuất';
                          return (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-300">
                                {new Date(record.date).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="px-3 py-2 text-sm">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  type === 'Nhập' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                }`}>{type}</span>
                              </td>
                              <td 
                                className="px-3 py-2 text-sm text-blue-600 dark:text-blue-400 font-bold max-w-[150px] truncate cursor-pointer hover:underline"
                                onClick={() => navigate(`/inventory-records?productCode=${record.productCode}&tab=operational_ledger`)}
                              >
                                {record.productName}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 font-bold">{record.inputQuantity}</td>
                              <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 font-bold">{totalStock}</td>
                            </tr>
                          );
                        })}
                        {recentRecords.length === 0 && (
                          <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-400 dark:text-gray-600 italic">Chưa có giao dịch</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Table 2: Tồn kho */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">📦 Tồn kho</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Top 8 sản phẩm theo tiêu chí</p>
                    </div>
                    <div className="flex gap-2">
                      <select 
                        className="text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                        value={topStockType}
                        onChange={(e) => setTopStockType(e.target.value as any)}
                      >
                        <option value="all">Tất cả</option>
                        {!isCommercial && <option value="rawMaterial">Nguyên liệu</option>}
                        {!isCommercial && <option value="processed">Bán thành phẩm</option>}
                        <option value="finished">Thành phẩm</option>
                      </select>
                      <select 
                        className="text-[10px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                        value={topStockSort}
                        onChange={(e) => setTopStockSort(e.target.value as any)}
                      >
                        <option value="desc">Cao nhất</option>
                        <option value="asc">Thấp nhất</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="space-y-2">
                    {topStockProducts.map((product, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                          #{i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span 
                              className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate cursor-pointer hover:underline"
                              onClick={() => navigate(`/inventory-records?productCode=${product.code}&tab=operational_ledger`)}
                            >
                              {product.productName}
                            </span>
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200 ml-2 whitespace-nowrap">{product.total}</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${(product.total / maxStock) * 100}%`,
                                background: i === 0 ? '#ef4444' : i < 3 ? '#f59e0b' : '#6366f1',
                              }}
                            />
                          </div>
                          <div className="flex gap-3 mt-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                            {!isCommercial && <span>NVL: {product.rawMaterial}</span>}
                            {!isCommercial && <span>SC: {product.processed}</span>}
                            <span>TP: {product.finished}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {topStockProducts.length === 0 && (
                      <div className="text-center py-6 text-sm text-gray-400 dark:text-gray-600 italic">Chưa có dữ liệu tồn kho</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPageEnhanced;
