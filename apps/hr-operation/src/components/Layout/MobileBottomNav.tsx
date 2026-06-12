import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, CalendarDays, Clock, FileText, Banknote, Target, Settings, BookOpen } from 'lucide-react';

const navItems = [
  { path: '/employees', label: 'Nhân sự', icon: Users },
  { path: '/shifts', label: 'Xếp ca', icon: CalendarDays },
  { path: '/attendance', label: 'Chấm công', icon: Clock },
  { path: '/leaves', label: 'Đơn từ', icon: FileText },
  { path: '/payroll', label: 'Lương', icon: Banknote },
  { path: '/performance', label: 'KPI', icon: Target },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all min-w-0 flex-1 ${
                active
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${
                active ? 'bg-indigo-50' : ''
              }`}>
                <item.icon className={`w-5 h-5 ${active ? 'text-indigo-600' : ''}`} />
              </div>
              <span className={`text-[10px] font-medium mt-0.5 truncate w-full text-center ${
                active ? 'text-indigo-600' : 'text-slate-500'
              }`}>
                {item.label}
              </span>
              {active && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
