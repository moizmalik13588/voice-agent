import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { isLoggedIn } from "./store/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
// import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";

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
      </Routes>
    </BrowserRouter>
  );
}
