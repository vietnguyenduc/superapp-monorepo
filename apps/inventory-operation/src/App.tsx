import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { FC } from 'react';
import { AuthProvider, CompanyProvider } from '@superapp/iam';
import { lazyWithRetry } from '@superapp/shared-utils';
import Layout from './components/Layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import OnboardingTour from './components/Help/OnboardingTour';
import ContextHelp from './components/Help/ContextHelp';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded pages for code splitting (lazyWithRetry auto-reloads on stale chunk)
const Login = lazyWithRetry(() => import('./pages/Auth/Login'));
const SignUp = lazyWithRetry(() => import('./pages/Auth/SignUp'));
const CompanySelector = lazyWithRetry(() => import('./pages/CompanySelector/CompanySelector'));
const DashboardPageEnhanced = lazyWithRetry(() => import('./pages/DashboardPageEnhanced'));
const InventoryInputPage = lazyWithRetry(() => import('./pages/InventoryInputPage'));
const ImportExportPage = lazyWithRetry(() => import('./components/ImportExport/ImportExportPage'));
const InventoryRecordsPage = lazyWithRetry(() => import('./pages/InventoryRecordsPage'));
const ProductCatalogPageEnhanced = lazyWithRetry(() => import('./pages/ProductCatalogPageEnhanced'));
const SupplierManagement = lazyWithRetry(() => import('./pages/SupplierManagement'));
const PurchaseOrderPage = lazyWithRetry(() => import('./pages/PurchaseOrderPage'));
const GoodsReceiptPage = lazyWithRetry(() => import('./pages/GoodsReceiptPage'));
const SupplierReturnPage = lazyWithRetry(() => import('./pages/SupplierReturnPage'));
const InventoryMRPPage = lazyWithRetry(() => import('./pages/InventoryMRPPage'));
const SpecialOutboundPage = lazyWithRetry(() => import('./pages/SpecialOutboundPage'));
const PermissionDemoPage = lazyWithRetry(() => import('./pages/PermissionDemoPage'));
const EditableGridDemoPage = lazyWithRetry(() => import('./pages/EditableGridDemoPage'));
const ProductCatalogDemoPage = lazyWithRetry(() => import('./pages/ProductCatalogDemoPage'));
const ExcelDataDemoPage = lazyWithRetry(() => import('./pages/ExcelDataDemoPage'));
const ProductBulkImportComplete = lazyWithRetry(() => import('./pages/ProductBulkImportComplete'));
const ImportSettingsPage = lazyWithRetry(() => import('./pages/ImportSettingsPage'));
const ProductCatalogSettingsPage = lazyWithRetry(() => import('./pages/ProductCatalogSettingsPage'));
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'));
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'));
const TestPage = lazyWithRetry(() => import('./pages/TestPage'));
const HelpPage = lazyWithRetry(() => import('./pages/HelpPage'));
const WarehouseKeeperImportPage = lazyWithRetry(() => import('./pages/WarehouseKeeperImportPage'));
const WarehouseAccountantImportPage = lazyWithRetry(() => import('./pages/WarehouseAccountantImportPage'));
const ProductCatalogImportPage = lazyWithRetry(() => import('./pages/ProductCatalogImportPage'));
const InventoryTransactionImportPage = lazyWithRetry(() => import('./pages/InventoryTransactionImportPage'));

// Loading fallback component
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
  </div>
);

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
            <Suspense fallback={<PageLoading />}>
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
              <Route path="supplier-management" element={<SupplierManagement />} />
              <Route path="purchase-orders" element={<PurchaseOrderPage />} />
              <Route path="goods-receipts" element={<GoodsReceiptPage />} />
              <Route path="supplier-returns" element={<SupplierReturnPage />} />
              <Route path="inventory-records" element={<InventoryRecordsPage />} />
              <Route path="inventory-mrp" element={<InventoryMRPPage />} />
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
          </Suspense>
          </Router>
        </CompanyProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
