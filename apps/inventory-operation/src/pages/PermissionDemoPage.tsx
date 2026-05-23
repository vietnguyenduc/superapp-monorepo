import React from 'react';
import { useAuthContext as useAuth } from '@superapp/iam';
import { Permission } from '../types/UserRole';
import PermissionGuard, { 
  MultiplePermissionGuard, 
  NoPermissionMessage, 
  DisabledButton 
} from '../components/auth/PermissionGuard';
import PermissionInfo from '../components/auth/PermissionInfo';

const PermissionDemoPage: React.FC = () => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Chưa đăng nhập</h2>
          <p className="text-gray-600">Vui lòng đăng nhập để xem demo phân quyền</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Hệ Thống Phân Quyền</h1>
        <p className="text-gray-600">
          Trang này demo các tính năng phân quyền theo vai trò. Thay đổi vai trò ở góc trên bên phải để test.
        </p>
      </div>

      {/* User Info */}
      <PermissionInfo />

      {/* Permission Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Inventory Input Permissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nhập Liệu Tồn Kho</h3>
          <div className="space-y-3">
            
            <PermissionGuard permission={Permission.INVENTORY_INPUT_VIEW}>
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800">✅ Có quyền xem tồn kho</span>
                </div>
              </div>
            </PermissionGuard>

            <PermissionGuard 
              permission={Permission.INVENTORY_INPUT_CREATE}
              fallback={
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-800">❌ Không có quyền tạo mới tồn kho</span>
                  </div>
                </div>
              }
              showFallback={true}
            >
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-800">✅ Có quyền tạo mới tồn kho</span>
                </div>
              </div>
            </PermissionGuard>

            <div className="flex space-x-2">
              <PermissionGuard permission={Permission.INVENTORY_INPUT_EDIT}>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Chỉnh sửa
                </button>
              </PermissionGuard>

              <PermissionGuard 
                permission={Permission.INVENTORY_INPUT_DELETE}
                fallback={
                  <DisabledButton tooltip="Bạn không có quyền xóa tồn kho">
                    <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed">
                      Xóa
                    </button>
                  </DisabledButton>
                }
                showFallback={true}
              >
                <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  Xóa
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>

        {/* Product Catalog Permissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quản Lý Danh Mục</h3>
          <div className="space-y-3">
            
            <MultiplePermissionGuard 
              permissions={[Permission.PRODUCT_CATALOG_VIEW, Permission.PRODUCT_CATALOG_EDIT]}
              requireAll={true}
              fallback={<NoPermissionMessage message="Cần quyền xem VÀ chỉnh sửa danh mục" />}
              showFallback={true}
            >
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-blue-800">✅ Có đầy đủ quyền quản lý danh mục</span>
              </div>
            </MultiplePermissionGuard>

            <MultiplePermissionGuard 
              permissions={[Permission.PRODUCT_CATALOG_CREATE, Permission.PRODUCT_CATALOG_DELETE]}
              requireAll={false}
              fallback={
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <span className="text-yellow-800">⚠️ Không có quyền tạo mới HOẶC xóa danh mục</span>
                </div>
              }
              showFallback={true}
            >
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <span className="text-green-800">✅ Có quyền tạo mới hoặc xóa danh mục</span>
              </div>
            </MultiplePermissionGuard>
          </div>
        </div>

        {/* Special Outbound Permissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Xuất Đặc Biệt</h3>
          <div className="space-y-3">
            
            <PermissionGuard permission={Permission.SPECIAL_OUTBOUND_VIEW}>
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <span className="text-green-800">✅ Có quyền xem xuất đặc biệt</span>
              </div>
            </PermissionGuard>

            <div className="flex space-x-2">
              <PermissionGuard permission={Permission.SPECIAL_OUTBOUND_APPROVE}>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Phê duyệt
                </button>
              </PermissionGuard>

              <PermissionGuard permission={Permission.SPECIAL_OUTBOUND_REJECT}>
                <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  Từ chối
                </button>
              </PermissionGuard>

              <PermissionGuard 
                permission={Permission.SPECIAL_OUTBOUND_APPROVE}
                fallback={
                  <DisabledButton tooltip="Chỉ quản lý mới có quyền phê duyệt">
                    <button className="px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed">
                      Phê duyệt (Disabled)
                    </button>
                  </DisabledButton>
                }
                showFallback={true}
              />
            </div>
          </div>
        </div>

        {/* Admin Permissions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quyền Quản Trị</h3>
          <div className="space-y-3">
            
            <PermissionGuard 
              permission={Permission.USER_MANAGEMENT}
              fallback={<NoPermissionMessage message="Chỉ chủ doanh nghiệp và admin mới có quyền này" />}
              showFallback={true}
            >
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                <span className="text-purple-800">✅ Có quyền quản lý người dùng</span>
              </div>
            </PermissionGuard>

            <PermissionGuard 
              permission={Permission.SYSTEM_ADMIN}
              fallback={<NoPermissionMessage message="Chỉ admin hệ thống mới có quyền này" />}
              showFallback={true}
            >
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <span className="text-red-800">🔥 Có quyền quản trị hệ thống</span>
              </div>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Permission Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm Tắt Quyền Hiện Tại</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.values(Permission).map((permission) => (
            <div 
              key={permission}
              className={`p-2 rounded-md text-sm ${
                hasPermission(permission) 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}
            >
              <div className="flex items-center">
                {hasPermission(permission) ? (
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="font-mono text-xs">{permission}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PermissionDemoPage;
