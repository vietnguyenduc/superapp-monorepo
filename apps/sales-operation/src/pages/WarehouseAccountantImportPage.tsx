import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import { useSalesReport } from '../hooks/useSales';
import Button from '../components/UI/Button';
import InventoryBulkImport from '../components/InventoryBulkImport';

const WarehouseAccountantImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { createRecord } = useInventory();
  const { createSalesRecord } = useSalesReport();
  
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter products that can be sold
  const sellableProducts = products.filter(p => {
    if (p.canBeSold === false) return false;
    if (p.canBeSold === true) return true;
    return p.isFinishedProduct;
  });

  // Sales/Outbound Form State
  const [salesForm, setSalesForm] = useState({
    productId: '',
    productName: '',
    quantitySold: 0,
    unit: 'piece',
    saleDate: new Date().toISOString().split('T')[0],
    customerName: '',
    notes: '',
  });

  const handleSalesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create sales record
      await createSalesRecord({
        productId: salesForm.productId,
        productName: salesForm.productName,
        quantitySold: salesForm.quantitySold,
        unit: salesForm.unit,
        saleDate: salesForm.saleDate,
        customerName: salesForm.customerName,
        notes: salesForm.notes,
        source: 'warehouse_accountant',
      });

      // Also create inventory record for outbound
      await createRecord({
        productId: salesForm.productId,
        productName: salesForm.productName,
        salesQuantity: salesForm.quantitySold,
        unit: salesForm.unit,
        date: salesForm.saleDate,
        notes: salesForm.notes,
        type: 'Xuất kho',
        source: 'warehouse_accountant',
      });

      setSalesForm({
        productId: '',
        productName: '',
        quantitySold: 0,
        unit: 'piece',
        saleDate: new Date().toISOString().split('T')[0],
        customerName: '',
        notes: '',
      });

      alert('Ghi nhận xuất kho thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể ghi nhận xuất kho');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 transition-colors duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nhập liệu Kế toán kho</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">Quản lý xuất kho và số lượng bán hàng</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/inventory-records')}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            >
              Quay lại
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-800 transition-colors">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-4 py-2 rounded-t-xl text-sm font-bold transition-all ${
                activeTab === 'single'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Ghi nhận lẻ
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 rounded-t-xl text-sm font-bold transition-all ${
                activeTab === 'bulk'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              🚀 Import hàng loạt
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Sales/Outbound Form */}
        {activeTab === 'single' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Xuất kho / Số bán</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ghi nhận xuất kho dựa trên dữ liệu bán hàng</p>
            </div>

            <form onSubmit={handleSalesSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Sản phẩm
                </label>
                <select
                  required
                  value={salesForm.productId}
                  onChange={(e) => {
                    const product = sellableProducts.find(p => p.id === e.target.value);
                    setSalesForm({
                      ...salesForm,
                      productId: e.target.value,
                      productName: product?.name || '',
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                >
                  <option value="">Chọn sản phẩm</option>
                  {sellableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.businessCode} - {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                    Số lượng bán
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={salesForm.quantitySold}
                    onChange={(e) =>
                      setSalesForm({
                        ...salesForm,
                        quantitySold: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                    Đơn vị
                  </label>
                  <select
                    value={salesForm.unit}
                    onChange={(e) =>
                      setSalesForm({ ...salesForm, unit: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                  >
                    <option value="piece">Cái</option>
                    <option value="kg">Kg</option>
                    <option value="liter">Lít</option>
                    <option value="pack">Hộp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Tên khách hàng
                </label>
                <input
                  type="text"
                  value={salesForm.customerName}
                  onChange={(e) =>
                    setSalesForm({ ...salesForm, customerName: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                  placeholder="Tên khách hàng (nếu có)"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Ngày bán
                </label>
                <input
                  type="date"
                  required
                  value={salesForm.saleDate}
                  onChange={(e) =>
                    setSalesForm({ ...salesForm, saleDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={salesForm.notes}
                  onChange={(e) =>
                    setSalesForm({ ...salesForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                  placeholder="Ghi chú về đơn hàng (nếu có)"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-4 rounded-xl font-black shadow-lg shadow-blue-200 dark:shadow-none"
              >
                {loading ? 'Đang ghi nhận...' : 'Ghi nhận xuất kho'}
              </Button>
            </form>
          </div>
        )}

        {/* Bulk Import */}
        {activeTab === 'bulk' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <InventoryBulkImport 
              type="warehouse_accountant" 
              onImportComplete={() => navigate('/inventory-records')}
              onCancel={() => setActiveTab('single')}
            />
          </div>
        )}

        {/* Info Box */}
        {activeTab === 'single' && (
          <div className="mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl transition-colors">
            <h3 className="text-sm font-black text-blue-900 dark:text-blue-300 mb-3 uppercase tracking-tight">Thông tin lưu ý:</h3>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-2 font-medium opacity-80">
              <li className="flex gap-2"><span>•</span> Xuất kho sẽ cập nhật Tồn sổ để đối chiếu với số liệu kiểm kho thực tế.</li>
              <li className="flex gap-2"><span>•</span> Dữ liệu xuất kho đến từ kế toán kho dựa trên bán hàng.</li>
              <li className="flex gap-2"><span>•</span> Chênh lệch giữa Tồn sổ và Tồn thật sẽ được hiển thị trên Dashboard.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseAccountantImportPage;
