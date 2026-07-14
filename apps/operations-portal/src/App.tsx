import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { CheckBadgeIcon, DocumentTextIcon, ChatBubbleLeftRightIcon, BeakerIcon, WrenchScrewdriverIcon, ArchiveBoxIcon, PhoneIcon, AcademicCapIcon, BookOpenIcon, Bars3Icon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { CompanyBadge } from '@superapp/iam';
import Dashboard from './pages/Dashboard';
import CheckInPage from './pages/CheckInPage';
import DocumentsPage from './pages/DocumentsPage';
import ChatPage from './pages/ChatPage';
import TicketsPage from './pages/TicketsPage';
import AssetsPage from './pages/AssetsPage';
import EmergencyPage from './pages/EmergencyPage';
import TrainingPage from './pages/TrainingPage';
import Manual from './pages/Manual/Manual';
import AppSwitcher from './components/Layout/AppSwitcher';
import MobileMenuDrawer from './components/Layout/MobileMenuDrawer';

const menuItems = [
  { path: '/dashboard', label: 'Tổng quan', icon: BeakerIcon },
  { path: '/check-in', label: 'Check-in', icon: CheckBadgeIcon },
  { path: '/tickets', label: 'Sự cố', icon: WrenchScrewdriverIcon },
  { path: '/assets', label: 'Tài sản', icon: ArchiveBoxIcon },
  { path: '/training', label: 'Đào tạo', icon: AcademicCapIcon },
  { path: '/documents', label: 'Tài liệu', icon: DocumentTextIcon },
  { path: '/chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
  { path: '/emergency', label: 'Khẩn cấp', icon: PhoneIcon },
  { path: '/manual', label: 'Hướng dẫn', icon: BookOpenIcon },
];

const mainNavItems = menuItems.slice(0, 4); // 4 items chính
const moreMenuItems = menuItems.slice(4);   // items còn lại cho drawer "Thêm"

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-[calc(100vh-4rem)] flex flex-col fixed pt-6 hidden lg:flex">
      <div className="px-6 mb-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nghiệp vụ Vận hành</h2>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                active 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

/**
 * MobileBottomNav – chuẩn global: 4 items chính + nút "Thêm" (thứ 5)
 * Nút "Thêm" mở MobileMenuDrawer (bottom sheet) chứa các items còn lại.
 */
const MobileBottomNav = () => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom shadow-lg">
        <div className="flex items-center justify-around px-2 py-1">
          {mainNavItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${
                  active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* Nút "Thêm" – mở drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all text-slate-500 hover:text-slate-700"
          >
            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
              <PlusIcon className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-[10px] font-medium">Thêm</span>
          </button>
        </div>
      </nav>

      {/* MobileMenuDrawer – bottom sheet chứa các items còn lại */}
      <MobileMenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={moreMenuItems}
      />
    </>
  );
};

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 h-16 fixed top-0 w-full z-10 flex items-center">
        <div className="w-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger – mở sidebar drawer */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-5 h-5" />
              ) : (
                <Bars3Icon className="w-5 h-5" />
              )}
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <BeakerIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">Cổng Thông tin <span className="font-medium text-slate-400 ml-2 hidden sm:inline">Vận hành</span></span>
          </div>
          <div className="flex items-center gap-4">
            <CompanyBadge />
            <AppSwitcher />
          </div>
        </div>
      </header>

      <div className="flex pt-16 flex-1 h-full">
        <Sidebar />
        <main className="flex-1 lg:ml-64 p-4 sm:p-8 pb-20 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/check-in" element={<CheckInPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/training" element={<TrainingPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/emergency" element={<EmergencyPage />} />
              <Route path="/manual" element={<Manual />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation – 4 items + "Thêm" */}
      <MobileBottomNav />

      {/* Mobile sidebar drawer (khi bấm hamburger) */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed top-16 left-0 bottom-16 w-72 bg-white shadow-2xl z-50 lg:hidden overflow-y-auto">
            <div className="p-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Nghiệp vụ Vận hành</h2>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const active = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                        active
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
