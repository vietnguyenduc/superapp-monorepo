// Login Form Component with Role-based Authentication
// Handles user login and role-based access control

import React, { useState } from 'react';
import { Button } from '../UI/Button';
import { Card } from '../UI/Card';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading = false }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      const result = await onLogin(username, password);
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập hệ thống
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Quản lý tồn kho và vận hành
          </p>
        </div>

        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Nhập tên đăng nhập"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Nhập mật khẩu"
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Tài khoản demo:</p>
              <div className="space-y-1">
                <p><strong>Admin:</strong> admin / password123</p>
                <p><strong>Quản lý:</strong> manager / password123</p>
                <p><strong>Kế toán:</strong> accountant / password123</p>
                <p><strong>Thủ kho:</strong> warehouse_keeper / password123</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Role-based Access Control Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback = <div className="text-center py-8 text-gray-500">Bạn không có quyền truy cập trang này.</div>
}) => {
  // In a real app, get current user from auth context
  const currentUser = null; // Replace with actual auth state
  
  if (!currentUser) {
    return <div className="text-center py-8 text-gray-500">Vui lòng đăng nhập để tiếp tục.</div>;
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.some(permission => 
      currentUser.permissions?.includes(permission)
    );
    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }

  // Check roles
  if (requiredRoles.length > 0) {
    const hasRole = requiredRoles.includes(currentUser.role);
    if (!hasRole) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
