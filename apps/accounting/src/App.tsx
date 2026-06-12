// React import not needed in React 18+ with JSX transform
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import ChartOfAccounts from "./pages/ChartOfAccounts/ChartOfAccounts";
import CashBook from "./pages/CashBook/CashBook";
import Transactions from "./pages/Transactions/Transactions";
import Reports from "./pages/Reports/Reports";
import TaxReports from "./pages/TaxReports/TaxReports";
import Settings from "./pages/Settings/Settings";
import Invoices from "./pages/Invoices/Invoices";
import Assets from "./pages/Assets/Assets";
import Profile from "./pages/Profile/Profile";
import Manual from "./pages/Manual/Manual";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import CompanySelector from "./pages/CompanySelector/CompanySelector";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { CompanyProvider } from "@superapp/iam";

function App() {
  return (
    <CompanyProvider>
      <Router>
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
            <Route path="invoices" element={<Invoices />} />
            <Route path="accounts" element={<ChartOfAccounts />} />
            <Route path="cashbook" element={<CashBook />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="assets" element={<Assets />} />
            <Route path="reports" element={<Reports />} />
            <Route path="tax-reports" element={<TaxReports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="manual" element={<Manual />} />
          </Route>
        </Routes>
      </Router>
    </CompanyProvider>
  );
}

export default App;
