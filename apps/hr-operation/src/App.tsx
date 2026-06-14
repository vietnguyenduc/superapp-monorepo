﻿﻿﻿import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };
import { Users, CalendarDays, Clock, FileText, Banknote, ShieldCheck } from 'lucide-react';
import EmployeeDirectory from './pages/EmployeeDirectory';
import ShiftManagement from './pages/ShiftManagement';
import AttendancePage from './pages/AttendancePage';
import LeaveManagement from './pages/LeaveManagement';
import PayrollManagement from './pages/PayrollManagement';
import PerformanceDashboard from './pages/PerformanceDashboard';
import HRSettings from './pages/HRSettings';
import Manual from './pages/Manual/Manual';
import LoginPage from './pages/LoginPage';
import { Target, Settings, BookOpen } from 'lucide-react';
import AppSwitcher from './components/Layout/AppSwitcher';
import MobileBottomNav from './components/Layout/MobileBottomNav';

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/employees', label: 'Hồ sơ Nhân sự', icon: Users },
    { path: '/shifts', label: 'Xếp ca', icon: CalendarDays },
    { path: '/attendance', label: 'Chấm công', icon: Clock },
    { path: '/leaves', label: 'Đơn từ', icon: FileText },
    { path: '/payroll', label: 'Bảng lương 3P', icon: Banknote },
    { path: '/performance', label: 'KPI & OKR', icon: Target },
    { path: '/settings', label: 'Cài đặt', icon: Settings },
    { path: '/manual', label: 'Hướng dẫn sử dụng', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-4rem)] flex flex-col fixed pt-6 hidden lg:flex">
      <div className="px-6 mb-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quản lý chung</h2>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                active 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 m-4 bg-slate-50 border border-slate-100 rounded-xl">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Dữ liệu mã hóa
        </div>
        <p className="text-xs text-slate-500">Mọi dữ liệu bảng công & lương đều được cô lập theo Công ty.</p>
      </div>
    </aside>
  );
};

const App = () => {
  return (
    <BrowserRouter future={routerFuture}>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        {/* Simple Header */}
        <header className="bg-white border-b border-slate-200 h-16 fixed top-0 w-full z-10 flex items-center">
          <div className="w-full px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-tight">HR & Payroll <span className="font-medium text-slate-400 ml-2">Operation</span></span>
            </div>
            <div className="flex items-center gap-4">
              <AppSwitcher />
            </div>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex pt-16 flex-1 h-full">
          <Sidebar />
          <main className="flex-1 lg:ml-64 p-6 sm:p-8 pb-20 lg:pb-8">
            <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<Navigate to="/employees" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/employees" element={<EmployeeDirectory />} />
                <Route path="/shifts" element={<ShiftManagement />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/leaves" element={<LeaveManagement />} />
                <Route path="/payroll" element={<PayrollManagement />} />
                <Route path="/performance" element={<PerformanceDashboard />} />
                <Route path="/settings" element={<HRSettings />} />
                <Route path="/manual" element={<Manual />} />
              </Routes>
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </BrowserRouter>
  );
};

export default App;
