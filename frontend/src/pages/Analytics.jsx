import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  BarChart2,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [busyHours, setBusyHours] = useState([]);
  const [trend, setTrend] = useState([]);
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ov, doc, bh, tr, ret] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/analytics/popular-doctors"),
        api.get("/analytics/busy-hours"),
        api.get("/analytics/monthly-trend"),
        api.get("/analytics/retention"),
      ]);
      setOverview(ov.data);
      setDoctors(doc.data);
      setBusyHours(bh.data);
      setTrend(tr.data);
      setRetention(ret.data);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const PIE_COLORS = ["#1565c0", "#34d399", "#a78bfa"];

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw
            size={28}
            className="text-slate-300 mx-auto mb-3 animate-spin"
          />
          <p className="text-sm text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Hospital performance overview
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Appointments",
            value: overview?.total_appointments,
            icon: BarChart2,
            color: "#1565c0",
            bg: "bg-primary-50",
            iconColor: "text-primary-500",
            accent: "#1565c0",
            sub: `${overview?.growth_percent > 0 ? "+" : ""}${overview?.growth_percent}% vs last month`,
          },
          {
            label: "Unique Patients",
            value: overview?.unique_patients,
            icon: Users,
            color: "#7c3aed",
            bg: "bg-violet-50",
            iconColor: "text-violet-600",
            accent: "#7c3aed",
            sub: `${overview?.this_month} this month`,
          },
          {
            label: "Completion Rate",
            value: `${overview?.completion_rate}%`,
            icon: CheckCircle,
            color: "#059669",
            bg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            accent: "#059669",
            sub: `${overview?.total_completed} completed`,
          },
          {
            label: "No-Show Rate",
            value: `${overview?.no_show_rate}%`,
            icon: AlertCircle,
            color: "#dc2626",
            bg: "bg-red-50",
            iconColor: "text-red-600",
            accent: "#dc2626",
            sub: "patients who didn't show",
          },
        ].map(({ label, value, icon: Icon, bg, iconColor, accent, sub }) => (
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
            <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Trend + Busy Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Monthly Trend */}
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-900 mb-0.5">
            Monthly Trend
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Appointments over last 6 months
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #f1f5f9",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="appointments"
                stroke="#1565c0"
                strokeWidth={2.5}
                dot={{ fill: "#1565c0", r: 4 }}
                activeDot={{ r: 6 }}
                name="Appointments"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Busy Hours */}
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-900 mb-0.5">Busy Hours</p>
          <p className="text-xs text-slate-400 mb-4">Peak appointment times</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={busyHours} barSize={14}>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #f1f5f9",
                  fontSize: "12px",
                }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar
                dataKey="count"
                fill="#1565c0"
                radius={[5, 5, 0, 0]}
                name="Appointments"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Doctors + Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Popular Doctors */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <p className="text-sm font-bold text-slate-900">Popular Doctors</p>
            <p className="text-xs text-slate-400">By total appointments</p>
          </div>
          {doctors.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No data yet
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {doctors.map((doc, i) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-500">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {doc.name}
                      </p>
                      <p className="text-xs text-slate-400">{doc.specialty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {doc.total} appts
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">
                      {doc.completion_rate}% completed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retention */}
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-900 mb-0.5">
            Patient Retention
          </p>
          <p className="text-xs text-slate-400 mb-4">
            How many patients come back
          </p>

          {/* Big number */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-primary-50 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-primary-500">
                {retention?.retention_rate}%
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 mb-1">
                Retention Rate
              </p>
              <p className="text-xs text-slate-400">
                {retention?.returning_patients} returning out of{" "}
                {retention?.total_patients} patients
              </p>
              <p className="text-xs text-slate-400">
                {retention?.new_patients} new patients
              </p>
            </div>
          </div>

          {/* Visit distribution pie */}
          {retention?.visit_distribution && (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={retention.visit_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {retention.visit_distribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {retention.visit_distribution.map((d, i) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: PIE_COLORS[i] }}
                    />
                    <span className="text-xs text-slate-500">{d.label}</span>
                    <span className="text-xs font-bold text-slate-900 ml-auto">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
