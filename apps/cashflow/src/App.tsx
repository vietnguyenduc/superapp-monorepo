import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { CompanyProvider } from "@superapp/iam";
import { TransactionTypeProvider } from "./contexts/TransactionTypeContext";
import { lazyWithRetry } from "@superapp/shared-utils";

// Lazy-loaded pages for code splitting (lazyWithRetry auto-reloads on stale chunk)
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard/Dashboard"));
const CustomerList = lazyWithRetry(() => import("./pages/Customers/CustomerList"));
const CustomerDetail = lazyWithRetry(() => import("./pages/Customers/CustomerDetail"));
const Reports = lazyWithRetry(() => import("./pages/Reports/Reports"));
const TransactionList = lazyWithRetry(() => import("./pages/Transactions/TransactionList"));
const TransactionImport = lazyWithRetry(() => import("./pages/DataImport/TransactionImport"));
const CustomerImport = lazyWithRetry(() => import("./pages/DataImport/CustomerImport"));
const Settings = lazyWithRetry(() => import("./pages/Settings/Settings"));
const Profile = lazyWithRetry(() => import("./pages/Profile/Profile"));
const Manual = lazyWithRetry(() => import("./pages/Manual/Manual"));
const Login = lazyWithRetry(() => import("./pages/Auth/Login"));
const SignUp = lazyWithRetry(() => import("./pages/Auth/SignUp"));
const CompanySelector = lazyWithRetry(() => import("./pages/CompanySelector/CompanySelector"));

// Loading fallback component
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <CompanyProvider>
      <TransactionTypeProvider>
        <Router>
        <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Company selector for admins */}
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <CompanySelector />
              </ProtectedRoute>
            }
          />

          {/* Protected routes with layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:customerId" element={<CustomerDetail />} />
            <Route path="transactions" element={<TransactionList />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="manual" element={<Manual />} />
            <Route path="import/transactions" element={<TransactionImport />} />
            <Route path="import/customers" element={<CustomerImport />} />
          </Route>
        </Routes>
        </Suspense>
      </Router>
      </TransactionTypeProvider>
    </CompanyProvider>
  );
}

export default App;
