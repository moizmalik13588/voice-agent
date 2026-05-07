import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Key, Building2, Phone, Mail, ArrowRight } from "lucide-react";
import api from "../api/axios";
import { saveAuth } from "../store/auth";
import toast, { Toaster } from "react-hot-toast";

export default function Login() {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    api_key: "",
  });
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    if (!form.api_key) return toast.error("API Key is required");
    setLoading(true);
    try {
      localStorage.setItem("api_key", form.api_key);
      const res = await api.get("/hospitals/me");
      saveAuth(form.api_key, res.data);

      // Show welcome toast on login page briefly, then clear it before navigating
      const toastId = toast.success(`Welcome, ${res.data.name}!`, {
        duration: 9999,
      });
      setTimeout(() => {
        toast.dismiss(toastId);
        navigate("/");
      }, 1200);
    } catch (err) {
      localStorage.removeItem("api_key");
      if (err.response?.status === 401) {
        toast.error("Invalid API Key — please check and try again");
      } else if (err.response?.status === 404) {
        toast.error("Hospital not found");
      } else if (err.code === "ERR_NETWORK") {
        toast.error("Cannot connect to server — please try again");
      } else {
        toast.error(err.response?.data?.detail || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.name || !form.email)
      return toast.error("Name and email required");
    setLoading(true);
    try {
      const res = await api.post("/hospitals/register", {
        name: form.name,
        email: res.data.email,
        phone: form.phone || undefined,
      });
      saveAuth(res.data.api_key, res.data);
      toast.success("Registered! Save your API Key.");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          success: {
            duration: 2500,
            style: {
              background: "#f0fdf4",
              color: "#16a34a",
              border: "1px solid #bbf7d0",
              fontWeight: "600",
              fontSize: "14px",
            },
          },
          error: {
            duration: 4000,
            style: {
              background: "#fef2f2",
              color: "#dc2626",
              border: "1px solid #fecaca",
              fontWeight: "600",
              fontSize: "14px",
            },
          },
        }}
      />
      {/* ── LEFT ── */}
      <div className="flex-1 bg-surface flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              MediBook
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">
            {tab === "login" ? "Welcome back" : "Register hospital"}
          </h1>
          <p className="text-sm text-slate-500 mb-7">
            {tab === "login"
              ? "Sign in to your hospital dashboard"
              : "Get started in under a minute"}
          </p>

          {/* Tabs */}
          <div className="flex bg-slate-200 rounded-xl p-1 mb-6 gap-1">
            {["login", "register"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all
                  ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  API Key
                </label>
                <div className="relative">
                  <Key
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    name="api_key"
                    value={form.api_key}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Enter your hospital API key"
                    className="input pl-9"
                  />
                </div>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-70"
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
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {[
                {
                  label: "Hospital Name *",
                  name: "name",
                  icon: Building2,
                  placeholder: "City General Hospital",
                },
                {
                  label: "Email *",
                  name: "email",
                  icon: Mail,
                  placeholder: "admin@hospital.com",
                  type: "email",
                },
                {
                  label: "Phone (optional)",
                  name: "phone",
                  icon: Phone,
                  placeholder: "051-1234567",
                },
              ].map(({ label, name, icon: Icon, placeholder, type }) => (
                <div key={name}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    {label}
                  </label>
                  <div className="relative">
                    <Icon
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      type={type || "text"}
                      placeholder={placeholder}
                      className="input pl-9"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={handleRegister}
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-70"
              >
                {loading ? (
                  "Registering..."
                ) : (
                  <>
                    <span>Register & Get API Key</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT (desktop only) ── */}
      <div className="hidden lg:flex w-[45%] bg-navy flex-col justify-center px-14 py-12 relative overflow-hidden flex-shrink-0">
        <svg
          className="absolute top-8 right-8 opacity-10"
          width="90"
          height="90"
          viewBox="0 0 90 90"
        >
          <rect x="34" y="0" width="22" height="90" rx="7" fill="white" />
          <rect x="0" y="34" width="90" height="22" rx="7" fill="white" />
        </svg>
        <svg
          className="absolute bottom-24 left-0 right-0 opacity-10"
          width="100%"
          height="70"
          viewBox="0 0 420 70"
          preserveAspectRatio="none"
        >
          <polyline
            points="0,35 80,35 100,10 115,60 130,20 148,48 168,35 420,35"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
          />
        </svg>
        <svg
          className="absolute top-7 left-7 opacity-[0.06]"
          width="100"
          height="100"
          viewBox="0 0 100 100"
        >
          {[0, 1, 2, 3, 4].map((r) =>
            [0, 1, 2, 3, 4].map((c) => (
              <circle
                key={`${r}${c}`}
                cx={c * 20 + 10}
                cy={r * 20 + 10}
                r="2.5"
                fill="white"
              />
            )),
          )}
        </svg>
        <svg
          className="absolute bottom-9 left-9 opacity-[0.07]"
          width="44"
          height="44"
          viewBox="0 0 44 44"
        >
          <rect x="16" y="0" width="12" height="44" rx="4" fill="white" />
          <rect x="0" y="16" width="44" height="12" rx="4" fill="white" />
        </svg>
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6 border"
            style={{
              background: "rgba(96,165,250,0.12)",
              borderColor: "rgba(96,165,250,0.25)",
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
            <span className="text-xs text-accent-blue font-semibold tracking-wider">
              AI-POWERED
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white leading-snug mb-2 tracking-tight">
            Smart Hospital
            <br />
            Management.
          </h2>
          <p className="text-xl font-bold text-accent-blue mb-5 tracking-tight">
            24/7 Always On.
          </p>
          <p className="text-sm text-white/50 leading-relaxed mb-8">
            Automate patient calls, bookings & reminders — so your staff can
            focus on care.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { label: "Answers every patient call", color: "#60a5fa" },
              { label: "Books appointments instantly", color: "#34d399" },
              { label: "Sends smart reminders", color: "#a78bfa" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${color}18`,
                    border: `1px solid ${color}33`,
                  }}
                >
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
  );
}
