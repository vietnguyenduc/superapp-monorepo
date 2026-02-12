import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useProducts } from "../hooks/useProducts";
import { useInventory } from "../hooks/useInventory";
import { useSalesReport } from "../hooks/useSales";
import { formatNumber } from "../utils/formatting";
import LoadingFallback from "../components/UI/LoadingFallback";
import ErrorFallback from "../components/UI/ErrorFallback";
import Button from "../components/UI/Button";
import InventoryMetricsCard from "../components/InventoryMetricsCard";
import InventoryTimeRangeSelector, { InventoryTimeRange } from "../components/InventoryTimeRangeSelector";

const DashboardPageEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<InventoryTimeRange>("month");
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for Export menu
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Hooks for data
  const { products, loading: productsLoading } = useProducts();
  const { records: inventoryRecords, isLoading: inventoryLoading } = useInventory();
  const { salesRecords, loading: salesLoading } = useSalesReport();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate metrics from real data
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.status === 'active').length;
      const totalInventoryValue = inventoryRecords.reduce((sum: number, record: any) => {
        return sum + (record.inputQuantity * 1000); // Simplified calculation
      }, 0);
      
      const totalSales = salesRecords.reduce((sum: number, record: any) => {
        return sum + record.quantitySold;
      }, 0);

      const recentSales = salesRecords.slice(0, 10);
      const topProducts = products.slice(0, 8);

      const dashboardMetrics = {
        totalProducts,
        activeProducts,
        totalInventoryValue,
        totalSales,
        recentSales,
        topProducts,
        inventoryRecords: inventoryRecords.slice(0, 20),
        salesRecords: salesRecords.slice(0, 20)
      };

      setMetrics(dashboardMetrics);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data",
      );
    } finally {
      setLoading(false);
    }
  }, [products, inventoryRecords, salesRecords]);

  // Load data on component mount and when time range changes
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const isLoading = loading || productsLoading || inventoryLoading || salesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 w-full">
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <LoadingFallback
            title="Đang tải dashboard..."
            message="Đang tải dữ liệu tồn kho"
            size="lg"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 w-full">
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <ErrorFallback
            title="Lỗi tải dashboard"
            message={error}
            retry={fetchDashboardData}
          />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 w-full">
        <div className="px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Không có dữ liệu
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Không có dữ liệu tồn kho để hiển thị
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 w-full">
      <div className="px-4 sm:px-6 lg:px-8 w-full">
        {/* Fixed Time Range Selector */}
        <div className="fixed top-16 left-0 right-0 z-40 px-4 sm:px-6 lg:px-8 py-1.5 bg-gray-50/5 border-b border-gray-100/10">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Dashboard Tồn Kho
            </div>
            <div className="flex items-center gap-3">
              {/* Export button */}
              <div className="relative">
                <button 
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 px-3 rounded-lg border border-blue-200 font-medium"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  Export
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-t-lg"
                      onClick={() => {
                        // Export inventory data
                        const worksheet = XLSX.utils.json_to_sheet(metrics.inventoryRecords);
                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Records");
                        XLSX.writeFile(workbook, `inventory_${timeRange}_${new Date().toISOString().split("T")[0]}.xlsx`);
                        setShowExportMenu(false);
                      }}
                    >
                      Export Excel
                    </button>
                    <button 
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-b-lg"
                      onClick={() => {
                        // Export sales data
                        const worksheet = XLSX.utils.json_to_sheet(metrics.salesRecords);
                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Records");
                        XLSX.writeFile(workbook, `sales_${timeRange}_${new Date().toISOString().split("T")[0]}.xlsx`);
                        setShowExportMenu(false);
                      }}
                    >
                      Export CSV
                    </button>
                  </div>
                )}
              </div>
              
              <div className="inline-flex rounded-2xl bg-white/90 p-1 shadow-[0_4px_12px_rgba(15,23,42,0.10)] border border-gray-200/80 ring-1 ring-gray-200/60">
                <InventoryTimeRangeSelector value={timeRange} onChange={setTimeRange} />
              </div>
            </div>
          </div>
        </div>
        <div className="h-12" />

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Tồn Kho</h1>
          <p className="text-gray-600">
            Tổng quan tình hình tồn kho và giao dịch
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 w-full min-w-0 overflow-hidden">
          <InventoryMetricsCard
            title="Tổng sản phẩm"
            value={formatNumber(metrics.totalProducts)}
            change={metrics.activeProducts - metrics.totalProducts}
            changeType={metrics.activeProducts >= metrics.totalProducts ? "increase" : "decrease"}
            icon="products"
            color="primary"
          />
          <InventoryMetricsCard
            title="Sản phẩm hoạt động"
            value={formatNumber(metrics.activeProducts)}
            change={5}
            changeType="increase"
            icon="inventory"
            color="success"
          />
          <InventoryMetricsCard
            title="Giá trị tồn kho"
            value={formatNumber(metrics.totalInventoryValue)}
            change={12}
            changeType="increase"
            icon="warehouse"
            color="warning"
          />
          <InventoryMetricsCard
            title="Tổng bán hàng"
            value={formatNumber(metrics.totalSales)}
            change={8}
            changeType="increase"
            icon="transactions"
            color="info"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 w-full">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow w-full">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">
                Thao tác nhanh
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate("/inventory-input")}
                  className="flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nhập kho
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/product-management")}
                  className="flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Sản phẩm
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/sales-input")}
                  className="flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Báo cáo bán
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/variance-report")}
                  className="flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Báo cáo chênh lệch
                </Button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow w-full">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-base font-medium text-gray-900">
                Hoạt động gần đây
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {metrics.recentSales.slice(0, 5).map((sale: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{sale.notes}</p>
                      <p className="text-xs text-gray-500">{new Date(sale.outputDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {sale.quantitySold}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Recent Inventory Records */}
          <div className="bg-white rounded-lg shadow w-full">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium text-gray-900">
                  Giao dịch tồn kho gần đây
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/inventory-input")}
                >
                  Xem tất cả
                </Button>
              </div>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {metrics.inventoryRecords.slice(0, 5).map((record: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">{record.productName}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{record.inputQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-lg shadow w-full">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium text-gray-900">
                  Sản phẩm nổi bật
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/product-management")}
                >
                  Xem tất cả
                </Button>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {metrics.topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.businessCode}</p>
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      {product.inputQuantity} {product.inputUnit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPageEnhanced;
