import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  LogOut,
  Stethoscope,
  Clock,
  Phone,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
  scheduled: "badge-scheduled",
  completed: "badge-completed",
  canceled: "badge-canceled",
  no_show: "badge-no_show",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const doctor = JSON.parse(localStorage.getItem("doctor") || "{}");
  const token = localStorage.getItem("doctor_token");
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );

  useEffect(() => {
    if (!token) {
      navigate("/doctor/login");
      return;
    }
    fetchAll();
  }, [filterDate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [appts, s] = await Promise.all([
        api.get(
          `/doctor-auth/my-appointments?token=${token}&date=${filterDate}`,
        ),
        api.get(`/doctor-auth/my-stats?token=${token}`),
      ]);
      setAppointments(appts.data);
      setStats(s.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("doctor_token");
        localStorage.removeItem("doctor");
        navigate("/doctor/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("doctor_token");
    localStorage.removeItem("doctor");
    navigate("/doctor/login");
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status?status=${status}`);
      toast.success(`Marked as ${status}`);
      fetchAll();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Navbar ── */}
      <nav className="bg-navy px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <Stethoscope size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{doctor.name}</p>
            <p className="text-xs text-white/40">{doctor.specialty}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
        >
          <LogOut size={15} /> Sign Out
        </button>
      </nav>

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {getGreeting()}, {doctor.name} 👋
          </h1>
          <p className="text-sm text-slate-400">
            {new Date().toLocaleDateString("en-PK", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            {
              label: "Total Appointments",
              value: stats?.total_appointments,
              icon: Calendar,
              color: "#1565c0",
              bg: "bg-primary-50",
              iconColor: "text-primary-500",
              accent: "#1565c0",
            },
            {
              label: "Today",
              value: stats?.today_appointments,
              icon: Clock,
              color: "#d97706",
              bg: "bg-amber-50",
              iconColor: "text-amber-600",
              accent: "#d97706",
            },
            {
              label: "Completed",
              value: stats?.completed,
              icon: CheckCircle,
              color: "#059669",
              bg: "bg-emerald-50",
              iconColor: "text-emerald-600",
              accent: "#059669",
            },
            {
              label: "No-Shows",
              value: stats?.no_shows,
              icon: XCircle,
              color: "#dc2626",
              bg: "bg-red-50",
              iconColor: "text-red-600",
              accent: "#dc2626",
            },
          ].map(({ label, value, icon: Icon, bg, iconColor, accent }) => (
            <div
              key={label}
              className="card p-4 sm:p-5 relative overflow-hidden"
            >
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
                {loading ? "—" : (value ?? 0)}
              </p>
              <p className="text-xs text-slate-400 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Appointments */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-50">
            <div>
              <p className="text-sm font-bold text-slate-900">
                My Appointments
              </p>
              <p className="text-xs text-slate-400">
                {appointments.length} scheduled
              </p>
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white text-slate-700 w-full sm:w-auto"
            />
          </div>

          {/* Table — Desktop */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 border-b border-slate-100">
              {["Patient", "Phone", "Time", "Reason", "Actions"].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </span>
              ))}
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Loading...
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  No appointments on this date
                </p>
              </div>
            ) : (
              appointments.map((a, i) => (
                <div
                  key={a.id}
                  className={`grid grid-cols-5 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors
                    ${i < appointments.length - 1 ? "border-b border-slate-50" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-500 flex-shrink-0">
                      {a.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {a.patient_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {a.patient_phone ? (
                      <>
                        <Phone size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {a.patient_phone}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {new Date(a.start_time).toLocaleTimeString("en-PK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.reason || "General"}
                  </p>
                  <div className="flex gap-1.5">
                    {a.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => updateStatus(a.id, "completed")}
                          className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors"
                        >
                          ✓ Done
                        </button>
                        <button
                          onClick={() => updateStatus(a.id, "no_show")}
                          className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 text-xs font-bold hover:bg-amber-100 transition-colors"
                        >
                          No Show
                        </button>
                      </>
                    )}
                    {a.status !== "scheduled" && (
                      <span className={`${STATUS_COLORS[a.status]} w-fit`}>
                        {a.status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cards — Mobile */}
          <div className="sm:hidden">
            {loading ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Loading...
              </div>
            ) : appointments.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  No appointments on this date
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {appointments.map((a) => (
                  <div key={a.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-sm font-bold text-primary-500">
                          {a.patient_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {a.patient_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {a.reason || "General"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-700">
                        {new Date(a.start_time).toLocaleTimeString("en-PK", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {a.patient_phone && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Phone size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-500">
                          {a.patient_phone}
                        </span>
                      </div>
                    )}
                    {a.status === "scheduled" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(a.id, "completed")}
                          className="flex-1 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 text-xs font-bold"
                        >
                          ✓ Mark Done
                        </button>
                        <button
                          onClick={() => updateStatus(a.id, "no_show")}
                          className="flex-1 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 text-xs font-bold"
                        >
                          No Show
                        </button>
                      </div>
                    )}
                    {a.status !== "scheduled" && (
                      <span className={`${STATUS_COLORS[a.status]} w-fit`}>
                        {a.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
