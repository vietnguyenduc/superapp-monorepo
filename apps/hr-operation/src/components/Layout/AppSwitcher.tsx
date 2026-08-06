import React, { useState, useEffect } from 'react';

const AppSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});

  const apps = [
    { id: 'admin', name: 'Admin Portal', url: import.meta.env.VITE_ADMIN_PORTAL_URL || 'http://localhost:5173', color: 'bg-indigo-100 text-indigo-600' },
    { id: 'sales', name: 'Sales & POS', url: import.meta.env.VITE_SALES_APP_URL || 'http://localhost:5176', color: 'bg-orange-100 text-orange-600' },
    { id: 'inventory', name: 'Inventory', url: import.meta.env.VITE_INVENTORY_APP_URL || 'http://localhost:5175', color: 'bg-emerald-100 text-emerald-600' },
    { id: 'cashflow', name: 'Cashflow', url: import.meta.env.VITE_CASHFLOW_APP_URL || 'http://localhost:5174', color: 'bg-blue-100 text-blue-600' },
    { id: 'hr', name: 'HR & Payroll', url: import.meta.env.VITE_HR_APP_URL || 'http://localhost:5177', color: 'bg-pink-100 text-pink-600' },
    { id: 'accounting', name: 'Accounting', url: import.meta.env.VITE_ACCOUNTING_APP_URL || 'http://localhost:5178', color: 'bg-purple-100 text-purple-600' },
    { id: 'operations', name: 'Operations', url: import.meta.env.VITE_OPERATIONS_APP_URL || 'http://localhost:3006', color: 'bg-cyan-100 text-cyan-600' },
    { id: 'framework-method', name: 'Framework Method', url: import.meta.env.VITE_FRAMEWORK_METHOD_APP_URL || 'http://localhost:5179', color: 'bg-violet-100 text-violet-600' }
  ];

  // Try parsing session tokens from localStorage/cookies or pass standard if needed
  const getUrlWithSession = (baseUrl: string) => {
    try {
      const supabaseSessionKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
      if (supabaseSessionKey) {
        const sessionData = JSON.parse(localStorage.getItem(supabaseSessionKey) || '{}');
        if (sessionData?.access_token) {
          return `${baseUrl}?access_token=${sessionData.access_token}&refresh_token=${sessionData.refresh_token}`;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return baseUrl;
  };

  useEffect(() => {
    if (isOpen) {
      apps.forEach(app => {
        fetch(app.url, { mode: 'no-cors' })
          .then(() => setStatuses(prev => ({ ...prev, [app.id]: true })))
          .catch(() => setStatuses(prev => ({ ...prev, [app.id]: false })));
      });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        title="App Launcher"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Hệ sinh thái Superapp</h3>
            </div>
            <div className="p-2 grid grid-cols-1 gap-1">
              {apps.map(app => (
                <a 
                  key={app.id}
                  href={getUrlWithSession(app.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg ${app.color} flex items-center justify-center font-bold text-lg`}>
                    {app.name[0]}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 flex items-center gap-1">
                      {app.name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {statuses[app.id] === undefined ? (
                        <span className="text-xs text-slate-400">Đang kiểm tra...</span>
                      ) : statuses[app.id] ? (
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-xs text-green-600">Hoạt động</span></span>
                      ) : (
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-xs text-red-600">Ngoại tuyến</span></span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AppSwitcher;
