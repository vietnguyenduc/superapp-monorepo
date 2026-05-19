import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCatalogForm from '../components/ProductCatalogForm';
import ProductImportGrid from '../components/ProductImportGrid';
import ProductBulkImport from '../components/ProductBulkImport';
import { useProductCatalog } from '../hooks/useProductCatalog';
import { Product } from '../types';

type ImportTab = 'single' | 'multiple' | 'bulk';

const TAB_CONFIG: { id: ImportTab; label: string; icon: string; desc: string }[] = [
  { id: 'single', label: 'Nhập từng mục', icon: '📝', desc: 'Thêm 1 sản phẩm qua form' },
  { id: 'multiple', label: 'Nhập multiple', icon: '📊', desc: 'Nhập nhiều dòng dạng bảng (Excel-like)' },
  { id: 'bulk', label: 'Nhập bulk', icon: '📁', desc: 'Upload file Excel/CSV' },
];

const ProductCatalogImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as ImportTab) || 'single';
  const [activeTab, setActiveTab] = useState<ImportTab>(initialTab);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { createProduct, isLoading } = useProductCatalog({ autoLoad: false });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTabChange = (tab: ImportTab) => {
    setActiveTab(tab);
    setSearchParams(new URLSearchParams([['tab', tab]]));
  };

  const handleSingleSubmit = async (data: Partial<Product>) => {
    try {
      const result = await createProduct({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
      } as Omit<Product, 'id'>);
      if (result.success) {
        showNotification('success', 'Thêm sản phẩm thành công!');
      } else {
        showNotification('error', 'Có lỗi xảy ra khi thêm sản phẩm.');
      }
    } catch {
      showNotification('error', 'Lỗi kết nối, vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 transition-colors">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/product-management')}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                title="Quay lại danh mục"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl">📦</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Import Danh mục sản phẩm</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chọn phương thức nhập phù hợp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`rounded-2xl shadow-2xl p-4 pr-12 border flex items-center gap-3 min-w-[320px] ${
              notification.type === 'success' 
                ? 'bg-white dark:bg-gray-900 border-green-200 dark:border-green-900/50' 
                : 'bg-white dark:bg-gray-900 border-red-200 dark:border-red-900/50'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}>
                {notification.type === 'success' ? '✅' : '❌'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Thông báo</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{notification.message}</span>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-4 py-3.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-600 dark:border-blue-500'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-b-2 border-transparent'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab description */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 transition-colors">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {TAB_CONFIG.find(t => t.id === activeTab)?.desc}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors">

          {/* Single entry */}
          {activeTab === 'single' && (
            <ProductCatalogForm
              onSubmit={handleSingleSubmit}
              onCancel={() => navigate('/product-management')}
              isLoading={isLoading}
            />
          )}

          {/* Multiple / Excel-like */}
          {activeTab === 'multiple' && (
            <ProductImportGrid
              onImportComplete={() => {
                showNotification('success', 'Đã lưu sản phẩm thành công!');
              }}
              onCancel={() => navigate('/product-management')}
            />
          )}

          {/* Bulk upload */}
          {activeTab === 'bulk' && (
            <ProductBulkImport
              onImportComplete={() => {
                showNotification('success', 'Import file thành công!');
              }}
              onCancel={() => navigate('/product-management')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCatalogImportPage;
