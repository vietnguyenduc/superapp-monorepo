import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import DashboardPage from '../pages/DashboardPage';
import InventoryInputPage from '../pages/InventoryInputPage';
import ProductCatalogPageEnhanced from '../pages/ProductCatalogPageEnhanced';
import SalesReportPage from '../pages/SalesReportPage';
import SpecialOutboundPage from '../pages/SpecialOutboundPage';
import InventoryReportPage from '../pages/InventoryReportPage';
import InventoryVarianceReportPage from '../pages/InventoryVarianceReportPage';
import InventoryExportPage from '../pages/InventoryExportPage';
import StockCheckPrintPage from '../pages/StockCheckPrintPage';
import SettingsPage from '../pages/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'inventory-input',
        element: <InventoryInputPage />,
      },
      {
        path: 'product-management',
        element: <ProductCatalogPageEnhanced />,
      },
      {
        path: 'sales-report',
        element: <SalesReportPage />,
      },
      {
        path: 'special-outbound',
        element: <SpecialOutboundPage />,
      },
      {
        path: 'inventory-report',
        element: <InventoryReportPage />,
      },
      {
        path: 'variance-report',
        element: <InventoryVarianceReportPage />,
      },
      {
        path: 'export-reports',
        element: <InventoryExportPage />,
      },
      {
        path: 'stock-check-print',
        element: <StockCheckPrintPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);

export default router;
