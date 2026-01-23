import React, { useState } from 'react';
import InventoryInputForm from '../components/InventoryInputForm';
import InventoryTable from '../components/InventoryTable';
// import { EditableDataGrid } from '@repo/ui'; // Temporarily disabled
import { useInventory } from '../hooks/useInventory';
import { InventoryRecord, ImportError } from '../types';

const InventoryInputPage: React.FC = () => {
  const [inputMode, setInputMode] = useState<'form' | 'grid'>('form');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<InventoryRecord | null>(null);
  const [gridData, setGridData] = useState<any[]>([]);
  const [gridErrors, setGridErrors] = useState<ImportError[]>([]);
  
  const {
    records,
    isLoading,
    error,
    createRecord,
    updateRecord,
    deleteRecord,
    clearError,
  } = useInventory({ autoLoad: true });

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

  // Grid mode handlers
  const handleGridDataChange = (newData: any[]) => {
    setGridData(newData);
    // Validate data and set errors
    const errors: ImportError[] = [];
    newData.forEach((row, index) => {
      if (!row.productCode) {
        errors.push({ row: index, column: 'productCode', message: 'Mã sản phẩm không được để trống' });
      }
      if (!row.date) {
        errors.push({ row: index, column: 'date', message: 'Ngày ghi nhận không được để trống' });
      }
      if (row.rawMaterialStock < 0) {
        errors.push({ row: index, column: 'rawMaterialStock', message: 'Tồn nguyên liệu không được âm' });
      }
      if (row.finishedProductStock < 0) {
        errors.push({ row: index, column: 'finishedProductStock', message: 'Tồn thành phẩm không được âm' });
      }
    });
    setGridErrors(errors);
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

  // Column definitions for grid
  const inventoryColumns = [
    {
      key: 'productCode',
      label: 'Mã sản phẩm',
      required: true,
      type: 'text' as const,
      validation: (value: any) => {
        if (!value) return 'Mã sản phẩm không được để trống';
        return null;
      }
    },
    {
      key: 'rawMaterialStock',
      label: 'Tồn nguyên liệu',
      required: true,
      type: 'number' as const,
      validation: (value: any) => {
        if (value < 0) return 'Số lượng tồn không được âm';
        return null;
      }
    },
    {
      key: 'finishedProductStock',
      label: 'Tồn thành phẩm',
      required: true,
      type: 'number' as const,
      validation: (value: any) => {
        if (value < 0) return 'Số lượng tồn không được âm';
        return null;
      }
    },
    {
      key: 'productName',
      label: 'Tên hàng',
      required: false,
      type: 'text' as const
    },
    {
      key: 'inputQuantity',
      label: 'Nhập',
      required: false,
      type: 'number' as const
    },
    {
      key: 'date',
      label: 'Ngày ghi nhận',
      required: true,
      type: 'date' as const
    },
    {
      key: 'notes',
      label: 'Ghi chú',
      required: false,
      type: 'text' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nhập liệu tồn kho</h1>
          <p className="mt-2 text-gray-600">
            Quản lý nhập kho và tồn thực theo ngày (Bảng 1)
          </p>
        </div>
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
            onDataChange={handleGridDataChange}
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
    </div>
  );
};

export default InventoryInputPage;
