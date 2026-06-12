import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import DashboardPageEnhanced from '../pages/DashboardPageEnhanced';
import ProductCatalogPageEnhanced from '../pages/ProductCatalogPageEnhanced';
import InventoryRecordsPage from '../pages/InventoryRecordsPage';
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
        element: <DashboardPageEnhanced />,
      },
      {
        path: 'product-management',
        element: <ProductCatalogPageEnhanced />,
      },
      {
        path: 'inventory-records',
        element: <InventoryRecordsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'inventory-input',
        element: <Navigate to="/inventory-records?tab=entry" replace />,
      },
      {
        path: 'product-entry',
        element: <Navigate to="/product-management?tab=add" replace />,
      },
      {
        path: 'inventory-entry',
        element: <Navigate to="/inventory-records?tab=entry" replace />,
      },
      {
        path: 'product-bulk-import',
        element: <Navigate to="/product-management?tab=import" replace />,
      },
      {
        path: 'inventory-bulk-import',
        element: <Navigate to="/inventory-records?tab=entry" replace />,
      },
    ],
  },
]);

export default router;
