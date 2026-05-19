import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '../../types/UserRole';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * PermissionGuard component - Hiển thị nội dung chỉ khi user có quyền
 * @param permission - Quyền cần kiểm tra
 * @param children - Nội dung hiển thị khi có quyền
 * @param fallback - Nội dung hiển thị khi không có quyền
 * @param showFallback - Có hiển thị fallback hay không (mặc định: false = ẩn hoàn toàn)
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback,
  showFallback = false,
}) => {
  const { hasPermission } = useAuth();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
};

interface MultiplePermissionGuardProps {
  permissions: Permission[];
  requireAll?: boolean; // true = AND logic, false = OR logic
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * MultiplePermissionGuard - Kiểm tra nhiều quyền cùng lúc
 * @param permissions - Danh sách quyền cần kiểm tra
 * @param requireAll - true: cần tất cả quyền (AND), false: cần ít nhất 1 quyền (OR)
 * @param children - Nội dung hiển thị khi có quyền
 * @param fallback - Nội dung hiển thị khi không có quyền
 * @param showFallback - Có hiển thị fallback hay không
 */
export const MultiplePermissionGuard: React.FC<MultiplePermissionGuardProps> = ({
  permissions,
  requireAll = false,
  children,
  fallback,
  showFallback = false,
}) => {
  const { hasPermission } = useAuth();

  const hasAccess = requireAll
    ? permissions.every(permission => hasPermission(permission))
    : permissions.some(permission => hasPermission(permission));

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
};

// Fallback components
export const NoPermissionMessage: React.FC<{ message?: string }> = ({ 
  message = "Bạn không có quyền truy cập tính năng này" 
}) => (
  <div className="flex items-center justify-center p-8 text-center">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
      <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-yellow-800 mb-2">Không có quyền truy cập</h3>
      <p className="text-yellow-700">{message}</p>
    </div>
  </div>
);

export const DisabledButton: React.FC<{ 
  children: ReactNode;
  tooltip?: string;
}> = ({ 
  children, 
  tooltip = "Bạn không có quyền thực hiện thao tác này" 
}) => (
  <div className="relative group">
    <div className="opacity-50 cursor-not-allowed">
      {children}
    </div>
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
      {tooltip}
    </div>
  </div>
);

export default PermissionGuard;
