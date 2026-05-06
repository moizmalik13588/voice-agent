import { useEffect, useState } from "react";
import {
  AlertTriangle,
  TrendingDown,
  Calendar,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  Clock,
  Stethoscope,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const RISK_CONFIG = {
  high: {
    label: "High Risk",
    bg: "bg-red-50",
    color: "text-red-600",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  medium: {
    label: "Medium Risk",
    bg: "bg-amber-50",
    color: "text-amber-600",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low Risk",
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

function RiskBadge({ level }) {
  const risk = RISK_CONFIG[level];
  if (!risk) return null;
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 inline-flex items-center gap-1 ${risk.bg} ${risk.color} ${risk.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
      {risk.label}
    </span>
  );
}

export default function NoShow() {
  const [stats, setStats] = useState(null);
  const [riskPatients, setRiskPatients] = useState([]);
  const [upcomingRisky, setUpcomingRisky] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("patients");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, r, u] = await Promise.all([
        api.get("/noshow/stats"),
        api.get("/noshow/risk-patients"),
        api.get("/noshow/upcoming-risky"),
      ]);
      setStats(s.data);
      setRiskPatients(r.data);
      setUpcomingRisky(u.data);
    } catch {
      toast.error("Failed to load no-show data");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <RefreshCw size={24} className="animate-spin text-slate-300" />
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            No-Show Prediction
          </h1>
          <p className="text-sm text-slate-400">
            Identify patients likely to miss appointments
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="btn-secondary flex items-center gap-2 flex-shrink-0"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Appointments",
            value: stats?.total_appointments,
            icon: Calendar,
            bg: "bg-primary-50",
            iconColor: "text-primary-500",
            accent: "#1565c0",
          },
          {
            label: "Total No-Shows",
            value: stats?.total_no_shows,
            icon: TrendingDown,
            bg: "bg-red-50",
            iconColor: "text-red-600",
            accent: "#dc2626",
          },
          {
            label: "No-Show Rate",
            value: `${stats?.no_show_rate}%`,
            icon: AlertTriangle,
            bg: "bg-amber-50",
            iconColor: "text-amber-600",
            accent: "#d97706",
          },
          {
            label: "High Risk Patients",
            value: stats?.high_risk_patients,
            icon: ShieldAlert,
            bg: "bg-red-50",
            iconColor: "text-red-600",
            accent: "#dc2626",
          },
        ].map(({ label, value, icon: Icon, bg, iconColor, accent }) => (
          <div key={label} className="card p-4 sm:p-5 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
              style={{ background: accent }}
            />
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}
            >
              <Icon size={18} className={iconColor} />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-0.5">
              {value ?? "—"}
            </p>
            <p className="text-xs text-slate-400 font-medium leading-tight">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-5 gap-1 w-full sm:w-fit">
        {[
          { id: "patients", label: `Risk Patients (${riskPatients.length})` },
          { id: "upcoming", label: `Risky Upcoming (${upcomingRisky.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════
          TAB 1 — Risk Patients
      ══════════════════════════════ */}
      {activeTab === "patients" && (
        <>
          {riskPatients.length === 0 ? (
            <div className="card py-12 text-center">
              <Shield size={28} className="text-emerald-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 mb-1">
                No risk patients!
              </p>
              <p className="text-xs text-slate-400">
                All patients have good attendance
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block card overflow-hidden">
                <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 border-b border-slate-100">
                  {[
                    "Patient",
                    "Phone",
                    "No-Shows",
                    "Total Appts",
                    "Risk Level",
                  ].map((h) => (
                    <span
                      key={h}
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {riskPatients.map((p, i) => {
                  const risk = RISK_CONFIG[p.risk_level];
                  return (
                    <div
                      key={p.name}
                      className={`grid grid-cols-5 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors
                        ${i < riskPatients.length - 1 ? "border-b border-slate-50" : ""}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-xs font-bold text-red-500 flex-shrink-0">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {p.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {p.phone ? (
                          <>
                            <Phone size={12} className="text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {p.phone}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-red-600">
                          {p.no_shows}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({p.no_show_rate}%)
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {p.total_appointments}
                      </p>
                      <RiskBadge level={p.risk_level} />
                    </div>
                  );
                })}
              </div>

              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {riskPatients.map((p) => (
                  <div
                    key={p.name}
                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
                  >
                    {/* Top row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-sm font-bold text-red-500 flex-shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {p.name}
                        </p>
                        {p.phone ? (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {p.phone}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <RiskBadge level={p.risk_level} />
                    </div>
                    {/* Stats row */}
                    <div className="flex items-center gap-4 pl-1">
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          No-Shows
                        </p>
                        <p className="text-sm font-bold text-red-600">
                          {p.no_shows}{" "}
                          <span className="text-xs text-slate-400 font-normal">
                            ({p.no_show_rate}%)
                          </span>
                        </p>
                      </div>
                      <div className="w-px h-6 bg-slate-100" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          Total Appts
                        </p>
                        <p className="text-sm font-semibold text-slate-800">
                          {p.total_appointments}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ══════════════════════════════
          TAB 2 — Upcoming Risky
      ══════════════════════════════ */}
      {activeTab === "upcoming" && (
        <>
          {upcomingRisky.length === 0 ? (
            <div className="card py-12 text-center">
              <Shield size={28} className="text-emerald-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 mb-1">
                No risky upcoming appointments!
              </p>
              <p className="text-xs text-slate-400">Next 7 days look good</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block card overflow-hidden">
                <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 border-b border-slate-100">
                  {[
                    "Patient",
                    "Doctor",
                    "Appointment",
                    "Past No-Shows",
                    "Risk",
                  ].map((h) => (
                    <span
                      key={h}
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {upcomingRisky.map((a, i) => (
                  <div
                    key={a.appointment_id}
                    className={`grid grid-cols-5 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors
                      ${i < upcomingRisky.length - 1 ? "border-b border-slate-50" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0">
                        {a.patient_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {a.patient_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {a.patient_phone || "No phone"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 truncate">
                      {a.doctor_name}
                    </p>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(a.start_time).toLocaleDateString("en-PK", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(a.start_time).toLocaleTimeString("en-PK", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-red-600">
                        {a.past_no_shows}
                      </span>
                      <span className="text-xs text-slate-400">times</span>
                    </div>
                    <RiskBadge level={a.risk_level} />
                  </div>
                ))}
              </div>

              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {upcomingRisky.map((a) => (
                  <div
                    key={a.appointment_id}
                    className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
                  >
                    {/* Top row: avatar + name + risk badge */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-sm font-bold text-amber-600 flex-shrink-0">
                        {a.patient_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {a.patient_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {a.patient_phone || "No phone"}
                        </p>
                      </div>
                      <RiskBadge level={a.risk_level} />
                    </div>

                    {/* Doctor + date/time */}
                    <div className="flex items-center gap-4 mb-3 pl-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-600 truncate max-w-[110px]">
                          {a.doctor_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700">
                          {new Date(a.start_time).toLocaleDateString("en-PK", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-600">
                          {new Date(a.start_time).toLocaleTimeString("en-PK", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Past no-shows */}
                    <div className="flex items-center gap-1.5 pl-1 pt-3 border-t border-slate-50">
                      <AlertTriangle size={12} className="text-red-400" />
                      <span className="text-xs text-slate-500">
                        Missed{" "}
                        <span className="font-bold text-red-600">
                          {a.past_no_shows}
                        </span>{" "}
                        appointment{a.past_no_shows !== 1 ? "s" : ""} before
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
