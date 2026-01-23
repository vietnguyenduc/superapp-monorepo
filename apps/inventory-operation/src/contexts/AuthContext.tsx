import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, Permission, hasPermission, getRolePermissions } from '../types/UserRole';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  switchRole: (role: UserRole) => void; // For demo purposes
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const MOCK_USERS: User[] = [
  {
    id: 'user-001',
    username: 'thukho',
    email: 'thukho@company.com',
    fullName: 'Nguyễn Văn Thủ Kho',
    role: UserRole.WAREHOUSE_KEEPER,
    permissions: getRolePermissions(UserRole.WAREHOUSE_KEEPER),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin',
  },
  {
    id: 'user-002',
    username: 'ketoan',
    email: 'ketoan@company.com',
    fullName: 'Trần Thị Kế Toán',
    role: UserRole.WAREHOUSE_ACCOUNTANT,
    permissions: getRolePermissions(UserRole.WAREHOUSE_ACCOUNTANT),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin',
  },
  {
    id: 'user-003',
    username: 'quanly',
    email: 'quanly@company.com',
    fullName: 'Lê Văn Quản Lý',
    role: UserRole.OPERATIONS_MANAGER,
    permissions: getRolePermissions(UserRole.OPERATIONS_MANAGER),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin',
  },
  {
    id: 'user-004',
    username: 'chudn',
    email: 'chudn@company.com',
    fullName: 'Phạm Thị Chủ Doanh Nghiệp',
    role: UserRole.BUSINESS_OWNER,
    permissions: getRolePermissions(UserRole.BUSINESS_OWNER),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin',
  },
  {
    id: 'user-005',
    username: 'admin',
    email: 'admin@company.com',
    fullName: 'System Administrator',
    role: UserRole.ADMIN,
    permissions: getRolePermissions(UserRole.ADMIN),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'system',
  },
];

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('inventory_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('inventory_user');
      }
    } else {
      // Auto-login as admin for demo
      const adminUser = MOCK_USERS.find(u => u.role === UserRole.ADMIN);
      if (adminUser) {
        setUser(adminUser);
        setIsAuthenticated(true);
        localStorage.setItem('inventory_user', JSON.stringify(adminUser));
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call an API
    const foundUser = MOCK_USERS.find(u => u.username === username);
    
    if (foundUser && foundUser.isActive) {
      // Update last login
      const updatedUser = {
        ...foundUser,
        lastLoginAt: new Date(),
      };
      
      setUser(updatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('inventory_user', JSON.stringify(updatedUser));
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('inventory_user');
  };

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return hasPermission(user, permission);
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      role,
      permissions: getRolePermissions(role),
      updatedAt: new Date(),
    };
    
    setUser(updatedUser);
    localStorage.setItem('inventory_user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    hasPermission: checkPermission,
    switchRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
