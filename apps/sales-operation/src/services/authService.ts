// Authentication and Role-based Access Control Service
// Handles user authentication, role management, and permission checking

import { UserRole, Permission, User as UserType } from '../types';

// Use the User type from types/UserRole.ts
export type User = UserType;

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Mock users for testing
const mockUsers: User[] = [
  {
    id: 'user-001',
    username: 'admin',
    email: 'admin@company.com',
    role: UserRole.ADMIN,
    permissions: [
      Permission.DASHBOARD_VIEW,
      Permission.INVENTORY_INPUT_VIEW,
      Permission.INVENTORY_INPUT_CREATE,
      Permission.INVENTORY_INPUT_EDIT,
      Permission.PRODUCT_CATALOG_VIEW,
      Permission.PRODUCT_CATALOG_CREATE,
      Permission.PRODUCT_CATALOG_EDIT,
      Permission.SALES_REPORT_VIEW,
      Permission.SPECIAL_OUTBOUND_APPROVE,
      Permission.INVENTORY_REPORT_EXPORT,
      Permission.USER_MANAGEMENT,
      Permission.AUDIT_LOG_VIEW
    ],
    isActive: true,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: 'user-002',
    username: 'manager',
    email: 'manager@company.com',
    role: UserRole.MANAGER,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.MANAGE_INVENTORY,
      Permission.MANAGE_PRODUCTS,
      Permission.MANAGE_SALES,
      Permission.APPROVE_SPECIAL_OUTBOUND,
      Permission.EXPORT_REPORTS,
      Permission.VIEW_AUDIT_LOGS
    ],
    isActive: true,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: 'user-003',
    username: 'accountant',
    email: 'accountant@company.com',
    role: UserRole.ACCOUNTANT,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.VIEW_INVENTORY,
      Permission.VIEW_PRODUCTS,
      Permission.MANAGE_SALES,
      Permission.EXPORT_REPORTS,
      Permission.VIEW_AUDIT_LOGS
    ],
    isActive: true,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: 'user-004',
    username: 'warehouse_keeper',
    email: 'warehouse@company.com',
    role: UserRole.WAREHOUSE_KEEPER,
    permissions: [
      Permission.VIEW_DASHBOARD,
      Permission.MANAGE_INVENTORY,
      Permission.VIEW_PRODUCTS,
      Permission.VIEW_SALES,
      Permission.REQUEST_SPECIAL_OUTBOUND
    ],
    isActive: true,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  }
];

class AuthService {
  private currentUser: User | null = null;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false
  };

  // Simulate login
  async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    this.authState.isLoading = true;
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = mockUsers.find(u => u.username === username && u.isActive);
      
      if (!user) {
        return { success: false, error: 'Tài khoản không tồn tại hoặc đã bị khóa' };
      }
      
      // In real app, verify password hash
      if (password !== 'password123') {
        return { success: false, error: 'Mật khẩu không chính xác' };
      }
      
      this.currentUser = user;
      this.authState = {
        user,
        isAuthenticated: true,
        isLoading: false
      };
      
      // Store in localStorage for persistence
      localStorage.setItem('inventory_user', JSON.stringify(user));
      
      return { success: true, user };
    } catch (error) {
      this.authState.isLoading = false;
      return { success: false, error: 'Lỗi đăng nhập. Vui lòng thử lại.' };
    }
  }

  // Logout
  logout(): void {
    this.currentUser = null;
    this.authState = {
      user: null,
      isAuthenticated: false,
      isLoading: false
    };
    localStorage.removeItem('inventory_user');
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get auth state
  getAuthState(): AuthState {
    return this.authState;
  }

  // Check if user has specific permission
  hasPermission(permission: Permission): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.permissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: Permission[]): boolean {
    if (!this.currentUser) return false;
    return permissions.some(permission => this.currentUser!.permissions.includes(permission));
  }

  // Check if user has all specified permissions
  hasAllPermissions(permissions: Permission[]): boolean {
    if (!this.currentUser) return false;
    return permissions.every(permission => this.currentUser!.permissions.includes(permission));
  }

  // Check if user has specific role
  hasRole(role: UserRole): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: UserRole[]): boolean {
    if (!this.currentUser) return false;
    return roles.includes(this.currentUser.role);
  }

  // Initialize auth state from localStorage
  initializeAuth(): void {
    const storedUser = localStorage.getItem('inventory_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        this.currentUser = user;
        this.authState = {
          user,
          isAuthenticated: true,
          isLoading: false
        };
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('inventory_user');
      }
    }
  }

  // Get role display name
  getRoleDisplayName(role: UserRole): string {
    const roleNames = {
      [UserRole.ADMIN]: 'Quản trị viên',
      [UserRole.MANAGER]: 'Quản lý',
      [UserRole.ACCOUNTANT]: 'Kế toán',
      [UserRole.WAREHOUSE_KEEPER]: 'Thủ kho'
    };
    return roleNames[role] || 'Không xác định';
  }

  // Get permission display name
  getPermissionDisplayName(permission: Permission): string {
    const permissionNames = {
      [Permission.VIEW_DASHBOARD]: 'Xem dashboard',
      [Permission.MANAGE_INVENTORY]: 'Quản lý tồn kho',
      [Permission.VIEW_INVENTORY]: 'Xem tồn kho',
      [Permission.MANAGE_PRODUCTS]: 'Quản lý sản phẩm',
      [Permission.VIEW_PRODUCTS]: 'Xem sản phẩm',
      [Permission.MANAGE_SALES]: 'Quản lý bán hàng',
      [Permission.VIEW_SALES]: 'Xem bán hàng',
      [Permission.APPROVE_SPECIAL_OUTBOUND]: 'Duyệt xuất đặc biệt',
      [Permission.REQUEST_SPECIAL_OUTBOUND]: 'Yêu cầu xuất đặc biệt',
      [Permission.EXPORT_REPORTS]: 'Xuất báo cáo',
      [Permission.MANAGE_USERS]: 'Quản lý người dùng',
      [Permission.VIEW_AUDIT_LOGS]: 'Xem nhật ký audit'
    };
    return permissionNames[permission] || 'Không xác định';
  }
}

// Export singleton instance
export const authService = new AuthService();

// Initialize auth on app start
authService.initializeAuth();
