import React, { useState, useEffect } from 'react';
import { inventoryMovementService } from '../services/inventoryMovementService';

interface InventoryDashboardVarianceWidgetProps {
  companyId: string;
}

interface VarianceAlert {
  productId: string;
  productName: string;
  productCode: string;
  variance: number;
  variancePercentage: number;
  countDate: string;
  severity: 'low' | 'medium' | 'high';
}

const InventoryDashboardVarianceWidget: React.FC<InventoryDashboardVarianceWidgetProps> = ({
  companyId,
}) => {
  const [alerts, setAlerts] = useState<VarianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadVarianceAlerts();
  }, [companyId]);

  const loadVarianceAlerts = async () => {
    setLoading(true);
    
    // Get variance data for the last 30 days
    const dateTo = new Date().toISOString().split('T')[0];
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const result = await inventoryMovementService.getVarianceReport(companyId, dateFrom, dateTo);
    
    if (result.data) {
      // Convert to alerts with severity
      const varianceAlerts: VarianceAlert[] = result.data
        .filter((item: any) => item.variance && Math.abs(item.variance_percentage || 0) > 0)
        .map((item: any) => ({
          productId: item.product_id,
          productName: item.products?.name || 'Unknown',
          productCode: item.products?.business_code || 'N/A',
          variance: item.variance,
          variancePercentage: item.variance_percentage || 0,
          countDate: item.count_date,
          severity: Math.abs(item.variance_percentage || 0) < 5 ? 'low' :
                     Math.abs(item.variancePercentage || 0) < 10 ? 'medium' : 'high',
        }))
        .sort((a, b) => Math.abs(b.variancePercentage) - Math.abs(a.variancePercentage))
        .slice(0, 10); // Top 10 variances
      
      setAlerts(varianceAlerts);
    }
    
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Không xác định';
    }
  };

  const formatQuantity = (qty: number) => {
    return qty.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercentage = (pct: number) => {
    return pct.toFixed(2) + '%';
  };

  const highSeverityCount = alerts.filter(a => a.severity === 'high').length;
  const mediumSeverityCount = alerts.filter(a => a.severity === 'medium').length;

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📊</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Giám sát chênh lệch kho
              </h3>
              <p className="text-sm text-gray-500">
                30 ngày gần nhất
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {highSeverityCount > 0 && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {highSeverityCount} cao
              </div>
            )}
            {mediumSeverityCount > 0 && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {mediumSeverityCount} TB
              </div>
            )}
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">✅</div>
          <p className="text-sm text-gray-500">
            Không có chênh lệch đáng kể
          </p>
        </div>
      ) : (
        <div className="p-4">
          {/* Alert List */}
          <div className="space-y-2">
            {alerts.slice(0, expanded ? alerts.length : 3).map((alert) => (
              <div
                key={`${alert.productId}-${alert.countDate}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {alert.productCode}
                    </span>
                    <span className="text-sm opacity-75">
                      {alert.productName}
                    </span>
                  </div>
                  <div className="text-xs opacity-75 mt-1">
                    {new Date(alert.countDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${alert.variance > 0 ? 'text-red-700' : 'text-blue-700'}`}>
                    {alert.variance > 0 ? '+' : ''}{formatQuantity(alert.variance)}
                  </div>
                  <div className="text-xs font-medium">
                    {formatPercentage(alert.variancePercentage)}
                  </div>
                </div>
                <div className="ml-3 px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium">
                  {getSeverityLabel(alert.severity)}
                </div>
              </div>
            ))}
          </div>

          {/* Expand Button */}
          {alerts.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {expanded ? 'Thu gọn' : `Xem thêm ${alerts.length - 3} cảnh báo`}
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={loadVarianceAlerts}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Làm mới dữ liệu
        </button>
      </div>
    </div>
  );
};

export default InventoryDashboardVarianceWidget;
