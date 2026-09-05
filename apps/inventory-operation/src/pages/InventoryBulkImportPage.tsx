import React, { useState } from 'react';
import { BulkImport } from '../components/Import/BulkImport';
import { validators } from '../utils/validation';
import { InventoryService } from '../services/inventoryService';
import { useAuthContext } from '@superapp/iam';

const inventoryRequiredColumns = ['productCode', 'productName', 'rawMaterialStock', 'processedStock', 'finishedProductStock'];

const inventoryColumnLabels: Record<string, string> = {
  productCode: 'Mã SP',
  productName: 'Tên SP',
  rawMaterialStock: 'Tồn NVL',
  processedStock: 'Tồn SC',
  finishedProductStock: 'Tồn TP',
  rawMaterialUnit: 'ĐVT NVL',
  processedUnit: 'ĐVT SC',
  finishedProductUnit: 'ĐVT TP',
};

const inventoryValidators: Record<string, (value: any) => string | null> = {
  rawMaterialStock: validators.nonNegativeNumber,
  processedStock: validators.nonNegativeNumber,
  finishedProductStock: validators.nonNegativeNumber,
};

const downloadTemplate = () => {
  const headers = Object.keys(inventoryColumnLabels).join(',');
  const sample = [
    'CF001,Cam vắng,10,5,2,quả,miếng,phần',
    'CF002,Dừa khô,20,0,0,kg,,,',
  ].join('\n');
  const csv = `${headers}\n${sample}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'inventory-import-template.csv';
  link.click();
};

const InventoryBulkImportPage: React.FC = () => {
  const { hasPermission } = useAuthContext();
  const canImportInventory = hasPermission('import_inventory');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleImport = async (data: any[]) => {
    if (!canImportInventory) {
      return { success: false, message: 'Bạn không có quyền import tồn kho' };
    }

    const result = await InventoryService.bulkInsertInventoryRecords(data);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      return { success: false, message: result.error };
    }

    setMessage({ type: 'success', text: `Import thành công ${result.data?.length || 0} bản ghi tồn kho` });
    return { success: true };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import tồn kho hàng loạt</h1>
        <p className="text-gray-500">Tải file Excel/CSV chứa danh sách tồn kho để import</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <BulkImport
          title="Import tồn kho"
          requiredColumns={inventoryRequiredColumns}
          columnLabels={inventoryColumnLabels}
          validators={inventoryValidators}
          onImport={handleImport}
          onDownloadTemplate={downloadTemplate}
        />
      </div>
    </div>
  );
};

export default InventoryBulkImportPage;
