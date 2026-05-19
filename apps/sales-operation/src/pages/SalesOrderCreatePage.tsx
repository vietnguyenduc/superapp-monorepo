import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  DocumentPlusIcon,
  TableCellsIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import EditableDataGrid from '../components/ImportExport/EditableDataGrid';

const SalesOrderCreatePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'single';
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>(initialTab as 'single' | 'bulk');
  const [gridData, setGridData] = useState<any[]>([]);

  const columns = [
    { key: 'customer', label: 'Khách hàng', type: 'select' as const, options: ['Khách vãng lai', 'Nguyễn Văn A', 'Công ty TNHH ABC'], required: true },
    { key: 'product', label: 'Sản phẩm', type: 'select' as const, options: ['Sản phẩm 1', 'Sản phẩm 2', 'Sản phẩm 3'], required: true },
    { key: 'quantity', label: 'Số lượng', type: 'number' as const, required: true },
    { key: 'unit_price', label: 'Đơn giá', type: 'number' as const, required: true },
    { key: 'discount', label: 'Giảm giá', type: 'number' as const },
    { key: 'note', label: 'Ghi chú', type: 'text' as const },
  ];

  const handleTabChange = (tab: 'single' | 'bulk') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tạo Đơn Hàng Mới</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Tạo đơn hàng bán lẻ hoặc nhập danh sách đơn hàng hàng loạt.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px px-4" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('single')}
              className={`flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center flex justify-center items-center gap-2 ${
                activeTab === 'single'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <DocumentPlusIcon className="w-5 h-5" />
              Tạo Đơn Lẻ (POS)
            </button>
            <button
              onClick={() => handleTabChange('bulk')}
              className={`flex-1 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-center flex justify-center items-center gap-2 ${
                activeTab === 'bulk'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <TableCellsIcon className="w-5 h-5" />
              Nhập Đơn Hàng Loạt
            </button>
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'single' ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Form Tạo Đơn Hàng Lẻ</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Tại đây nhân viên có thể chọn khách hàng, thêm các sản phẩm, xác định công nợ và hoàn tất đơn hàng.
            </p>
            {/* TODO: Add SalesOrderForm */}
            <div className="h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
               <span className="text-gray-400">Giao diện Tạo Đơn Lẻ đang được xây dựng...</span>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
             <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Nhập Đơn Hàng Lưới</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Nhập nhiều đơn hàng cùng lúc giống như giao diện Import Sản phẩm.
            </p>
            {/* TODO: Add DataGrid / BulkImport Component */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
               <EditableDataGrid 
                 data={gridData} 
                 columns={columns} 
                 errors={[]}
                 onDataChange={setGridData} 
               />
               <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                 <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                   Lưu Đơn Hàng ({gridData.length})
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesOrderCreatePage;
