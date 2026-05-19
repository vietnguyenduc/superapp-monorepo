import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import Button from '../components/UI/Button';
import InventoryBulkImport from '../components/InventoryBulkImport';

const WarehouseKeeperImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { createRecord } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'stock-in' | 'stock-count' | 'bulk'>('stock-count');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter products that can be physically stocked/imported
  const purchasableProducts = products.filter(p => {
    if (p.canBePurchased === false) return false;
    if (p.canBePurchased === true) return true;
    return !p.isFinishedProduct;
  });

  // Stock In Form State
  const [stockInForm, setStockInForm] = useState({
    productId: '',
    productName: '',
    quantity: 0,
    unit: 'piece',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Stock Count Form State
  const [stockCountForm, setStockCountForm] = useState({
    productId: '',
    productName: '',
    actualQuantity: 0,
    unit: 'piece',
    countDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createRecord({
        productId: stockInForm.productId,
        productName: stockInForm.productName,
        inputQuantity: stockInForm.quantity,
        unit: stockInForm.unit,
        date: stockInForm.date,
        notes: stockInForm.notes,
        type: 'Nhập kho',
        source: 'warehouse_keeper',
      });

      setStockInForm({
        productId: '',
        productName: '',
        quantity: 0,
        unit: 'piece',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });

      alert('Nhập kho thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nhập kho');
    } finally {
      setLoading(false);
    }
  };

  const handleStockCountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createRecord({
        productId: stockCountForm.productId,
        productName: stockCountForm.productName,
        actualInventory: stockCountForm.actualQuantity,
        unit: stockCountForm.unit,
        date: stockCountForm.countDate,
        notes: stockCountForm.notes,
        type: 'Kiểm kê',
        source: 'warehouse_keeper',
      });

      setStockCountForm({
        productId: '',
        productName: '',
        actualQuantity: 0,
        unit: 'piece',
        countDate: new Date().toISOString().split('T')[0],
        notes: '',
      });

      alert('Lưu tồn kho thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu tồn kho');
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nhập liệu Thủ kho</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">Quản lý nhập kho và kiểm kê tồn thực</p>
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
        <div className="mb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('stock-count')}
              className={`px-4 py-2 rounded-t-xl text-sm font-bold transition-all ${
                activeTab === 'stock-count'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Kiểm kê Tồn thực
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stock-in')}
              className={`px-4 py-2 rounded-t-xl text-sm font-bold transition-all ${
                activeTab === 'stock-in'
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-2 border-blue-700 dark:border-blue-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              Nhập kho
            </button>
            <button
              type="button"
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

        {/* Stock Count Form */}
        {activeTab === 'stock-count' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Kiểm kê Tồn thực</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nhập số lượng tồn kho thực tế tại thời điểm kiểm kê</p>
            </div>

            <form onSubmit={handleStockCountSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Sản phẩm
                </label>
                <select
                  required
                  value={stockCountForm.productId}
                  onChange={(e) => {
                    const product = purchasableProducts.find(p => p.id === e.target.value);
                    setStockCountForm({
                      ...stockCountForm,
                      productId: e.target.value,
                      productName: product?.name || '',
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                >
                  <option value="">Chọn sản phẩm</option>
                  {purchasableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.businessCode} - {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                    Số lượng thực tế
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stockCountForm.actualQuantity}
                    onChange={(e) =>
                      setStockCountForm({
                        ...stockCountForm,
                        actualQuantity: Number(e.target.value),
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
                    value={stockCountForm.unit}
                    onChange={(e) =>
                      setStockCountForm({ ...stockCountForm, unit: e.target.value })
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
                  Ngày kiểm kê
                </label>
                <input
                  type="date"
                  required
                  value={stockCountForm.countDate}
                  onChange={(e) =>
                    setStockCountForm({ ...stockCountForm, countDate: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={stockCountForm.notes}
                  onChange={(e) =>
                    setStockCountForm({ ...stockCountForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                  placeholder="Ghi chú về kiểm kê (nếu có)"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-4 rounded-xl font-black shadow-lg shadow-blue-200 dark:shadow-none"
              >
                {loading ? 'Đang lưu...' : 'Lưu tồn thực'}
              </Button>
            </form>
          </div>
        )}

        {/* Stock In Form */}
        {activeTab === 'stock-in' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nhập kho</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nhập hàng mới vào kho</p>
            </div>

            <form onSubmit={handleStockInSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Sản phẩm
                </label>
                <select
                  required
                  value={stockInForm.productId}
                  onChange={(e) => {
                    const product = purchasableProducts.find(p => p.id === e.target.value);
                    setStockInForm({
                      ...stockInForm,
                      productId: e.target.value,
                      productName: product?.name || '',
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                >
                  <option value="">Chọn sản phẩm</option>
                  {purchasableProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.businessCode} - {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                    Số lượng nhập
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stockInForm.quantity}
                    onChange={(e) =>
                      setStockInForm({
                        ...stockInForm,
                        quantity: Number(e.target.value),
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
                    value={stockInForm.unit}
                    onChange={(e) =>
                      setStockInForm({ ...stockInForm, unit: e.target.value })
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
                  Ngày nhập
                </label>
                <input
                  type="date"
                  required
                  value={stockInForm.date}
                  onChange={(e) =>
                    setStockInForm({ ...stockInForm, date: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={stockInForm.notes}
                  onChange={(e) =>
                    setStockInForm({ ...stockInForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                  placeholder="Ghi chú về nhập hàng (nếu có)"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full py-4 rounded-xl font-black shadow-lg shadow-blue-200 dark:shadow-none"
              >
                {loading ? 'Đang nhập...' : 'Nhập kho'}
              </Button>
            </form>
          </div>
        )}
        {/* Bulk Import */}
        {activeTab === 'bulk' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 transition-colors">
            <InventoryBulkImport 
              type="warehouse_keeper" 
              onImportComplete={() => navigate('/inventory-records')}
              onCancel={() => setActiveTab('stock-count')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseKeeperImportPage;
