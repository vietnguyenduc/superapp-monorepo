import React, { useState, useCallback } from 'react';
import { InventoryRecord } from '../../types';
import { validateInventoryRecord } from '../../utils/validation';
import ValidatedInput from './ValidatedInput';

interface InventoryEntryFormProps {
  initialData?: Partial<InventoryRecord>;
  existingRecords?: InventoryRecord[];
  onSubmit: (data: Partial<InventoryRecord>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const InventoryEntryForm: React.FC<InventoryEntryFormProps> = ({
  initialData,
  existingRecords,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<InventoryRecord>>(initialData || {
    rawMaterialStock: 0,
    processedStock: 0,
    finishedProductStock: 0,
    inputQuantity: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: any): string | null => {
    const result = validateInventoryRecord({ ...formData, [name]: value }, existingRecords);
    const fieldError = result.errors.find(e => e.field === name);
    return fieldError?.message || null;
  }, [formData, existingRecords]);

  const handleChange = (field: string) => (value: string) => {
    const numValue = field.includes('Quantity') || field.includes('Stock') ? Number(value) : value;
    setFormData(prev => ({ ...prev, [field]: numValue }));
    if (touched[field]) {
      const error = validateField(field, numValue);
      setErrors(prev => ({ ...prev, [field]: error || '' }));
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof InventoryRecord]);
    setErrors(prev => ({ ...prev, [field]: error || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = validateInventoryRecord(formData, existingRecords);
    if (!result.valid) {
      const newErrors: Record<string, string> = {};
      const newTouched: Record<string, boolean> = {};
      result.errors.forEach(err => {
        newErrors[err.field] = err.message;
        newTouched[err.field] = true;
      });
      setErrors(newErrors);
      setTouched(newTouched);
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ValidatedInput
          label="Mã sản phẩm"
          value={formData.productCode || ''}
          onChange={handleChange('productCode')}
          onBlur={handleBlur('productCode')}
          error={errors.productCode}
          required
          placeholder="VD: CF001"
          disabled={loading}
        />

        <ValidatedInput
          label="Tên sản phẩm"
          value={formData.productName || ''}
          onChange={handleChange('productName')}
          onBlur={handleBlur('productName')}
          error={errors.productName}
          required
          placeholder="Nhập tên sản phẩm"
          disabled={loading}
        />

        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tồn kho</h3>
        </div>

        <ValidatedInput
          label="Tồn thực NVL"
          value={formData.rawMaterialStock?.toString() || '0'}
          onChange={handleChange('rawMaterialStock')}
          onBlur={handleBlur('rawMaterialStock')}
          error={errors.rawMaterialStock}
          type="number"
          min={0}
          placeholder="0"
          disabled={loading}
        />

        <ValidatedInput
          label="ĐVT NVL"
          value={formData.rawMaterialUnit || ''}
          onChange={handleChange('rawMaterialUnit')}
          onBlur={handleBlur('rawMaterialUnit')}
          error={errors.rawMaterialUnit}
          placeholder="VD: quả, kg"
          disabled={loading}
        />

        <ValidatedInput
          label="Tồn thực sơ chế"
          value={formData.processedStock?.toString() || '0'}
          onChange={handleChange('processedStock')}
          onBlur={handleBlur('processedStock')}
          error={errors.processedStock}
          type="number"
          min={0}
          placeholder="0"
          disabled={loading}
        />

        <ValidatedInput
          label="ĐVT sơ chế"
          value={formData.processedUnit || ''}
          onChange={handleChange('processedUnit')}
          onBlur={handleBlur('processedUnit')}
          error={errors.processedUnit}
          placeholder="VD: miếng, lát"
          disabled={loading}
        />

        <ValidatedInput
          label="Tồn thực thành phẩm"
          value={formData.finishedProductStock?.toString() || '0'}
          onChange={handleChange('finishedProductStock')}
          onBlur={handleBlur('finishedProductStock')}
          error={errors.finishedProductStock}
          type="number"
          min={0}
          placeholder="0"
          disabled={loading}
        />

        <ValidatedInput
          label="ĐVT thành phẩm"
          value={formData.finishedProductUnit || ''}
          onChange={handleChange('finishedProductUnit')}
          onBlur={handleBlur('finishedProductUnit')}
          error={errors.finishedProductUnit}
          placeholder="VD: đĩa, hộp"
          disabled={loading}
        />

        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Nhập kho</h3>
        </div>

        <ValidatedInput
          label="Số lượng nhập"
          value={formData.inputQuantity?.toString() || '0'}
          onChange={handleChange('inputQuantity')}
          onBlur={handleBlur('inputQuantity')}
          error={errors.inputQuantity}
          type="number"
          min={0}
          placeholder="0"
          disabled={loading}
        />

        <ValidatedInput
          label="Ghi chú"
          value={formData.notes || ''}
          onChange={handleChange('notes')}
          onBlur={handleBlur('notes')}
          error={errors.notes}
          placeholder="Ghi chú (tùy chọn)"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : initialData?.id ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
};

export default InventoryEntryForm;
