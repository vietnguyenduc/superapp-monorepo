import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  WrenchScrewdriverIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { helpTopics, errorCodes, type HelpTopic } from '../data/helpContent';

const categories = [
  { key: 'getting-started' as const, label: 'Bắt đầu', icon: BookOpenIcon },
  { key: 'workflows' as const, label: 'Quy trình', icon: DocumentTextIcon },
  { key: 'faq' as const, label: 'FAQ', icon: QuestionMarkCircleIcon },
  { key: 'troubleshooting' as const, label: 'Xử lý lỗi', icon: WrenchScrewdriverIcon },
];

const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showErrorCodes, setShowErrorCodes] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredTopics = useMemo(() => {
    let result = helpTopics;

    if (activeCategory !== 'all') {
      result = result.filter(t => t.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q) ||
          t.keywords.some(k => k.toLowerCase().includes(q))
      );
    }

    return result;
  }, [searchQuery, activeCategory]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, HelpTopic[]> = {};
    for (const t of filteredTopics) {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    }
    return groups;
  }, [filteredTopics]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Trợ giúp & Hướng dẫn</h1>
        <p className="text-gray-500 mt-1">
          Tìm kiếm câu trả lời, xử lý lỗi và tìm hiểu quy trình sử dụng
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm chủ đề, từ khóa..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <cat.icon className="h-4 w-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Topics */}
      <div className="space-y-6">
        {Object.entries(groupedByCategory).map(([catKey, topics]) => {
          const catLabel = categories.find(c => c.key === catKey)?.label || catKey;
          return (
            <div key={catKey}>
              <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                {categories.find(c => c.key === catKey)?.icon && (
                  <span className="text-blue-600">
                    {React.createElement(
                      categories.find(c => c.key === catKey)!.icon,
                      { className: 'h-5 w-5' }
                    )}
                  </span>
                )}
                {catLabel}
                <span className="text-sm font-normal text-gray-400">({topics.length})</span>
              </h2>
              <div className="space-y-2">
                {topics.map(topic => {
                  const isExpanded = expandedIds.has(topic.id);
                  return (
                    <div
                      key={topic.id}
                      className="border border-gray-200 rounded-lg bg-white overflow-hidden"
                    >
                      <button
                        onClick={() => toggleExpand(topic.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{topic.title}</span>
                        {isExpanded ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                            {topic.content}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1">
                            {topic.keywords.slice(0, 4).map(k => (
                              <span
                                key={k}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full cursor-pointer hover:bg-gray-200"
                                onClick={() => setSearchQuery(k)}
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <QuestionMarkCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">Không tìm thấy kết quả</p>
            <p>Thử tìm kiếm với từ khóa khác</p>
          </div>
        )}
      </div>

      {/* Error Code Reference */}
      <div className="mt-10 border-t border-gray-200 pt-6">
        <button
          onClick={() => setShowErrorCodes(!showErrorCodes)}
          className="flex items-center gap-2 text-gray-700 font-medium hover:text-gray-900"
        >
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
          Bảng mã lỗi tham khảo
          {showErrorCodes ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </button>

        {showErrorCodes && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(errorCodes).map(([code, info]) => (
              <div key={code} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-mono font-bold rounded">
                    {code}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">{info.description}</p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Cách xử lý:</span> {info.solution}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="mt-10 bg-blue-50 border border-blue-100 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Liên hệ hỗ trợ</h3>
        <p className="text-sm text-blue-800 mb-3">
          Nếu không tìm thấy câu trả lời, hãy liên hệ đội ngũ kỹ thuật:
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Email: support@company.com</li>
          <li>Đối với lỗi RLS / đăng nhập: liên hệ admin_master</li>
          <li>Đối với lỗi nhập liệu / import: liên hệ admin_company</li>
          <li>Đính kèm screenshot console (F12) và mã lỗi nếu có</li>
        </ul>
      </div>
    </div>
  );
};

export default HelpPage;
