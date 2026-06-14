﻿import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickAddMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-6 z-40">
      <div className="relative">
        {/* Menu Items */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 flex flex-col items-end space-y-3">
            <button
              onClick={() => handleNavigate('/inventory-transaction-import?tab=single')}
              className="flex items-center space-x-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 group"
            >
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">Nhập/Xuất giao dịch</span>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
            </button>
            <button
              onClick={() => handleNavigate('/product-management')}
              className="flex items-center space-x-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 group"
            >
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">Thêm sản phẩm</span>
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
            </button>
            <button
              onClick={() => handleNavigate('/variance-report')}
              className="flex items-center space-x-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700 group"
            >
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-400">Báo cáo chênh lệch</span>
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
            </button>
          </div>
        )}

        {/* FAB Main Button */}
        <button
          onClick={toggleMenu}
          className={`w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-transform duration-200 ${isOpen ? 'bg-red-500 rotate-45' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default QuickAddMenu;
