import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CompanyProvider } from "@superapp/iam";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import Dashboard from "./pages/Dashboard/Dashboard";
import { SessionProvider } from "./contexts/SessionContext";
import SessionPage from "./pages/Session/SessionPage";
import Calendar from "./pages/Calendar/Calendar";
import History from "./pages/History/History";
import Builder from "./pages/Builder/Builder";
import Knowledge from "./pages/Knowledge/Knowledge";
import FinanceControl from "./pages/FinanceControl/FinanceControl";
import Practice from "./pages/Practice/Practice";

function App() {
  return (
    <CompanyProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SessionProvider>
                  <Layout />
                </SessionProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="session" element={<SessionPage />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="history" element={<History />} />
            <Route path="builder" element={<Builder />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="finance" element={<FinanceControl />} />
            <Route path="practice" element={<Practice />} />
          </Route>
        </Routes>
      </Router>
    </CompanyProvider>
  );
}

export default App;
