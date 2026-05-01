import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import api from "../api/axios";
import { getHospital } from "../store/auth";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function Dashboard() {
  const hospital = getHospital();
  const [todayAppts, setTodayAppts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      api.post("/appointments/list", { date: today }),
      api.get("/doctors/"),
    ])
      .then(([a, d]) => {
        setTodayAppts(a.data);
        setDoctors(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Today's Appointments",
      value: todayAppts.length,
      icon: Calendar,
      color: "#1565c0",
      bg: "#e3f0fc",
    },
    {
      label: "Total Doctors",
      value: doctors.length,
      icon: Users,
      color: "#7c3aed",
      bg: "#f3f0ff",
    },
    {
      label: "Completed",
      value: todayAppts.filter((a) => a.status === "completed").length,
      icon: CheckCircle,
      color: "#059669",
      bg: "#ecfdf5",
    },
    {
      label: "Canceled",
      value: todayAppts.filter((a) => a.status === "canceled").length,
      icon: XCircle,
      color: "#dc2626",
      bg: "#fef2f2",
    },
  ];

  const statusColors = {
    scheduled: { bg: "#e3f0fc", color: "#1565c0" },
    completed: { bg: "#ecfdf5", color: "#059669" },
    canceled: { bg: "#fef2f2", color: "#dc2626" },
    no_show: { bg: "#fffbeb", color: "#d97706" },
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "4px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#34d399",
            }}
          />
          <span
            style={{ fontSize: "12px", color: "#64748b", fontWeight: "500" }}
          >
            Live Dashboard
          </span>
        </div>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "700",
            color: "#0f172a",
            margin: "0 0 4px",
            letterSpacing: "-0.5px",
          }}
        >
          {getGreeting()}, {hospital?.name} 👋
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
          {new Date().toLocaleDateString("en-PK", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            style={{
              background: "white",
              borderRadius: "14px",
              padding: "20px",
              border: "1px solid #f1f5f9",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <Icon size={20} color={color} />
            </div>
            <p
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#0f172a",
                margin: "0 0 2px",
                letterSpacing: "-1px",
              }}
            >
              {loading ? "—" : value}
            </p>
            <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
              {label}
            </p>
            {/* Accent bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "4px",
                height: "100%",
                background: color,
                borderRadius: "14px 0 0 14px",
              }}
            />
          </div>
        ))}
      </div>

      {/* Today's Appointments Table */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #f1f5f9",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "#e3f0fc",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={16} color="#1565c0" />
            </div>
            <div>
              <p
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Today's Appointments
              </p>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                {todayAppts.length} total
              </p>
            </div>
          </div>
          <div
            style={{
              background: "#f8fafc",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              color: "#64748b",
              fontWeight: "500",
            }}
          >
            {new Date().toLocaleDateString("en-PK", {
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            Loading...
          </div>
        ) : todayAppts.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <Calendar
              size={32}
              color="#e2e8f0"
              style={{ marginBottom: "10px" }}
            />
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
              No appointments today
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1fr 1fr",
                padding: "10px 24px",
                background: "#f8fafc",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              {["Patient", "Doctor", "Time", "Status"].map((h) => (
                <span
                  key={h}
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {todayAppts.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 2fr 1fr 1fr",
                  padding: "14px 24px",
                  alignItems: "center",
                  borderBottom:
                    i < todayAppts.length - 1 ? "1px solid #f8fafc" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#fafafa")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#e3f0fc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#1565c0",
                      flexShrink: 0,
                    }}
                  >
                    {a.patient_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#0f172a",
                        margin: 0,
                      }}
                    >
                      {a.patient_name}
                    </p>
                    <p
                      style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}
                    >
                      {a.reason || "General"}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
                  {a.doctor_name}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  {new Date(a.start_time).toLocaleTimeString("en-PK", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      background: statusColors[a.status]?.bg,
                      color: statusColors[a.status]?.color,
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
