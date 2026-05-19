import React, { useState, useEffect } from 'react';
import { inventoryMovementService } from '../services/inventoryMovementService';

interface InventoryAccountingSummaryProps {
  companyId: string;
  periodStart: string;
  periodEnd: string;
}

interface ProductSummary {
  productId: string;
  productName: string;
  productCode: string;
  openingQuantity: number;
  openingValue: number;
  inboundQuantity: number;
  inboundValue: number;
  outboundQuantity: number;
  outboundValue: number;
  closingQuantity: number;
  closingValue: number;
  unit: string;
}

const InventoryAccountingSummary: React.FC<InventoryAccountingSummaryProps> = ({
  companyId,
  periodStart,
  periodEnd,
}) => {
  const [summaries, setSummaries] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formFilter, setFormFilter] = useState<'all' | 'raw' | 'processed' | 'finished'>('all');

  useEffect(() => {
    loadAccountingSummary();
  }, [companyId, periodStart, periodEnd, formFilter]);

  const loadAccountingSummary = async () => {
    setLoading(true);
    
    // Get all movements in the period
    const movementsResult = await inventoryMovementService.getMovements({
      companyId,
      dateFrom: periodStart,
      dateTo: periodEnd,
    });

    // Get product list for filtering and metadata
    const { getTrialProducts } = await import('../data/trialMockData');
    const products = getTrialProducts();

    if (!movementsResult.data) {
      setLoading(false);
      return;
    }

    const movements = movementsResult.data;
    
    // Group by product and calculate summary
    const productMap = new Map<string, ProductSummary>();

    for (const movement of movements) {
      const pid = movement.product_id;
      const product = products.find(p => p.id === pid || p.businessCode === pid);
      
      // Filter based on form
      if (formFilter !== 'all') {
        const allowed = product?.allowedForms || [];
        if (!allowed.includes(formFilter as any)) continue;
      }

      if (!productMap.has(pid)) {
        // Get opening balance (movement before period start)
        const balanceResult = await inventoryMovementService.getCurrentBalance(companyId, pid);
        const openingBalance = balanceResult.data?.quantity || 0;
        
        const openingValue = movement.unit_cost 
          ? openingBalance * movement.unit_cost 
          : 0;

        productMap.set(pid, {
          productId: pid,
          productName: product?.name || pid,
          productCode: product?.businessCode || pid,
          openingQuantity: openingBalance,
          openingValue: openingValue,
          inboundQuantity: 0,
          inboundValue: 0,
          outboundQuantity: 0,
          outboundValue: 0,
          closingQuantity: openingBalance,
          closingValue: openingValue,
          unit: movement.unit || product?.outputUnit || '',
        });
      }

      const summary = productMap.get(pid)!;
      
      if (movement.quantity > 0) {
        summary.inboundQuantity += movement.quantity;
        summary.inboundValue += movement.total_value || 0;
      } else {
        summary.outboundQuantity += Math.abs(movement.quantity);
        summary.outboundValue += movement.total_value || 0;
      }
      
      summary.closingQuantity = summary.openingQuantity + summary.inboundQuantity - summary.outboundQuantity;
      summary.closingValue = summary.openingValue + summary.inboundValue - summary.outboundValue;
    }

    setSummaries(Array.from(productMap.values()));
    setLoading(false);
  };

  const formatQuantity = (qty: number) => {
    return qty.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const totalOpeningQuantity = summaries.reduce((sum, s) => sum + s.openingQuantity, 0);
  const totalOpeningValue = summaries.reduce((sum, s) => sum + s.openingValue, 0);
  const totalInboundQuantity = summaries.reduce((sum, s) => sum + s.inboundQuantity, 0);
  const totalInboundValue = summaries.reduce((sum, s) => sum + s.inboundValue, 0);
  const totalOutboundQuantity = summaries.reduce((sum, s) => sum + s.outboundQuantity, 0);
  const totalOutboundValue = summaries.reduce((sum, s) => sum + s.outboundValue, 0);
  const totalClosingQuantity = summaries.reduce((sum, s) => sum + s.closingQuantity, 0);
  const totalClosingValue = summaries.reduce((sum, s) => sum + s.closingValue, 0);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header & Filter */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Bảng cân đối kho (XNT)
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Loại hình:</span>
          <select 
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formFilter}
            onChange={(e) => setFormFilter(e.target.value as any)}
          >
            <option value="all">Tất cả</option>
            <option value="raw">Nguyên vật liệu</option>
            <option value="processed">Bán thành phẩm</option>
            <option value="finished">Thành phẩm</option>
          </select>
        </div>
      </div>

      {summaries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không có dữ liệu
          </h3>
          <p className="text-gray-500">
            Chưa có ghi nhận vận hành kho trong khoảng thời gian này
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                  Mã SP
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                  Tên SP
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Đầu kỳ SL
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Đầu kỳ GT
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Nhập SL
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Nhập GT
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Xuất SL
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Xuất GT
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Cuối kỳ SL
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Cuối kỳ GT
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                  ĐVT
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summaries.map((summary, index) => (
                <tr key={summary.productId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {summary.productCode || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {summary.productName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatQuantity(summary.openingQuantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(summary.openingValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                    {formatQuantity(summary.inboundQuantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                    {formatCurrency(summary.inboundValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                    {formatQuantity(summary.outboundQuantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                    {formatCurrency(summary.outboundValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                    {formatQuantity(summary.closingQuantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatCurrency(summary.closingValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {summary.unit}
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" colSpan={2}>
                  Tổng cộng
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatQuantity(totalOpeningQuantity)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(totalOpeningValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                  {formatQuantity(totalInboundQuantity)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                  {formatCurrency(totalInboundValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                  {formatQuantity(totalOutboundQuantity)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                  {formatCurrency(totalOutboundValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatQuantity(totalClosingQuantity)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(totalClosingValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryAccountingSummary;
