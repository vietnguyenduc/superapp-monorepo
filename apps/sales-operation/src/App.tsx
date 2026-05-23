import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { FC } from 'react';
import { AuthProvider } from '@superapp/iam';
import { CompanyProvider } from './contexts/CompanyContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import CompanySelector from './pages/CompanySelector/CompanySelector';
import DashboardPageEnhanced from './pages/DashboardPageEnhanced';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import HelpPage from './pages/HelpPage';
import SalesOrderCreatePage from './pages/SalesOrderCreatePage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import OnboardingTour from './components/Help/OnboardingTour';
import ContextHelp from './components/Help/ContextHelp';
import ErrorBoundary from './components/ErrorBoundary';

import { useEffect } from 'react';

const App: FC = () => {
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <CompanyProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />


              {/* Company selector (protected, no layout) */}
              <Route
                path="/company-selector"
                element={
                  <ProtectedRoute>
                    <CompanySelector />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes with Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <>
                      <Layout />
                      <OnboardingTour />
                      <ContextHelp />
                    </>
                  </ProtectedRoute>
                }
              >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPageEnhanced />} />
              <Route path="sales-orders" element={<SalesOrdersPage />} />
              <Route path="sales-order-create" element={<SalesOrderCreatePage />} />
              <Route path="customers" element={<CustomerManagementPage />} />
              <Route path="customer-create" element={<Navigate to="/customers?add=true" replace />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="help" element={<HelpPage />} />
            </Route>
          </Routes>
          </Router>
        </CompanyProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
