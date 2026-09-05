import React, { useState } from 'react';
import { InventoryEntryForm } from '../components/Form/InventoryEntryForm';
import { InventoryRecord } from '../types';
import { InventoryService } from '../services/inventoryService';
import { useAuthContext } from '@superapp/iam';

const InventoryEntryPage: React.FC = () => {
  const { hasPermission } = useAuthContext();
  const canImportInventory = hasPermission('import_inventory');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [records, setRecords] = useState<InventoryRecord[]>([]);

  const handleSubmit = async (data: Partial<InventoryRecord>) => {
    if (!canImportInventory) {
      setMessage({ type: 'error', text: 'Bạn không có quyền nhập tồn kho' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await InventoryService.createInventoryRecord(data as Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>);

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
        return;
      }

      if (result.data) {
        setRecords(prev => [result.data!, ...prev]);
        setMessage({ type: 'success', text: 'Tạo bản ghi tồn kho thành công!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi khi tạo bản ghi tồn kho' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nhập tồn kho</h1>
        <p className="text-gray-500">Nhập thông tin tồn kho theo form bên dưới</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <InventoryEntryForm
          existingRecords={records}
          onSubmit={handleSubmit}
          onCancel={() => window.history.back()}
          loading={loading}
        />
      </div>

      {records.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bản ghi vừa tạo ({records.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mã SP</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tồn NVL</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tồn SC</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tồn TP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{r.productCode}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{r.productName}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{r.rawMaterialStock} {r.rawMaterialUnit}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{r.processedStock} {r.processedUnit}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{r.finishedProductStock} {r.finishedProductUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryEntryPage;
