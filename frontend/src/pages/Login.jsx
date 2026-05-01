import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Key, Building2, Phone, Mail, ArrowRight } from "lucide-react";
import api from "../api/axios";
import { saveAuth } from "../store/auth";
import toast from "react-hot-toast";

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
    if (!form.api_key) return toast.error("API Key required");
    setLoading(true);
    try {
      localStorage.setItem("api_key", form.api_key);
      const res = await api.get("/hospitals/me");
      saveAuth(form.api_key, res.data);
      toast.success(`Welcome, ${res.data.name}!`);
      navigate("/");
    } catch (err) {
      console.log("Error:", err.response?.data); // ← add karo
      toast.error(err.response?.data?.detail || "Invalid API Key");
      localStorage.removeItem("api_key");
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
        email: form.email,
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
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* ── LEFT: Form Panel ── */}
      <div
        style={{
          flex: 1,
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                background: "#1565c0",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={20} color="white" />
            </div>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#0f172a",
                letterSpacing: "-0.3px",
              }}
            >
              MediBook
            </span>
          </div>

          <h1
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "#0f172a",
              margin: "0 0 6px",
              letterSpacing: "-0.5px",
            }}
          >
            {tab === "login" ? "Welcome back" : "Register hospital"}
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 28px" }}>
            {tab === "login"
              ? "Sign in to your hospital dashboard"
              : "Get started in under a minute"}
          </p>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              background: "#e2e8f0",
              borderRadius: "10px",
              padding: "4px",
              marginBottom: "24px",
              gap: "4px",
            }}
          >
            {["login", "register"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "7px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? "#0f172a" : "#64748b",
                  boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#64748b",
                    letterSpacing: "0.6px",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  API Key
                </label>
                <div style={{ position: "relative" }}>
                  <Key
                    size={15}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    name="api_key"
                    value={form.api_key}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Enter your hospital API key"
                    style={{
                      width: "100%",
                      padding: "11px 12px 11px 38px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "9px",
                      fontSize: "14px",
                      color: "#0f172a",
                      background: "white",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#1565c0",
                  border: "none",
                  borderRadius: "9px",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: loading ? 0.7 : 1,
                }}
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
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {[
                {
                  label: "Hospital Name",
                  name: "name",
                  icon: Building2,
                  placeholder: "City General Hospital",
                },
                {
                  label: "Email",
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
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#64748b",
                      letterSpacing: "0.6px",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    {label}
                  </label>
                  <div style={{ position: "relative" }}>
                    <Icon
                      size={15}
                      style={{
                        position: "absolute",
                        left: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                      }}
                    />
                    <input
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      type={type || "text"}
                      placeholder={placeholder}
                      style={{
                        width: "100%",
                        padding: "11px 12px 11px 38px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "9px",
                        fontSize: "14px",
                        color: "#0f172a",
                        background: "white",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={handleRegister}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#1565c0",
                  border: "none",
                  borderRadius: "9px",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: loading ? 0.7 : 1,
                }}
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

      {/* ── RIGHT: Dark Panel ── */}
      <div
        style={{
          width: "45%", // ← yeh change karo
          background: "#0a1628",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "56px 52px", // ← padding bhi thoda barhao
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Medical cross top right */}
        <svg
          style={{
            position: "absolute",
            top: "32px",
            right: "32px",
            opacity: 0.1,
          }}
          width="90"
          height="90"
          viewBox="0 0 90 90"
        >
          <rect x="34" y="0" width="22" height="90" rx="7" fill="white" />
          <rect x="0" y="34" width="90" height="22" rx="7" fill="white" />
        </svg>

        {/* ECG heartbeat */}
        <svg
          style={{
            position: "absolute",
            bottom: "100px",
            left: 0,
            right: 0,
            opacity: 0.1,
          }}
          width="420"
          height="70"
          viewBox="0 0 420 70"
        >
          <polyline
            points="0,35 80,35 100,10 115,60 130,20 148,48 168,35 420,35"
            fill="none"
            stroke="white"
            stroke-width="2.5"
          />
        </svg>

        {/* Dot grid */}
        <svg
          style={{
            position: "absolute",
            top: "28px",
            left: "28px",
            opacity: 0.06,
          }}
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

        {/* Small cross bottom left */}
        <svg
          style={{
            position: "absolute",
            bottom: "36px",
            left: "36px",
            opacity: 0.07,
          }}
          width="44"
          height="44"
          viewBox="0 0 44 44"
        >
          <rect x="16" y="0" width="12" height="44" rx="4" fill="white" />
          <rect x="0" y="16" width="44" height="12" rx="4" fill="white" />
        </svg>

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              background: "rgba(96,165,250,0.12)",
              border: "1px solid rgba(96,165,250,0.25)",
              borderRadius: "20px",
              padding: "5px 14px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#60a5fa",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                color: "#60a5fa",
                fontWeight: "600",
                letterSpacing: "1px",
              }}
            >
              AI-POWERED
            </span>
          </div>

          <h2
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "white",
              lineHeight: "1.3",
              margin: "0 0 8px",
              letterSpacing: "-0.5px",
            }}
          >
            Smart Hospital
            <br />
            Management.
          </h2>
          <p
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "#60a5fa",
              margin: "0 0 20px",
              letterSpacing: "-0.5px",
            }}
          >
            24/7 Always On.
          </p>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.5)",
              lineHeight: "1.7",
              margin: "0 0 36px",
            }}
          >
            Automate patient calls, bookings & reminders — so your staff can
            focus on care.
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {[
              { label: "Answers every patient call", color: "#60a5fa" },
              { label: "Books appointments instantly", color: "#34d399" },
              { label: "Sends smart reminders", color: "#a78bfa" },
            ].map(({ label, color }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "9px",
                    flexShrink: 0,
                    background: `${color}18`,
                    border: `1px solid ${color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: color,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.72)",
                    fontWeight: "500",
                  }}
                >
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
