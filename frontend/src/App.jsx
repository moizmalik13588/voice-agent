import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { isLoggedIn } from "./store/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
// import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Patients from "./pages/Patients";
import CallLogs from "./pages/CallLogs";
import Analytics from "./pages/Analytics";
import Revenue from "./pages/Revenue";
import Recall from "./pages/Recall";
import NoShow from "./pages/NoShow";
import Medical from "./pages/Medical";

function Protected({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
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
      </Routes>
    </BrowserRouter>
  );
}
