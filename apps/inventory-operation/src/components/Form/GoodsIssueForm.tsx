import React, { useState } from 'react';
import { Product } from '../../types';

export interface GoodsIssueFormData {
  date: string;
  productCode: string;
  quantity: number;
  reason: string;
  notes: string;
}

interface GoodsIssueFormProps {
  onSubmit: (data: GoodsIssueFormData) => void;
  onCancel: () => void;
  products: Product[];
  initialData?: Partial<GoodsIssueFormData>;
  isLoading?: boolean;
}

const GoodsIssueForm: React.FC<GoodsIssueFormProps> = ({
  onSubmit,
  onCancel,
  products,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<GoodsIssueFormData>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    productCode: initialData?.productCode || '',
    quantity: initialData?.quantity || 0,
    reason: initialData?.reason || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.businessCode?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.date) e.date = 'Ngày là bắt buộc';
    if (!formData.productCode) e.productCode = 'Sản phẩm là bắt buộc';
    if (formData.quantity <= 0) e.quantity = 'Số lượng phải > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ngày xuất <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Số lượng xuất <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={formData.quantity || ''}
            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
        </div>
      </div>

      {/* Product */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Sản phẩm <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={productSearch || formData.productCode}
          onChange={(e) => {
            setProductSearch(e.target.value);
            setShowProductList(true);
            setFormData({ ...formData, productCode: e.target.value });
          }}
          onFocus={() => setShowProductList(true)}
          onBlur={() => setTimeout(() => setShowProductList(false), 200)}
          placeholder="Tìm sản phẩm theo tên hoặc mã..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.productCode && <p className="text-xs text-red-500 mt-1">{errors.productCode}</p>}
        {showProductList && filteredProducts.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            {filteredProducts.slice(0, 10).map((p) => (
              <div
                key={p.id}
                onMouseDown={() => {
                  setFormData({ ...formData, productCode: p.businessCode });
                  setProductSearch(p.name);
                  setShowProductList(false);
                }}
                className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-sm"
              >
                <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                <span className="ml-2 text-xs text-gray-500">{p.businessCode}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Lý do xuất
        </label>
        <input
          type="text"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="vd: Xuất bán, Xuất sản xuất, Xuất hủy..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Ghi chú
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
};

export default GoodsIssueForm;
