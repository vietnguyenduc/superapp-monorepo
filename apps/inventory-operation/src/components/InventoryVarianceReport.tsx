import React, { useState, useEffect } from 'react';
import { inventoryMovementService } from '../services/inventoryMovementService';

interface InventoryVarianceReportProps {
  companyId: string;
  dateFrom: string;
  dateTo: string;
}

const InventoryVarianceReport: React.FC<InventoryVarianceReportProps> = ({
  companyId,
  dateFrom,
  dateTo,
}) => {
  const [varianceData, setVarianceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVarianceReport();
  }, [companyId, dateFrom, dateTo]);

  const loadVarianceReport = async () => {
    setLoading(true);
    const result = await inventoryMovementService.getVarianceReport(companyId, dateFrom, dateTo);
    if (result.data) {
      setVarianceData(result.data);
    }
    setLoading(false);
  };

  const formatQuantity = (qty: number) => {
    return qty.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercentage = (pct: number) => {
    return pct?.toFixed(2) + '%' || '-';
  };

  const getVarianceBadgeClass = (variance: number) => {
    const threshold = 0.05; // 5% threshold
    if (Math.abs(variance) < threshold) return 'bg-green-100 text-green-800';
    if (Math.abs(variance) < threshold * 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const totalVariance = varianceData.reduce((sum, item) => sum + (item.variance || 0), 0);
  const significantVarianceCount = varianceData.filter(item => Math.abs(item.variance_percentage || 0) > 5).length;

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
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Báo cáo chênh lệch kho
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Kỳ từ {new Date(dateFrom).toLocaleDateString('vi-VN')} đến {new Date(dateTo).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Tổng chênh lệch</div>
            <div className={`text-lg font-semibold ${totalVariance !== 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatQuantity(totalVariance)}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Tổng số kiểm kê</div>
          <div className="text-2xl font-bold text-blue-900">{varianceData.length}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-sm text-yellow-600 font-medium">Chênh lệch đáng kể (&gt;5%)</div>
          <div className="text-2xl font-bold text-yellow-900">{significantVarianceCount}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Tỷ lệ chính xác</div>
          <div className="text-2xl font-bold text-green-900">
            {varianceData.length > 0 ? ((varianceData.length - significantVarianceCount) / varianceData.length * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {varianceData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không có dữ liệu chênh lệch
          </h3>
          <p className="text-gray-500">
            Chưa có kết quả kiểm kê trong khoảng thời gian này
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                  Ngày kiểm kê
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                  Mã SP
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                  Tên SP
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Sổ
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Thực tế
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Chênh lệch
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  % Chênh lệch
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {varianceData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.count_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.products?.business_code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.products?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatQuantity(item.book_quantity)} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatQuantity(item.counted_quantity)} {item.unit}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                    item.variance > 0 ? 'text-red-600' : item.variance < 0 ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {item.variance > 0 ? '+' : ''}{formatQuantity(item.variance)} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {formatPercentage(item.variance_percentage)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVarianceBadgeClass(item.variance_percentage || 0)}`}>
                      {item.reconciliation_status === 'approved' ? 'Đã duyệt' : 
                       item.reconciliation_status === 'pending' ? 'Chờ duyệt' : 
                       item.reconciliation_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.notes || item.reconciliation_notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryVarianceReport;
