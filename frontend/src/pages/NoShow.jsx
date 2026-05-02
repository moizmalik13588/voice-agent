import { useEffect, useState } from "react";
import {
  AlertTriangle,
  TrendingDown,
  Calendar,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
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
      <div className="flex items-center justify-center h-full">
        <RefreshCw size={24} className="animate-spin text-slate-300" />
      </div>
    );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
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
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          <div key={label} className="card p-5 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
              style={{ background: accent }}
            />
            <div
              className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}
            >
              <Icon size={20} className={iconColor} />
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight mb-0.5">
              {value ?? "—"}
            </p>
            <p className="text-xs text-slate-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-5 gap-1 w-fit">
        {[
          { id: "patients", label: `Risk Patients (${riskPatients.length})` },
          { id: "upcoming", label: `Risky Upcoming (${upcomingRisky.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Risk Patients Tab */}
      {activeTab === "patients" && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 border-b border-slate-100">
            {["Patient", "Phone", "No-Shows", "Total Appts", "Risk Level"].map(
              (h) => (
                <span
                  key={h}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </span>
              ),
            )}
          </div>

          {riskPatients.length === 0 ? (
            <div className="py-12 text-center">
              <Shield size={28} className="text-emerald-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 mb-1">
                No risk patients!
              </p>
              <p className="text-xs text-slate-400">
                All patients have good attendance
              </p>
            </div>
          ) : (
            riskPatients.map((p, i) => {
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
                    <p className="text-sm font-semibold text-slate-900">
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

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border w-fit
                    ${risk.bg} ${risk.color} ${risk.border}`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${risk.dot} mr-1.5`}
                    />
                    {risk.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Upcoming Risky Tab */}
      {activeTab === "upcoming" && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 border-b border-slate-100">
            {["Patient", "Doctor", "Appointment", "Past No-Shows", "Risk"].map(
              (h) => (
                <span
                  key={h}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </span>
              ),
            )}
          </div>

          {upcomingRisky.length === 0 ? (
            <div className="py-12 text-center">
              <Shield size={28} className="text-emerald-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 mb-1">
                No risky upcoming appointments!
              </p>
              <p className="text-xs text-slate-400">Next 7 days look good</p>
            </div>
          ) : (
            upcomingRisky.map((a, i) => {
              const risk = RISK_CONFIG[a.risk_level];
              return (
                <div
                  key={a.appointment_id}
                  className={`grid grid-cols-5 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors
                    ${i < upcomingRisky.length - 1 ? "border-b border-slate-50" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-600 flex-shrink-0">
                      {a.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {a.patient_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {a.patient_phone || "No phone"}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600">{a.doctor_name}</p>

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

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border w-fit
                    ${risk.bg} ${risk.color} ${risk.border}`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${risk.dot} mr-1.5`}
                    />
                    {risk.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
