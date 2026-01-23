import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Permission, getRoleDisplayName } from '../../types/UserRole';

export const PermissionInfo: React.FC = () => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!user) return null;

  const permissionGroups = {
    'Nhập liệu tồn kho': user.permissions.filter(p => p.includes('inventory_input')),
    'Danh mục hàng hóa': user.permissions.filter(p => p.includes('product_catalog')),
    'Báo cáo bán hàng': user.permissions.filter(p => p.includes('sales_report')),
    'Xuất đặc biệt': user.permissions.filter(p => p.includes('special_outbound')),
    'Báo cáo nhập xuất': user.permissions.filter(p => p.includes('inventory_report')),
    'In phiếu kiểm kho': user.permissions.filter(p => p.includes('stock_check')),
    'Dashboard': user.permissions.filter(p => p.includes('dashboard')),
    'Cài đặt': user.permissions.filter(p => p.includes('settings') || p.includes('user_management')),
    'Hệ thống': user.permissions.filter(p => p.includes('system') || p.includes('audit')),
  };

  const getPermissionDisplayName = (permission: Permission): string => {
    const permissionNames: Record<string, string> = {
      // Inventory Input
      'inventory_input_view': 'Xem',
      'inventory_input_create': 'Tạo mới',
      'inventory_input_edit': 'Chỉnh sửa',
      'inventory_input_delete': 'Xóa',
      
      // Product Catalog
      'product_catalog_view': 'Xem',
      'product_catalog_create': 'Tạo mới',
      'product_catalog_edit': 'Chỉnh sửa',
      'product_catalog_delete': 'Xóa',
      
      // Sales Report
      'sales_report_view': 'Xem',
      'sales_report_create': 'Tạo mới',
      'sales_report_edit': 'Chỉnh sửa',
      'sales_report_delete': 'Xóa',
      
      // Special Outbound
      'special_outbound_view': 'Xem',
      'special_outbound_create': 'Tạo mới',
      'special_outbound_approve': 'Phê duyệt',
      'special_outbound_reject': 'Từ chối',
      
      // Inventory Report
      'inventory_report_view': 'Xem',
      'inventory_report_export': 'Xuất file',
      
      // Stock Check
      'stock_check_print': 'In phiếu',
      'stock_check_export': 'Xuất file',
      
      // Dashboard
      'dashboard_view': 'Xem',
      'dashboard_analytics': 'Phân tích',
      
      // Settings
      'settings_view': 'Xem',
      'settings_edit': 'Chỉnh sửa',
      'user_management': 'Quản lý người dùng',
      
      // System
      'system_admin': 'Quản trị hệ thống',
      'audit_log_view': 'Xem log kiểm toán',
    };
    
    return permissionNames[permission] || permission;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Thông tin phân quyền</h3>
            <p className="text-sm text-gray-500 mt-1">
              Vai trò: <span className="font-medium">{getRoleDisplayName(user.role)}</span>
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
          >
            {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(permissionGroups).map(([groupName, permissions]) => {
            if (permissions.length === 0) return null;
            
            return (
              <div key={groupName} className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">{groupName}</h4>
                <div className="space-y-1">
                  {permissions.map((permission) => (
                    <div key={permission} className="flex items-center text-xs text-gray-600">
                      <svg className="w-3 h-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {getPermissionDisplayName(permission)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3">Tất cả quyền ({user.permissions.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {user.permissions.map((permission) => (
                <div key={permission} className="flex items-center text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-mono text-xs">{permission}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionInfo;
