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
import CustomerList from "./pages/Customers/CustomerList";
import CustomerDetail from "./pages/Customers/CustomerDetail";
import Reports from "./pages/Reports/Reports";
import TransactionList from "./pages/Transactions/TransactionList";
import TransactionImport from "./pages/DataImport/TransactionImport";
import CustomerImport from "./pages/DataImport/CustomerImport";
import Settings from "./pages/Settings/Settings";
import Profile from "./pages/Profile/Profile";
import Manual from "./pages/Manual/Manual";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import CompanySelector from "./pages/CompanySelector/CompanySelector";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { CompanyProvider } from "./contexts/CompanyContext";

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
      </Router>
    </CompanyProvider>
  );
}

export default App;
