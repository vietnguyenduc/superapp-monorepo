import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, getRoleDisplayName } from '../../types/UserRole';

export const UserRoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const roles = Object.values(UserRole);

  const handleRoleSwitch = (role: UserRole) => {
    switchRole(role);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {user.fullName.charAt(0)}
            </span>
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
            <div className="text-xs text-gray-500">{getRoleDisplayName(user.role)}</div>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-900">Chuyển đổi vai trò</div>
              <div className="text-xs text-gray-500 mt-1">
                Demo: Thay đổi vai trò để test phân quyền
              </div>
            </div>
            
            <div className="py-2">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                    user.role === role ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  <div>
                    <div className="font-medium">{getRoleDisplayName(role)}</div>
                    <div className="text-xs text-gray-500">{role}</div>
                  </div>
                  {user.role === role && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="text-xs text-gray-600">
                <strong>Quyền hiện tại:</strong> {user.permissions.length} quyền
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Mỗi vai trò có bộ quyền khác nhau
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserRoleSwitcher;
