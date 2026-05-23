import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Shield, Users, Settings, Database, Activity, LogOut } from 'lucide-react';
import { AuthProvider, useAuthContext } from '@superapp/iam';
import IdentityManagement from './pages/IdentityManagement';
import ConsolidatedReports from './pages/ConsolidatedReports';
import DataLifecycle from './pages/DataLifecycle';
import GlobalSettings from './pages/GlobalSettings';
import CompanyManagement from './pages/CompanyManagement';
import { supabase } from './lib/supabase';
import { AdminProvider, useAdminContext } from './contexts/AdminContext';
import { LayoutGrid, ExternalLink, CheckCircle2, XCircle, LayoutDashboard, Building2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const { session } = useAuthContext();

  if (session) {
    return <Navigate to="/identity" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Portal Login</h2>
          <p className="text-gray-500 mt-2">Sign in to manage the superapp</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen] = React.useState(true);
  const location = useLocation();
  const { user, signOut } = useAuthContext();
  
  const navItems = [
    { id: 'reports', icon: LayoutDashboard, label: 'Consolidated Reports', path: '/reports' },
    { id: 'companies', icon: Building2, label: 'Company Management', path: '/companies', masterOnly: true },
    { id: 'identity', icon: Users, label: 'Identity & Access', path: '/identity' },
    { id: 'data', icon: Database, label: 'Data Lifecycle', path: '/data' },
    { id: 'settings', icon: Settings, label: 'Global Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            Superapp Admin
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.id} 
              to={item.path} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4">
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800">
            {location.pathname === '/identity' && 'Identity & Access Management'}
            {location.pathname === '/reports' && 'Consolidated Reports'}
            {location.pathname === '/data' && 'Data Lifecycle'}
            {location.pathname === '/settings' && 'Global Settings'}
            {location.pathname === '/companies' && 'Company Management'}
          </h2>
          <div className="flex items-center gap-4">
            <AppSwitcher />
            <div className="h-6 w-px bg-gray-200 mx-1"></div>
            <CompanySelector />
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <span className="text-sm text-gray-500">Logged in as {user?.email || 'Admin'}</span>
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>
        
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};

const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, session } = useAuthContext();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading Admin Portal...</div>;
  }
  
  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user as any).role || user.app_metadata?.role;
  if (role !== 'admin_master' && role !== 'admin_company') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="text-red-500 mb-4">
          <XCircle className="w-16 h-16 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          Your account ({role || 'staff'}) does not have permission to view the Admin Portal.
        </p>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Sign Out & Switch Account
        </button>
      </div>
    );
  }

  return (
    <AdminProvider>
      <AdminLayout>{children}</AdminLayout>
    </AdminProvider>
  );
};

const CompanySelector = () => {
  const { companies, selectedCompanyId, setSelectedCompanyId } = useAdminContext();

  if (companies.length <= 1) {
    return companies.length === 1 ? (
      <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
        {companies[0].name}
      </span>
    ) : null;
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-500 font-medium">Company:</label>
      <select
        value={selectedCompanyId || ''}
        onChange={(e) => setSelectedCompanyId(e.target.value || null)}
        className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="">All Companies (Consolidated)</option>
        {companies.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
};

const AppSwitcher = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [statuses, setStatuses] = React.useState<Record<string, boolean>>({});
  const { session } = useAuthContext();

  const apps = [
    { id: 'sales', name: 'Sales & POS', url: 'http://localhost:5176', color: 'bg-orange-100 text-orange-600' },
    { id: 'inventory', name: 'Inventory', url: 'http://localhost:5175', color: 'bg-emerald-100 text-emerald-600' },
    { id: 'cashflow', name: 'Cashflow', url: 'http://localhost:5174', color: 'bg-blue-100 text-blue-600' }
  ];

  const getUrlWithSession = (baseUrl: string) => {
    if (!session) return baseUrl;
    return `${baseUrl}?access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
  };

  React.useEffect(() => {
    // Quick ping to check if the apps are locally reachable
    // In production, this would hit a real /health endpoint
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
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        title="App Launcher & Status"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">App Ecosystem</h3>
            </div>
            <div className="p-2 grid grid-cols-1 gap-1">
              {apps.map(app => (
                <a 
                  key={app.id}
                  href={getUrlWithSession(app.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg ${app.color} flex items-center justify-center font-bold text-lg`}>
                    {app.name[0]}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 flex items-center gap-1">
                      {app.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {statuses[app.id] === undefined ? (
                        <span className="text-xs text-gray-400">Checking status...</span>
                      ) : statuses[app.id] ? (
                        <><CheckCircle2 className="w-3 h-3 text-green-500" /><span className="text-xs text-green-600">Operational</span></>
                      ) : (
                        <><XCircle className="w-3 h-3 text-red-500" /><span className="text-xs text-red-600">Offline / Unreachable</span></>
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/reports" replace />} />
          <Route path="/companies" element={<ProtectedAdminRoute><CompanyManagement /></ProtectedAdminRoute>} />
          <Route path="/identity" element={<ProtectedAdminRoute><IdentityManagement /></ProtectedAdminRoute>} />
          <Route path="/reports" element={<ProtectedAdminRoute><ConsolidatedReports /></ProtectedAdminRoute>} />
          <Route path="/data" element={<ProtectedAdminRoute><DataLifecycle /></ProtectedAdminRoute>} />
          <Route path="/settings" element={<ProtectedAdminRoute><GlobalSettings /></ProtectedAdminRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
