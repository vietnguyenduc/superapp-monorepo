import React, { useState } from 'react';
import InventoryMovementLedger from './InventoryMovementLedger';
import InventoryAccountingSummary from './InventoryAccountingSummary';

type UserRole = 'operational' | 'accounting' | 'admin';

interface InventoryRoleBasedViewProps {
  companyId: string;
  userRole: UserRole;
  productId?: string;
  periodStart?: string;
  periodEnd?: string;
}

const InventoryRoleBasedView: React.FC<InventoryRoleBasedViewProps> = ({
  companyId,
  userRole,
  productId,
  periodStart,
  periodEnd,
}) => {
  const [viewMode, setViewMode] = useState<'operational' | 'accounting'>(
    userRole === 'accounting' ? 'accounting' : 'operational'
  );
  const [dateFrom, setDateFrom] = useState(periodStart || new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(periodEnd || new Date().toISOString().split('T')[0]);

  const canSwitchView = userRole === 'admin';

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Chế độ xem
            </h3>
            {canSwitchView && (
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('operational')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewMode === 'operational'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Vận hành (Sổ kho)
                </button>
                <button
                  onClick={() => setViewMode('accounting')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    viewMode === 'accounting'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Kế toán (Bảng XNT)
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Date Filters */}
        <div className="px-6 py-4 flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'operational' ? (
        <InventoryMovementLedger
          companyId={companyId}
          productId={productId}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      ) : (
        <InventoryAccountingSummary
          companyId={companyId}
          periodStart={dateFrom}
          periodEnd={dateTo}
        />
      )}

      {/* Role Info */}
      <div className="text-sm text-gray-500 text-center">
        Vai trò hiện tại: <span className="font-medium">{userRole}</span>
        {canSwitchView && ' - Bạn có thể chuyển đổi giữa chế độ vận hành và kế toán'}
      </div>
    </div>
  );
};

export default InventoryRoleBasedView;
