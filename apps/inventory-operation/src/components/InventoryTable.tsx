import React from 'react';
import { InventoryRecord } from '../types';

interface InventoryTableProps {
  records: InventoryRecord[];
  onEdit?: (record: InventoryRecord) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  records,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  if (isLoading) {
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

  if (records.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chưa có dữ liệu tồn kho
        </h3>
        <p className="text-gray-500">
          Bắt đầu bằng cách nhập liệu tồn kho đầu tiên
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Danh sách tồn kho ({records.length} bản ghi)
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã món
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nhập
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tồn NVL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tồn sơ chế
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tồn thành phẩm
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(record.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.productCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.productName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(record.inputQuantity)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(record.rawMaterialStock)} {record.rawMaterialUnit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(record.processedStock)} {record.processedUnit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatNumber(record.finishedProductStock)} {record.finishedProductUnit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(record)}
                        className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                      >
                        Sửa
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(record.id)}
                        className="text-red-600 hover:text-red-900 text-sm font-medium"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryTable;
