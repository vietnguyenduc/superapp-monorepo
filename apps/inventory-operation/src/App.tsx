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
import InventoryInputPage from './pages/InventoryInputPage';
import ImportExportPage from './components/ImportExport/ImportExportPage';
import InventoryRecordsPage from './pages/InventoryRecordsPage';
import ProductCatalogPageEnhanced from './pages/ProductCatalogPageEnhanced';
import SpecialOutboundPage from './pages/SpecialOutboundPage';
import PermissionDemoPage from './pages/PermissionDemoPage';
import EditableGridDemoPage from './pages/EditableGridDemoPage';
import ProductCatalogDemoPage from './pages/ProductCatalogDemoPage';
import ExcelDataDemoPage from './pages/ExcelDataDemoPage';
import ProductBulkImportComplete from './pages/ProductBulkImportComplete';
import ImportSettingsPage from './pages/ImportSettingsPage';
import ProductCatalogSettingsPage from './pages/ProductCatalogSettingsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import TestPage from './pages/TestPage';
import HelpPage from './pages/HelpPage';
import WarehouseKeeperImportPage from './pages/WarehouseKeeperImportPage';
import WarehouseAccountantImportPage from './pages/WarehouseAccountantImportPage';
import ProductCatalogImportPage from './pages/ProductCatalogImportPage';
import InventoryTransactionImportPage from './pages/InventoryTransactionImportPage';
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
              <Route path="/test" element={<TestPage />} />

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
              <Route path="product-management" element={<ProductCatalogPageEnhanced />} />
              <Route path="inventory-records" element={<InventoryRecordsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="product-catalog-settings" element={<ProductCatalogSettingsPage />} />
              <Route path="special-outbound" element={<SpecialOutboundPage />} />
              <Route path="inventory" element={<InventoryInputPage />} />
              <Route path="import-export" element={<ImportExportPage />} />
              <Route path="product-import" element={<ProductBulkImportComplete />} />
              <Route path="import-settings" element={<ImportSettingsPage />} />
              <Route path="permission-demo" element={<PermissionDemoPage />} />
              <Route path="editable-grid-demo" element={<EditableGridDemoPage />} />
              <Route path="product-catalog-demo" element={<ProductCatalogDemoPage />} />
              <Route path="excel-data-demo" element={<ExcelDataDemoPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="inventory-input" element={<Navigate to="/inventory-records?tab=entry" replace />} />
              <Route path="product-entry" element={<Navigate to="/product-management?tab=add" replace />} />
              <Route path="inventory-entry" element={<Navigate to="/inventory-records?tab=entry" replace />} />
              <Route path="product-bulk-import" element={<Navigate to="/product-management?tab=import" replace />} />
              <Route path="inventory-bulk-import" element={<Navigate to="/inventory-records?tab=entry" replace />} />
              <Route path="sales-input" element={<Navigate to="/inventory-records?tab=entry" replace />} />
              <Route path="variance-report" element={<Navigate to="/dashboard?tab=variance" replace />} />
              <Route path="export-reports" element={<Navigate to="/dashboard?tab=export" replace />} />
              <Route path="help" element={<HelpPage />} />
              
              {/* Role-based import pages */}
              <Route path="warehouse-keeper-import" element={<WarehouseKeeperImportPage />} />
              <Route path="warehouse-accountant-import" element={<WarehouseAccountantImportPage />} />
              {/* Unified import pages */}
              <Route path="product-catalog-import" element={<ProductCatalogImportPage />} />
              <Route path="inventory-transaction-import" element={<InventoryTransactionImportPage />} />
            </Route>
          </Routes>
          </Router>
        </CompanyProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
