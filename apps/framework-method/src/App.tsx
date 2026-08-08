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
import Overview from "./pages/Overview/Overview";
import { SessionProvider } from "./contexts/SessionContext";
import SessionPage from "./pages/Session/SessionPage";
import Actions from "./pages/Actions/Actions";
import Evening from "./pages/Evening/Evening";
import Calendar from "./pages/Calendar/Calendar";
import History from "./pages/History/History";
import Builder from "./pages/Builder/Builder";

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
            <Route path="overview" element={<Overview />} />
            <Route path="session" element={<SessionPage />} />
            <Route path="actions" element={<Actions />} />
            <Route path="evening" element={<Evening />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="history" element={<History />} />
            <Route path="builder" element={<Builder />} />
          </Route>
        </Routes>
      </Router>
    </CompanyProvider>
  );
}

export default App;
