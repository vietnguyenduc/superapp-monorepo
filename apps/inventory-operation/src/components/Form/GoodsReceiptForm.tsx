import React, { useState } from 'react';
import { Supplier } from '../../services/supplierService';
import { Product } from '../../types';

export interface GoodsReceiptFormData {
  date: string;
  supplierCode: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

interface GoodsReceiptFormProps {
  onSubmit: (data: GoodsReceiptFormData) => void;
  onCancel: () => void;
  suppliers: Supplier[];
  products: Product[];
  initialData?: Partial<GoodsReceiptFormData>;
  isLoading?: boolean;
}

const GoodsReceiptForm: React.FC<GoodsReceiptFormProps> = ({
  onSubmit,
  onCancel,
  suppliers,
  products,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<GoodsReceiptFormData>({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    supplierCode: initialData?.supplierCode || '',
    productCode: initialData?.productCode || '',
    quantity: initialData?.quantity || 0,
    unitPrice: initialData?.unitPrice || 0,
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [supplierSearch, setSupplierSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [showProductList, setShowProductList] = useState(false);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.customer_code?.toLowerCase().includes(supplierSearch.toLowerCase())
  );

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
    if (formData.unitPrice < 0) e.unitPrice = 'Đơn giá không hợp lệ';
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
            Ngày nhập <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
        </div>

        {/* Supplier */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nhà cung cấp
          </label>
          <input
            type="text"
            value={supplierSearch || formData.supplierCode}
            onChange={(e) => {
              setSupplierSearch(e.target.value);
              setShowSupplierList(true);
              setFormData({ ...formData, supplierCode: e.target.value });
            }}
            onFocus={() => setShowSupplierList(true)}
            onBlur={() => setTimeout(() => setShowSupplierList(false), 200)}
            placeholder="Tìm NCC theo tên hoặc mã..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showSupplierList && filteredSuppliers.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
              {filteredSuppliers.slice(0, 10).map((s) => (
                <div
                  key={s.id}
                  onMouseDown={() => {
                    setFormData({ ...formData, supplierCode: s.customer_code });
                    setSupplierSearch(s.full_name);
                    setShowSupplierList(false);
                  }}
                  className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-sm"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{s.full_name}</span>
                  <span className="ml-2 text-xs text-gray-500">{s.customer_code}</span>
                </div>
              ))}
            </div>
          )}
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

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Số lượng <span className="text-red-500">*</span>
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

        {/* Unit price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Đơn giá (VNĐ)
          </label>
          <input
            type="number"
            min="0"
            step="any"
            value={formData.unitPrice || ''}
            onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.unitPrice && <p className="text-xs text-red-500 mt-1">{errors.unitPrice}</p>}
        </div>
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

export default GoodsReceiptForm;
