import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { FC } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import DashboardPage from './pages/DashboardPage';
import InventoryVarianceReportPage from './pages/InventoryVarianceReportPage';
import InventoryInputPage from './pages/InventoryInputPage';
import DebugTestPage from './pages/DebugTestPage';
import ImportExportPage from './components/ImportExport/ImportExportPage';
import ProductCatalogPageEnhanced from './pages/ProductCatalogPageEnhanced';
import SalesReportPage from './pages/SalesReportPage';
import SpecialOutboundPage from './pages/SpecialOutboundPage';
import PermissionDemoPage from './pages/PermissionDemoPage';
import EditableGridDemoPage from './pages/EditableGridDemoPage';
import ProductCatalogDemoPage from './pages/ProductCatalogDemoPage';
import ExcelDataDemoPage from './pages/ExcelDataDemoPage';
import ProductImportPage from './pages/ProductImportPage';
import ProductBulkImportComplete from './pages/ProductBulkImportComplete';
import ImportSettingsPage from './pages/ImportSettingsPage';
import ProductCatalogPageNew from './pages/ProductCatalogPageNew';
import ProductCatalogSettingsPage from './pages/ProductCatalogSettingsPage';
import TestPage from './pages/TestPage';
import ErrorBoundary from './components/ErrorBoundary';

// This is a fixed version of App that works with the current React Router version
const FixedApp: FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {/* Use BrowserRouter instead of Router */}
        <BrowserRouter>
          <Routes>
            {/* Test route for debugging */}
            <Route path="/test" element={<TestPage />} />
            
            {/* Main layout with nested routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/test" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="inventory-input" element={<InventoryInputPage />} />
              <Route path="product-management" element={<ProductCatalogPageEnhanced />} />
              <Route path="product-catalog-settings" element={<ProductCatalogSettingsPage />} />
              <Route path="sales-input" element={<SalesReportPage />} />
              <Route path="special-outbound" element={<SpecialOutboundPage />} />
              <Route path="variance-report" element={<InventoryVarianceReportPage />} />
              <Route path="inventory" element={<InventoryInputPage />} />
              <Route path="import-export" element={<ImportExportPage />} />
              <Route path="export-reports" element={<ImportExportPage />} />
              <Route path="product-import" element={<ProductBulkImportComplete />} />
              <Route path="import-settings" element={<ImportSettingsPage />} />
              <Route path="debug" element={<DebugTestPage />} />
              <Route path="permission-demo" element={<PermissionDemoPage />} />
              <Route path="editable-grid-demo" element={<EditableGridDemoPage />} />
              <Route path="product-catalog-demo" element={<ProductCatalogDemoPage />} />
              <Route path="excel-data-demo" element={<ExcelDataDemoPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default FixedApp;
