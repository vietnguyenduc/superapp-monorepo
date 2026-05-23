import React, { useState } from 'react';
import { BulkImport } from '../components/Import/BulkImport';
import { validators } from '../utils/validation';
import { ProductCategory } from '../types';
import { databaseService } from '../services/databaseService';
import { useAuthContext } from '@superapp/iam';

const productRequiredColumns = ['businessCode', 'name', 'category', 'inputQuantity', 'inputUnit'];

const productColumnLabels: Record<string, string> = {
  businessCode: 'Mã SP KD',
  name: 'Tên sản phẩm',
  category: 'Loại',
  inputQuantity: 'Định lượng nhập',
  inputUnit: 'ĐVT nhập',
};

const productValidators: Record<string, (value: any) => string | null> = {
  category: validators.oneOf(Object.values(ProductCategory)),
  inputQuantity: validators.positiveNumber,
};

const downloadTemplate = () => {
  const headers = Object.keys(productColumnLabels).join(',');
  const sample = [
    'CF001,Cam vắng,fruit,1,quả',
    'CF002,Dừa khô,dry_goods,0.5,kg',
  ].join('\n');
  const csv = `${headers}\n${sample}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'product-import-template.csv';
  link.click();
};

const ProductBulkImportPage: React.FC = () => {
  const { hasPermission } = useAuthContext();
  const canImportProducts = hasPermission('import_products');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleImport = async (data: any[]) => {
    if (!canImportProducts) {
      return { success: false, message: 'Bạn không có quyền import sản phẩm' };
    }

    const result = await databaseService.bulkInsertProducts(data);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
      return { success: false, message: result.error };
    }

    setMessage({ type: 'success', text: `Import thành công ${result.data?.length || 0} sản phẩm` });
    return { success: true };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import sản phẩm hàng loạt</h1>
        <p className="text-gray-500">Tải file Excel/CSV chứa danh sách sản phẩm để import</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <BulkImport
          title="Import sản phẩm"
          requiredColumns={productRequiredColumns}
          columnLabels={productColumnLabels}
          validators={productValidators}
          onImport={handleImport}
          onDownloadTemplate={downloadTemplate}
        />
      </div>
    </div>
  );
};

export default ProductBulkImportPage;
