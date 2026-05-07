import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { isLoggedIn } from "./store/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients";
import CallLogs from "./pages/CallLogs";
import Analytics from "./pages/Analytics";
import Revenue from "./pages/Revenue";
import Recall from "./pages/Recall";
import NoShow from "./pages/NoShow";
import Medical from "./pages/Medical";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import DoctorLogin from "./pages/DoctorLogin";
import DoctorDashboard from "./pages/DoctorDashboard";

// If logged in, redirect away from login to dashboard
function PublicRoute({ children }) {
  return isLoggedIn() ? <Navigate to="/" replace /> : children;
}

function Protected({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function DoctorProtected({ children }) {
  return localStorage.getItem("doctor_token") ? (
    children
  ) : (
    <Navigate to="/doctor/login" replace />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          duration: 2000,
          success: { duration: 2000 },
          error: {
            duration: 3000,
            style: {
              background: "#fee2e2",
              color: "#dc2626",
              fontWeight: "600",
              border: "1px solid #fecaca",
              borderRadius: "12px",
            },
          },
        }}
      />
      <Routes>
        {/* ── Public routes — redirect to "/" if already logged in ── */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* ── Protected routes ── */}
        <Route
          path="/"
          element={
            <Protected>
              <Layout>
                <Dashboard />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/doctors"
          element={
            <Protected>
              <Layout>
                <Doctors />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/appointments"
          element={
            <Protected>
              <Layout>
                <Appointments />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/patients"
          element={
            <Protected>
              <Layout>
                <Patients />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/call-logs"
          element={
            <Protected>
              <Layout>
                <CallLogs />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/analytics"
          element={
            <Protected>
              <Layout>
                <Analytics />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/revenue"
          element={
            <Protected>
              <Layout>
                <Revenue />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/recall"
          element={
            <Protected>
              <Layout>
                <Recall />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/noshow"
          element={
            <Protected>
              <Layout>
                <NoShow />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/medical"
          element={
            <Protected>
              <Layout>
                <Medical />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/payments"
          element={
            <Protected>
              <Layout>
                <Payments />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected>
              <Layout>
                <Settings />
              </Layout>
            </Protected>
          }
        />

        {/* ── Doctor routes ── */}
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route
          path="/doctor/dashboard"
          element={
            <DoctorProtected>
              <DoctorDashboard />
            </DoctorProtected>
          }
        />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
