import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../api/axios";
import toast from "react-hot-toast";

function formatPKR(amount) {
  if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}K`;
  return `Rs. ${amount}`;
}

export default function Revenue() {
  const [overview, setOverview] = useState(null);
  const [byDoctor, setByDoctor] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ov, doc, mon] = await Promise.all([
        api.get("/revenue/overview"),
        api.get("/revenue/by-doctor"),
        api.get("/revenue/monthly"),
      ]);
      setOverview(ov.data);
      setByDoctor(doc.data);
      setMonthly(mon.data);
    } catch {
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <RefreshCw
            size={28}
            className="text-slate-300 mx-auto mb-3 animate-spin"
          />
          <p className="text-sm text-slate-400">Loading revenue...</p>
        </div>
      </div>
    );

  const stats = [
    {
      label: "Total Revenue",
      value: formatPKR(overview?.total_revenue || 0),
      icon: DollarSign,
      bg: "bg-primary-50",
      iconColor: "text-primary-500",
      accent: "#1565c0",
      sub: "All time completed",
    },
    {
      label: "This Month",
      value: formatPKR(overview?.this_month_revenue || 0),
      icon: TrendingUp,
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      accent: "#059669",
      sub: `${overview?.growth_percent > 0 ? "+" : ""}${overview?.growth_percent}% vs last month`,
    },
    {
      label: "Last Month",
      value: formatPKR(overview?.last_month_revenue || 0),
      icon: TrendingUp,
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
      accent: "#7c3aed",
      sub: "Previous month total",
    },
    {
      label: "Lost Revenue",
      value: formatPKR(overview?.lost_revenue || 0),
      icon: TrendingDown,
      bg: "bg-red-50",
      iconColor: "text-red-600",
      accent: "#dc2626",
      sub: "From canceled appointments",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Revenue
          </h1>
          <p className="text-sm text-slate-400">
            Hospital financial overview · PKR
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map(
          ({ label, value, icon: Icon, bg, iconColor, accent, sub }) => (
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
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-0.5 break-words">
                {value}
              </p>
              <p className="text-xs text-slate-400 font-medium mb-0.5 leading-tight">
                {label}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">{sub}</p>
            </div>
          ),
        )}
      </div>

      {/* ── Monthly Revenue Chart ── */}
      <div className="card p-4 sm:p-5 mb-6">
        <p className="text-sm font-bold text-slate-900 mb-0.5">
          Monthly Revenue Trend
        </p>
        <p className="text-xs text-slate-400 mb-4">Last 6 months · PKR</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthly} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatPKR(v)}
              width={55}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #f1f5f9",
                fontSize: "12px",
              }}
              formatter={(value) => [formatPKR(value), "Revenue"]}
              cursor={{ fill: "#f8fafc" }}
            />
            <Bar
              dataKey="revenue"
              fill="#1565c0"
              radius={[6, 6, 0, 0]}
              name="Revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Revenue by Doctor ── */}
      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-50">
          <p className="text-sm font-bold text-slate-900">Revenue by Doctor</p>
          <p className="text-xs text-slate-400">
            Based on completed appointments
          </p>
        </div>

        {byDoctor.length === 0 ? (
          <div className="py-12 text-center">
            <Stethoscope size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No revenue data yet</p>
          </div>
        ) : (
          <>
            {/* ── DESKTOP TABLE (md+) ── */}
            <div className="hidden md:block">
              <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 border-b border-slate-100">
                {[
                  "Doctor",
                  "Specialty",
                  "Consultations",
                  "Fee/Visit",
                  "Total Revenue",
                ].map((h) => (
                  <span
                    key={h}
                    className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {byDoctor.map((doc, i) => (
                <div
                  key={doc.name}
                  className={`grid grid-cols-5 px-5 py-4 items-center hover:bg-slate-50 transition-colors
                    ${i < byDoctor.length - 1 ? "border-b border-slate-50" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-500 flex-shrink-0">
                      {doc.name.charAt(0)}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {doc.name.startsWith("Dr.")
                        ? doc.name
                        : `Dr. ${doc.name}`}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-primary-50 text-primary-500 rounded-full w-fit">
                    {doc.specialty}
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {doc.completed}
                  </p>
                  <p className="text-sm text-slate-600">
                    Rs. {doc.fee_per_visit.toLocaleString()}
                  </p>
                  <p className="text-sm font-bold text-emerald-600">
                    {formatPKR(doc.revenue)}
                  </p>
                </div>
              ))}

              {/* Total row */}
              <div className="grid grid-cols-5 px-5 py-4 bg-slate-50 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-900 col-span-4">
                  Total Revenue
                </p>
                <p className="text-sm font-bold text-primary-500">
                  {formatPKR(byDoctor.reduce((sum, d) => sum + d.revenue, 0))}
                </p>
              </div>
            </div>

            {/* ── MOBILE CARDS (below md) ── */}
            <div className="flex flex-col divide-y divide-slate-50 md:hidden">
              {byDoctor.map((doc) => (
                <div key={doc.name} className="p-4">
                  {/* Doctor name + specialty */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-sm font-bold text-primary-500 flex-shrink-0">
                      {doc.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {doc.name.startsWith("Dr.")
                          ? doc.name
                          : `Dr. ${doc.name}`}
                      </p>
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-primary-50 text-primary-500 rounded-full inline-block mt-0.5">
                        {doc.specialty}
                      </span>
                    </div>
                    {/* Revenue — right aligned */}
                    <p className="text-base font-bold text-emerald-600 ml-auto flex-shrink-0">
                      {formatPKR(doc.revenue)}
                    </p>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 pl-12">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        Visits
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {doc.completed}
                      </p>
                    </div>
                    <div className="w-px h-6 bg-slate-100" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        Fee/Visit
                      </p>
                      <p className="text-sm text-slate-700">
                        Rs. {doc.fee_per_visit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Total row mobile */}
              <div className="flex items-center justify-between px-4 py-4 bg-slate-50">
                <p className="text-sm font-bold text-slate-900">
                  Total Revenue
                </p>
                <p className="text-sm font-bold text-primary-500">
                  {formatPKR(byDoctor.reduce((sum, d) => sum + d.revenue, 0))}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
