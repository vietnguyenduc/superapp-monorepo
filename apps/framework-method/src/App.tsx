import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CompanyProvider } from "@superapp/iam";
import { ProgressProvider } from "./hooks/useFrameworkProgress";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import Dashboard from "./pages/Dashboard/Dashboard";
import Steps from "./pages/Steps/Steps";
import Step from "./pages/Step/Step";
import Evening from "./pages/Evening/Evening";
import Calendar from "./pages/Calendar/Calendar";
import History from "./pages/History/History";
import HistoryDetail from "./pages/History/HistoryDetail";
import Review from "./pages/Review/Review";
import Builder from "./pages/Builder/Builder";

function App() {
  return (
    <CompanyProvider>
      <ProgressProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
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
              <Route path="overview" element={<Navigate to="/dashboard" replace />} />
              <Route path="steps" element={<Steps />} />
              <Route path="task/:taskId" element={<Step />} />
              <Route path="actions" element={<Navigate to="/dashboard" replace />} />
              <Route path="evening" element={<Evening />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="history" element={<History />} />
              <Route path="history/:sessionId" element={<HistoryDetail />} />
              <Route path="review" element={<Review />} />
              <Route path="builder" element={<Builder />} />
            </Route>
          </Routes>
        </Router>
      </ProgressProvider>
    </CompanyProvider>
  );
}

export default App;
