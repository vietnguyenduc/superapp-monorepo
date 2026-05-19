import React, { useState, useCallback } from 'react';
import { Product, ProductCategory } from '../../types';
import { validateProduct } from '../../utils/validation';
import ValidatedInput from './ValidatedInput';
import ValidatedSelect from './ValidatedSelect';

interface ProductEntryFormProps {
  initialData?: Partial<Product>;
  existingProducts?: Product[];
  onSubmit: (data: Partial<Product>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const categoryOptions = [
  { value: ProductCategory.FRUIT, label: 'Trái cây' },
  { value: ProductCategory.DRY_GOODS, label: 'Đồ khô' },
  { value: ProductCategory.PROCESSED, label: 'Sơ chế' },
  { value: ProductCategory.FINISHED, label: 'Thành phẩm' },
  { value: ProductCategory.BEVERAGE, label: 'Đồ uống' },
  { value: ProductCategory.TOBACCO, label: 'Thuốc lá' },
  { value: ProductCategory.OTHER, label: 'Khác' },
];

const businessStatusOptions = [
  { value: 'active', label: 'Đang kinh doanh' },
  { value: 'inactive', label: 'Ngừng kinh doanh' },
];

export const ProductEntryForm: React.FC<ProductEntryFormProps> = ({
  initialData,
  existingProducts,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>(initialData || {
    category: ProductCategory.FRUIT,
    businessStatus: 'active',
    isFinishedProduct: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: any): string | null => {
    const result = validateProduct({ ...formData, [name]: value }, existingProducts);
    const fieldError = result.errors.find(e => e.field === name);
    return fieldError?.message || null;
  }, [formData, existingProducts]);

  const handleChange = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || '' }));
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof Product]);
    setErrors(prev => ({ ...prev, [field]: error || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const result = validateProduct(formData, existingProducts);
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

  const isFinished = formData.isFinishedProduct || false;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ValidatedInput
          label="Mã sản phẩm KD"
          value={formData.businessCode || ''}
          onChange={handleChange('businessCode')}
          onBlur={handleBlur('businessCode')}
          error={errors.businessCode}
          required
          placeholder="VD: CF001"
          maxLength={50}
          disabled={loading}
        />

        <ValidatedInput
          label="Mã sản phẩm KM"
          value={formData.promotionCode || ''}
          onChange={handleChange('promotionCode')}
          onBlur={handleBlur('promotionCode')}
          error={errors.promotionCode}
          placeholder="VD: KM001"
          maxLength={50}
          disabled={loading}
        />

        <div className="md:col-span-2">
          <ValidatedInput
            label="Tên sản phẩm"
            value={formData.name || ''}
            onChange={handleChange('name')}
            onBlur={handleBlur('name')}
            error={errors.name}
            required
            placeholder="Nhập tên sản phẩm"
            maxLength={200}
            disabled={loading}
          />
        </div>

        <ValidatedSelect
          label="Loại sản phẩm"
          value={formData.category || ''}
          onChange={handleChange('category')}
          options={categoryOptions}
          error={errors.category}
          required
          disabled={loading}
        />

        <ValidatedSelect
          label="Trạng thái kinh doanh"
          value={formData.businessStatus || ''}
          onChange={handleChange('businessStatus')}
          options={businessStatusOptions}
          error={errors.businessStatus}
          required
          disabled={loading}
        />

        <div className="md:col-span-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isFinished}
              onChange={(e) => setFormData(prev => ({ ...prev, isFinishedProduct: e.target.checked }))}
              disabled={loading}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Là thành phẩm?</span>
          </label>
        </div>

        {isFinished && (
          <>
            <ValidatedInput
              label="Mã thành phẩm"
              value={formData.finishedProductCode || ''}
              onChange={handleChange('finishedProductCode')}
              onBlur={handleBlur('finishedProductCode')}
              error={errors.finishedProductCode}
              placeholder="VD: TP001"
              disabled={loading}
            />

            <ValidatedInput
              label="Định lượng Nhập"
              value={formData.inputQuantity?.toString() || ''}
              onChange={(val) => handleChange('inputQuantity')(val)}
              onBlur={handleBlur('inputQuantity')}
              error={errors.inputQuantity}
              type="number"
              required
              placeholder="Số lượng nhập"
              disabled={loading}
            />

            <ValidatedInput
              label="ĐVT Nhập"
              value={formData.inputUnit || ''}
              onChange={handleChange('inputUnit')}
              onBlur={handleBlur('inputUnit')}
              error={errors.inputUnit}
              required
              placeholder="VD: quả, kg"
              disabled={loading}
            />

            <ValidatedInput
              label="Định lượng Xuất"
              value={formData.outputQuantity?.toString() || ''}
              onChange={(val) => handleChange('outputQuantity')(val)}
              onBlur={handleBlur('outputQuantity')}
              error={errors.outputQuantity}
              type="number"
              required
              placeholder="Số lượng xuất"
              disabled={loading}
            />

            <ValidatedInput
              label="ĐVT Xuất"
              value={formData.outputUnit || ''}
              onChange={handleChange('outputUnit')}
              onBlur={handleBlur('outputUnit')}
              error={errors.outputUnit}
              required
              placeholder="VD: miếng, phần"
              disabled={loading}
            />
          </>
        )}
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

export default ProductEntryForm;
