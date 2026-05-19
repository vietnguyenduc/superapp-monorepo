import React from 'react';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  lowStockAlerts: number;
  totalValue: number;
  todayInbound: number;
  todayOutbound: number;
  varianceCount: number;
}

interface RecentActivity {
  id: string;
  type: 'inbound' | 'outbound' | 'variance' | 'audit';
  description: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

const DashboardPage: React.FC = () => {
  // Static data for professional dashboard
  const stats: DashboardStats = {
    totalProducts: 150,
    activeProducts: 142,
    lowStockAlerts: 8,
    totalValue: 2500000, // 2.5M VND
    todayInbound: 15,
    todayOutbound: 23,
    varianceCount: 3,
  };
  
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'inbound',
      description: 'Nhập kho - Cà phê Arabica (50kg)',
      time: '10 phút trước',
      status: 'success',
    },
    {
      id: '2',
      type: 'outbound',
      description: 'Xuất kho - Bánh mì sandwich (25 phần)',
      time: '25 phút trước',
      status: 'info',
    },
    {
      id: '3',
      type: 'variance',
      description: 'Phát hiện lệch kho - Nước cam tươi',
      time: '45 phút trước',
      status: 'warning',
    },
    {
      id: '4',
      type: 'audit',
      description: 'Kiểm kho định kỳ - Khu vực A',
      time: '1 giờ trước',
      status: 'info',
    },
    {
      id: '5',
      type: 'inbound',
      description: 'Nhập kho - Bánh croissant (100 cái)',
      time: '2 giờ trước',
      status: 'success',
    },
  ];

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'inbound': return TruckIcon;
      case 'outbound': return ArrowTrendingDownIcon;
      case 'variance': return ExclamationTriangleIcon;
      case 'audit': return ClipboardDocumentListIcon;
      default: return ClipboardDocumentListIcon;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (type: string) => {
    switch (type) {
      case 'inbound': return 'Nhập';
      case 'outbound': return 'Xuất';
      case 'variance': return 'Lệch';
      case 'audit': return 'Kiểm';
      default: return 'Khác';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard - Quản lý Xuất Nhập Tồn
          </h1>
          <p className="text-gray-600 mt-1">
            Tổng quan hoạt động kho hàng hôm nay
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Sản Phẩm</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
              <p className="text-sm text-green-600 mt-1">+5 sản phẩm mới</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sản Phẩm Hoạt Động</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeProducts}</p>
              <p className="text-sm text-gray-500 mt-1">Đang có tồn kho</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cảnh Báo Lệch Kho</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.lowStockAlerts}</p>
              <p className="text-sm text-red-500 mt-1">Cần xử lý ngay</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Giá Trị Tồn Kho</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {formatCurrency(stats.totalValue)}
              </p>
              <p className="text-sm text-purple-500 mt-1">Tổng tài sản</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nhập Kho Hôm Nay</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.todayInbound}</p>
              <p className="text-sm text-gray-500 mt-1">Lô hàng</p>
            </div>
            <TruckIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Xuất Kho Hôm Nay</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.todayOutbound}</p>
              <p className="text-sm text-gray-500 mt-1">Đơn hàng</p>
            </div>
            <ArrowTrendingDownIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Báo Cáo Lệch Kho</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{stats.varianceCount}</p>
              <p className="text-sm text-gray-500 mt-1">Chờ xử lý</p>
            </div>
            <ClipboardDocumentListIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Hoạt Động Gần Đây</h2>
          <p className="text-sm text-gray-600 mt-1">Theo dõi các thao tác mới nhất trong hệ thống</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const IconComponent = getActivityIcon(activity.type);
              const iconColor = getActivityColor(activity.status);
              const badgeClass = getStatusBadge(activity.status);
              const statusText = getStatusText(activity.type);
              
              return (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <IconComponent className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Xem tất cả hoạt động →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao Tác Nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <TruckIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Nhập Kho</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <ArrowTrendingDownIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Xuất Kho</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <ClipboardDocumentListIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Kiểm Kho</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center">
            <ChartBarIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Báo Cáo</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
