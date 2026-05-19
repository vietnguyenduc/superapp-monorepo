import React, { useState, useEffect } from 'react';
import InventoryInputForm from '../components/InventoryInputForm';
import InventoryTable from '../components/InventoryTable';
import { useProducts } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/UserRole';
import { InventoryRecord, ImportError } from '../types';

const InventoryInputPage: React.FC = () => {
  const { user } = useAuth();
  const [inputMode, setInputMode] = useState<'form' | 'grid'>('form');
  const [inputType, setInputType] = useState<'inventory' | 'sales' | 'stock-count'>('inventory');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InventoryRecord | null>(null);
  const [gridData, setGridData] = useState<any[]>([]);
  const [gridErrors, setGridErrors] = useState<ImportError[]>([]);
  
  // Sales form state
  const [salesForm, setSalesForm] = useState({
    productId: '',
    date: new Date().toISOString().split('T')[0],
    salesQuantity: 0
  });
  
  // Stock count form state
  const [stockCountForm, setStockCountForm] = useState({
    productId: '',
    date: new Date().toISOString().split('T')[0],
    actualQuantity: 0
  });
  
  const {
    records,
    isLoading,
    error,
    createRecord,
    updateRecord,
    deleteRecord,
    clearError,
  } = useInventory({ autoLoad: true });
  
  const { products } = useProducts();

  // Set default input type based on user role
  const userRole = user?.role || UserRole.STAFF;
  
  useEffect(() => {
    if (userRole === UserRole.WAREHOUSE_KEEPER) {
      // Thủ kho: Default to stock-count (tồn thực)
      setInputType('stock-count');
    } else if (userRole === UserRole.WAREHOUSE_ACCOUNTANT) {
      // Kế toán kho: Default to inventory (tồn sổ)
      setInputType('inventory');
    }
  }, [userRole]);

  const handleSubmit = async (data: Partial<InventoryRecord>) => {
    if (editingRecord) {
      const result = await updateRecord(editingRecord.id, data);
      if (result.success) {
        setEditingRecord(null);
        setShowForm(false);
      }
    } else {
      const result = await createRecord(data as Omit<InventoryRecord, 'id' | 'createdAt' | 'updatedAt'>);
      if (result.success) {
        setShowForm(false);
      }
    }
  };

  const handleEdit = (record: InventoryRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      await deleteRecord(id);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  // Handle sales form save
  const handleSaveSales = async () => {
    if (!salesForm.productId || !salesForm.date) {
      alert('Vui lòng chọn sản phẩm và ngày');
      return;
    }

    const selectedProduct = products.find(p => p.id === salesForm.productId);
    if (!selectedProduct) {
      alert('Sản phẩm không hợp lệ');
      return;
    }

    try {
      // Create inventory record with sales quantity (use negative inputQuantity for outbound)
      const result = await createRecord({
        productCode: selectedProduct.businessCode,
        productName: selectedProduct.name,
        inputQuantity: -salesForm.salesQuantity, // Negative for outbound
        rawMaterialStock: 0,
        rawMaterialUnit: 'kg',
        processedStock: 0,
        processedUnit: 'ly',
        finishedProductStock: 0,
        finishedProductUnit: 'ly',
        date: new Date(salesForm.date),
        notes: 'Xuất sổ từ dữ liệu bán hàng',
        createdBy: 'system',
        updatedBy: 'system'
      });

      if (result.success) {
        alert('Đã lưu xuất sổ thành công!');
        setSalesForm({
          productId: '',
          date: new Date().toISOString().split('T')[0],
          salesQuantity: 0
        });
      } else {
        alert(result.error || 'Lỗi khi lưu xuất sổ');
      }
    } catch (error) {
      alert('Lỗi khi lưu xuất sổ');
      console.error(error);
    }
  };

  // Handle stock count form save
  const handleSaveStockCount = async () => {
    if (!stockCountForm.productId || !stockCountForm.date) {
      alert('Vui lòng chọn sản phẩm và ngày');
      return;
    }

    const selectedProduct = products.find(p => p.id === stockCountForm.productId);
    if (!selectedProduct) {
      alert('Sản phẩm không hợp lệ');
      return;
    }

    try {
      // Create inventory record with actual inventory
      const result = await createRecord({
        productCode: selectedProduct.businessCode,
        productName: selectedProduct.name,
        inputQuantity: 0,
        rawMaterialStock: 0,
        rawMaterialUnit: 'kg',
        processedStock: 0,
        processedUnit: 'ly',
        finishedProductStock: stockCountForm.actualQuantity,
        finishedProductUnit: 'ly',
        date: new Date(stockCountForm.date),
        notes: 'Kiểm kê tồn thực',
        createdBy: 'system',
        updatedBy: 'system'
      });

      if (result.success) {
        alert('Đã lưu kiểm kê thành công!');
        setStockCountForm({
          productId: '',
          date: new Date().toISOString().split('T')[0],
          actualQuantity: 0
        });
      } else {
        alert(result.error || 'Lỗi khi lưu kiểm kê');
      }
    } catch (error) {
      alert('Lỗi khi lưu kiểm kê');
      console.error(error);
    }
  };

  const handleSaveGridData = async () => {
    if (gridErrors.length > 0) {
      alert('Vui lòng sửa các lỗi trước khi lưu!');
      return;
    }

    for (const row of gridData) {
      if (row.productCode && row.date) {
        await createRecord({
          productCode: row.productCode,
          productName: row.productName || '',
          inputQuantity: Number(row.inputQuantity) || 0,
          rawMaterialStock: Number(row.rawMaterialStock) || 0,
          rawMaterialUnit: row.rawMaterialUnit || '',
          processedStock: Number(row.processedStock) || 0,
          processedUnit: row.processedUnit || '',
          finishedProductStock: Number(row.finishedProductStock) || 0,
          finishedProductUnit: row.finishedProductUnit || '',
          date: new Date(row.date),
          createdBy: 'system',
          updatedBy: 'system',
          notes: row.notes || ''
        });
      }
    }
    
    // Clear grid after successful save
    setGridData([]);
    setGridErrors([]);
    alert('Đã lưu thành công!');
  };

  // Column definitions for grid (unused for now, will be used when EditableDataGrid is integrated)
  // const inventoryColumns = [
  //   {
  //     key: 'productCode',
  //     label: 'Mã sản phẩm',
  //     required: true,
  //     type: 'text' as const,
  //     validation: (value: any) => {
  //       if (!value) return 'Mã sản phẩm không được để trống';
  //       return null;
  //     }
  //   },
  //   {
  //     key: 'rawMaterialStock',
  //     label: 'Tồn nguyên liệu',
  //     required: true,
  //     type: 'number' as const,
  //     validation: (value: any) => {
  //       if (value < 0) return 'Số lượng tồn không được âm';
  //       return null;
  //     }
  //   },
  //   {
  //     key: 'finishedProductStock',
  //     label: 'Tồn thành phẩm',
  //     required: true,
  //     type: 'number' as const,
  //     validation: (value: any) => {
  //       if (value < 0) return 'Số lượng tồn không được âm';
  //       return null;
  //     }
  //   },
  //   {
  //     key: 'productName',
  //     label: 'Tên hàng',
  //     required: false,
  //     type: 'text' as const
  //   },
  //   {
  //     key: 'inputQuantity',
  //     label: 'Nhập',
  //     required: false,
  //     type: 'number' as const
  //   },
  //   {
  //     key: 'date',
  //     label: 'Ngày ghi nhận',
  //     required: true,
  //     type: 'date' as const
  //   },
  //   {
  //     key: 'notes',
  //     label: 'Ghi chú',
  //     required: false,
  //     type: 'text' as const
  //   }
  // ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nhập liệu tồn kho</h1>
            <p className="mt-2 text-gray-600">
              Quản lý nhập kho, xuất sổ, và kiểm kê tồn thực
            </p>
          </div>
        </div>
        
        {/* Input Type Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {/* Admin & Kế toán kho: Can see all tabs */}
          {(userRole === UserRole.ADMIN_MASTER || userRole === UserRole.ADMIN_COMPANY || userRole === UserRole.WAREHOUSE_ACCOUNTANT) && (
            <>
              <button
                onClick={() => setInputType('inventory')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  inputType === 'inventory'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Nhập kho
              </button>
              <button
                onClick={() => setInputType('sales')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  inputType === 'sales'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Xuất sổ (Bán hàng)
              </button>
            </>
          )}
          {/* Thủ kho: Can see Nhập kho and Kiểm kê tabs */}
          {userRole === UserRole.WAREHOUSE_KEEPER && (
            <button
              onClick={() => setInputType('inventory')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                inputType === 'inventory'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Nhập kho
            </button>
          )}
          {/* All roles: Kiểm kê tab */}
          <button
            onClick={() => setInputType('stock-count')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              inputType === 'stock-count'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Kiểm kê (Tồn thực)
          </button>
        </div>
      </div>

      {/* Sales Input Form - Xuất sổ */}
      {inputType === 'sales' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nhập dữ liệu bán hàng (Xuất sổ)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Nhập số lượng bán hàng để cập nhật xuất sổ (book outbound from sales)
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={salesForm.productId}
                  onChange={(e) => setSalesForm({ ...salesForm, productId: e.target.value })}
                >
                  <option value="">Chọn sản phẩm</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.businessCode} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bán</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={salesForm.date}
                  onChange={(e) => setSalesForm({ ...salesForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng bán</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                  placeholder="0"
                  value={salesForm.salesQuantity || ''}
                  onChange={(e) => setSalesForm({ ...salesForm, salesQuantity: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleSaveSales}
              >
                Lưu xuất sổ
              </button>
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => setSalesForm({
                  productId: '',
                  date: new Date().toISOString().split('T')[0],
                  salesQuantity: 0
                })}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Count Form - Tồn thực */}
      {inputType === 'stock-count' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kiểm kê tồn thực</h2>
          <p className="text-sm text-gray-600 mb-4">
            Nhập số lượng tồn thực từ kiểm kê (actual inventory from physical counting)
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sản phẩm</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={stockCountForm.productId}
                  onChange={(e) => setStockCountForm({ ...stockCountForm, productId: e.target.value })}
                >
                  <option value="">Chọn sản phẩm</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.businessCode} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kiểm kê</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={stockCountForm.date}
                  onChange={(e) => setStockCountForm({ ...stockCountForm, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng thực tế</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                  placeholder="0"
                  value={stockCountForm.actualQuantity || ''}
                  onChange={(e) => setStockCountForm({ ...stockCountForm, actualQuantity: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleSaveStockCount}
              >
                Lưu kiểm kê
              </button>
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                onClick={() => setStockCountForm({
                  productId: '',
                  date: new Date().toISOString().split('T')[0],
                  actualQuantity: 0
                })}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regular Inventory Input */}
      {inputType === 'inventory' && (
        <>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setInputMode('form')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    inputMode === 'form'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📝 Form
                </button>
                <button
                  onClick={() => setInputMode('grid')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    inputMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Excel-like
                </button>
              </div>
            </div>
            
            {/* Action Buttons */}
            {inputMode === 'form' && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                + Thêm bản ghi
              </button>
            )}
            {inputMode === 'grid' && gridData.length > 0 && (
              <button
                onClick={handleSaveGridData}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Đang lưu...' : '💾 Lưu dữ liệu'}
              </button>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Có lỗi xảy ra</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={clearError}
                      className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Mode */}
          {inputMode === 'form' && (
            <>
              {/* Form */}
              {showForm && (
                <InventoryInputForm
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  initialData={editingRecord || undefined}
                  isLoading={isLoading}
                />
              )}

              {/* Table */}
              {!showForm && (
                <InventoryTable
                  records={records}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isLoading={isLoading}
                />
              )}
            </>
          )}

          {/* Grid Mode - Excel-like */}
          {inputMode === 'grid' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  📊 Nhập liệu nhanh - Excel-like
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Click vào ô để chỉnh sửa, hoặc paste dữ liệu từ Excel/Google Sheets (Ctrl+V)
                </p>
              </div>
              
              {/* <EditableDataGrid
                data={gridData}
                errors={gridErrors}
                columns={inventoryColumns}
                maxRows={100}
                allowAddRows={true}
                allowRemoveRows={true}
              /> */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">📊 EditableDataGrid sẽ được tích hợp sau khi fix lỗi shared package</p>
              </div>
              
              {gridData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <div className="text-lg font-medium mb-2">Chưa có dữ liệu</div>
                  <div className="text-sm">
                    Nhấn "Thêm dòng" hoặc paste dữ liệu từ Excel (Ctrl+V) để bắt đầu
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InventoryInputPage;
