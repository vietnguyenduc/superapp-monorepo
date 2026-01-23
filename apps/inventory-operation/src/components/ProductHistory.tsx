import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductHistoryEntry {
  id: string;
  productId: string;
  action: 'create' | 'update' | 'delete' | 'conversion_add' | 'conversion_remove';
  changes: Record<string, { old: any; new: any }>;
  timestamp: Date;
  userId: string;
  userName: string;
}

interface ProductHistoryProps {
  product: Product;
  onClose: () => void;
}

const ProductHistory: React.FC<ProductHistoryProps> = ({ product, onClose }) => {
  const [history, setHistory] = useState<ProductHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [product.id]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      // Mock data for now - in real implementation, this would fetch from backend
      const mockHistory: ProductHistoryEntry[] = [
        {
          id: '1',
          productId: product.id,
          action: 'create',
          changes: {
            name: { old: null, new: product.name },
            category: { old: null, new: product.category },
            businessStatus: { old: null, new: product.businessStatus }
          },
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          userId: 'user1',
          userName: 'Nguyễn Văn A'
        },
        {
          id: '2',
          productId: product.id,
          action: 'update',
          changes: {
            businessStatus: { old: 'inactive', new: 'active' },
            inputUnit: { old: 'quả', new: 'kg' }
          },
          timestamp: new Date(Date.now() - 43200000), // 12 hours ago
          userId: 'user2',
          userName: 'Trần Thị B'
        },
        {
          id: '3',
          productId: product.id,
          action: 'conversion_add',
          changes: {
            conversion: { 
              old: null, 
              new: { fromUnit: 'quả', toUnit: 'miếng', rate: 8 }
            }
          },
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          userId: 'user1',
          userName: 'Nguyễn Văn A'
        }
      ];
      
      setHistory(mockHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: ProductHistoryEntry['action']) => {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'conversion_add': return '🔄';
      case 'conversion_remove': return '❌';
      default: return '📝';
    }
  };

  const getActionText = (action: ProductHistoryEntry['action']) => {
    switch (action) {
      case 'create': return 'Tạo sản phẩm';
      case 'update': return 'Cập nhật thông tin';
      case 'delete': return 'Xóa sản phẩm';
      case 'conversion_add': return 'Thêm quy đổi';
      case 'conversion_remove': return 'Xóa quy đổi';
      default: return 'Thay đổi';
    }
  };

  const formatChange = (key: string, change: { old: any; new: any }) => {
    const fieldNames: Record<string, string> = {
      name: 'Tên sản phẩm',
      category: 'Danh mục',
      businessStatus: 'Trạng thái kinh doanh',
      inputUnit: 'Đơn vị nhập',
      outputUnit: 'Đơn vị xuất',
      conversion: 'Quy đổi'
    };

    const fieldName = fieldNames[key] || key;
    
    if (key === 'businessStatus') {
      const statusText = (status: string) => status === 'active' ? 'Đang kinh doanh' : 'Ngừng kinh doanh';
      return `${fieldName}: ${change.old ? statusText(change.old) : 'Không có'} → ${statusText(change.new)}`;
    }
    
    if (key === 'conversion' && change.new) {
      const conv = change.new;
      return `${fieldName}: 1 ${conv.fromUnit} = ${conv.rate} ${conv.toUnit}`;
    }
    
    return `${fieldName}: ${change.old || 'Không có'} → ${change.new}`;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} ngày trước`;
    } else if (hours > 0) {
      return `${hours} giờ trước`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} phút trước`;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Lịch sử thay đổi
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {product.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Đang tải lịch sử...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>Chưa có lịch sử thay đổi</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getActionIcon(entry.action)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {getActionText(entry.action)}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        {Object.entries(entry.changes).map(([key, change]) => (
                          <div key={key} className="text-sm text-gray-700">
                            {formatChange(key, change)}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Thực hiện bởi: {entry.userName}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductHistory;
