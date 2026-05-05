import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function DoctorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    // Reload ko rokne ke liye
    if (e) e.preventDefault();

    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/doctor-auth/login", { email, password });
      localStorage.setItem("doctor_token", res.data.token);
      localStorage.setItem("doctor", JSON.stringify(res.data.doctor));
      toast.success("Welcome back!");
      navigate("/doctor/dashboard");
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid email or password";
      setError(msg);
      toast.error(msg);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row rounded-2xl overflow-hidden shadow-2xl shadow-slate-200">
        {/* ── Left: Form ── */}
        <div className="flex-1 bg-white px-6 py-10 sm:px-10 sm:py-12 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                <Stethoscope size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-slate-800 tracking-tight">
                MediBook
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">
              Doctor Portal
            </h1>
            <p className="text-sm text-slate-500 mb-8">
              Sign in to view your appointments
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${error ? "text-red-400" : "text-slate-400"}`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="doctor@hospital.com"
                    className={`input pl-9 w-full ${error ? "border-red-500 bg-red-50 focus:ring-red-100" : ""}`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${error ? "text-red-400" : "text-slate-400"}`}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="••••••••"
                    className={`input pl-9 w-full ${error ? "border-red-500 bg-red-50 focus:ring-red-100" : ""}`}
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-1">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={12} className="text-white" />
                  </div>
                  <p className="text-sm text-red-600 font-semibold">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-70 mt-2 shadow-lg shadow-primary-500/20"
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                Hospital admin?{" "}
                <span
                  onClick={() => navigate("/login")}
                  className="text-primary-500 font-semibold cursor-pointer hover:underline"
                >
                  Sign in here
                </span>
              </p>
            </form>
          </div>
        </div>

        {/* ── Right: Dark Panel ── */}
        <div className="hidden lg:flex w-[42%] bg-navy flex-col justify-center px-10 py-12 relative overflow-hidden flex-shrink-0">
          {/* Background Decorations */}
          <svg
            className="absolute top-8 right-8 opacity-10"
            width="80"
            height="80"
            viewBox="0 0 80 80"
          >
            <rect x="30" y="0" width="20" height="80" rx="6" fill="white" />
            <rect x="0" y="30" width="80" height="20" rx="6" fill="white" />
          </svg>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 border border-white/10 bg-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
              <span className="text-[10px] text-accent-blue font-bold tracking-widest uppercase">
                Doctor Portal
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white leading-snug mb-2">
              Your Patients.
              <br />
              Your Schedule.
            </h2>
            <p className="text-xl font-bold text-accent-blue mb-5">
              All in one place.
            </p>
            <p className="text-sm text-white/50 leading-relaxed mb-8">
              View your appointments, patient history, and daily schedule — all
              managed by AI.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { label: "View today's appointments", color: "#60a5fa" },
                { label: "Check patient history", color: "#34d399" },
                { label: "Track your performance", color: "#a78bfa" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                  <span className="text-sm text-white/70 font-medium">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
