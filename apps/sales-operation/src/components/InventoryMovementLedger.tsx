import React, { useState, useEffect, useMemo } from 'react';
import { inventoryMovementService } from '../services/inventoryMovementService';
import { useProducts } from '../hooks/useProducts';
import ProductCatalogForm from './ProductCatalogForm';

interface InventoryMovementLedgerProps {
  companyId: string;
  productCode?: string;
  dateFrom?: string;
  dateTo?: string;
}

const InventoryMovementLedger: React.FC<InventoryMovementLedgerProps> = ({
  companyId,
  productCode,
  dateFrom,
  dateTo,
}) => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const { products, loading: productsLoading } = useProducts();
  const [selectedProductDetails, setSelectedProductDetails] = useState<any | null>(null);

  // Memoized product lookup map for O(1) performance
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      map.set(p.id, p);
      if (p.businessCode) map.set(p.businessCode, p);
    });
    return map;
  }, [products]);

  useEffect(() => {
    loadMovements();
  }, [companyId, productCode, dateFrom, dateTo, filterType, filterCategory]);

  const loadMovements = async () => {
    setLoading(true);
    const filters: any = {
      companyId,
    };
    if (productCode) filters.productCode = productCode;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    if (filterType !== 'all') filters.movementType = filterType;
    if (filterCategory !== 'all') filters.movementCategory = filterCategory;

    const result = await inventoryMovementService.getMovements(filters);
    if (result.data) {
      setMovements(result.data);
    }
    setLoading(false);
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: 'Nhập hàng',
      sale: 'Xuất bán',
      transfer: 'Chuyển kho',
      adjustment: 'Điều chỉnh',
      stock_count: 'Kiểm kê',
      production: 'Sản xuất',
      consumption: 'Tiêu hao',
    };
    return labels[type] || type;
  };

  const getMovementCategoryLabel = (category?: string) => {
    if (!category) return '-';
    const labels: Record<string, string> = {
      book_entry: 'Xuất sổ',
      physical: 'Xuất thực',
    };
    return labels[category] || category;
  };

  const getSourceTypeLabel = (source: string) => {
    const labels: Record<string, string> = {
      purchase_order: 'Đơn hàng nhập',
      sales_order: 'Đơn hàng bán',
      manual: 'Thủ công',
      system: 'Hệ thống',
      stock_count: 'Kiểm kê',
    };
    return labels[source] || source;
  };

  const formatQuantity = (qty: number) => {
    return qty.toLocaleString('vi-VN');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  if (loading) {
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

  return (
    <div className="card overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 transition-colors">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Sổ kho vận hành ({movements.length} phiếu)
          </h3>
          <div className="flex gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Tất cả loại</option>
              <option value="purchase">Nhập hàng</option>
              <option value="sale">Xuất bán</option>
              <option value="transfer">Chuyển kho</option>
              <option value="adjustment">Điều chỉnh</option>
              <option value="stock_count">Kiểm kê</option>
              <option value="production">Sản xuất</option>
              <option value="consumption">Tiêu hao</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Tất cả phân loại</option>
              <option value="book_entry">Xuất sổ</option>
              <option value="physical">Xuất thực</option>
            </select>
          </div>
        </div>
      </div>

      {movements.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Không có phiếu kho
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Chưa có ghi nhận vận hành kho trong khoảng thời gian này
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
                  Ngày
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
                  Mã SP
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
                  Tên SP
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
                  Loại
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
                  Nguồn
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Số lượng
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Đơn giá
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Giá trị
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Số dư chạy
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left">
                  Ghi chú
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {movements.map((movement) => {
                const product = productMap.get(movement.product_id);
                return (
                  <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {new Date(movement.movement_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {movement.product_id}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                      onClick={() => {
                        if (product) setSelectedProductDetails(product);
                      }}
                    >
                      {product?.name || (productsLoading ? 'Đang tải...' : <span className="text-red-400 text-xs italic">Cần Reset Trial Data</span>)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {getMovementTypeLabel(movement.movement_type)}
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {getSourceTypeLabel(movement.source_type)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                    movement.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {movement.quantity > 0 ? '+' : ''}{formatQuantity(movement.quantity)} {movement.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {movement.unit_cost ? formatCurrency(movement.unit_cost) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {movement.total_value ? formatCurrency(movement.total_value) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                    {formatQuantity(movement.running_balance)} {movement.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {movement.notes || '-'}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chi tiết sản phẩm</h2>
              <button 
                onClick={() => setSelectedProductDetails(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ProductCatalogForm
                initialData={selectedProductDetails}
                onSubmit={async () => { setSelectedProductDetails(null); }}
                onCancel={() => setSelectedProductDetails(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryMovementLedger;
