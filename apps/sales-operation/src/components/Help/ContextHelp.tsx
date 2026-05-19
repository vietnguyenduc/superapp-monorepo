import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { helpTopics } from '../../data/helpContent';

const routeHelpMap: Record<string, { topicIds: string[]; title: string }> = {
  '/dashboard': {
    topicIds: ['gs-1', 'gs-3'],
    title: 'Dashboard',
  },
  '/product-entry': {
    topicIds: ['wf-1', 'faq-1'],
    title: 'Nhập Sản Phẩm',
  },
  '/inventory-entry': {
    topicIds: ['wf-2', 'faq-4'],
    title: 'Nhập Tồn Kho',
  },
  '/product-bulk-import': {
    topicIds: ['wf-3', 'faq-2'],
    title: 'Import Sản Phẩm',
  },
  '/inventory-bulk-import': {
    topicIds: ['wf-3', 'faq-2'],
    title: 'Import Tồn Kho',
  },
  '/product-management': {
    topicIds: ['wf-1', 'faq-4'],
    title: 'Quản Lý Danh Mục',
  },
  '/inventory-input': {
    topicIds: ['wf-2'],
    title: 'Nhập Liệu Tồn Kho',
  },
  '/sales-input': {
    topicIds: ['wf-4'],
    title: 'Nhập Bán Hàng',
  },
  '/variance-report': {
    topicIds: ['gs-3'],
    title: 'Báo Cáo Lệch',
  },
  '/export-reports': {
    topicIds: ['wf-4'],
    title: 'Xuất Báo Cáo',
  },
};

const ContextHelp: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const currentPath = location.pathname;
  const helpConfig = Object.entries(routeHelpMap).find(([path]) =>
    currentPath.startsWith(path)
  )?.[1];

  const relatedTopics = helpConfig
    ? helpTopics.filter(t => helpConfig.topicIds.includes(t.id))
    : [];

  if (!helpConfig || relatedTopics.length === 0) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 bg-white text-blue-600 border border-blue-200 p-3 rounded-full shadow-lg hover:bg-blue-50 transition-colors"
        title={`Trợ giúp: ${helpConfig.title}`}
      >
        <QuestionMarkCircleIcon className="h-5 w-5" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-16 left-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-800">
              Trợ giúp: {helpConfig.title}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto p-4 space-y-4">
            {relatedTopics.map(topic => (
              <div key={topic.id}>
                <h4 className="font-medium text-sm text-gray-900 mb-1">
                  {topic.title}
                </h4>
                <p className="text-xs text-gray-600 whitespace-pre-line">
                  {topic.content.slice(0, 300)}
                  {topic.content.length > 300 ? '...' : ''}
                </p>
              </div>
            ))}
            <a
              href="/help"
              onClick={e => {
                e.preventDefault();
                setIsOpen(false);
                window.location.href = '/help';
              }}
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium pt-2 border-t border-gray-100"
            >
              Xem trang trợ giúp đầy đủ →
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default ContextHelp;
