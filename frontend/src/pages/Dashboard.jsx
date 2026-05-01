import { useEffect, useState } from "react";
import { Calendar, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import api from "../api/axios";
import { getHospital } from "../store/auth";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

export default function Dashboard() {
  const hospital = getHospital();
  const [todayAppts, setTodayAppts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("en-CA"); // "2026-05-02" format

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [appts, docs] = await Promise.all([
          api.post("/appointments/list", { date: today }),
          api.get("/doctors/"),
        ]);
        setTodayAppts(appts.data);
        setDoctors(docs.data);

        const days = getLast7Days();
        const weekResults = await Promise.all(
          days.map((date) =>
            api.post("/appointments/list", { date }).then((r) => ({
              date: new Date(date + "T00:00:00").toLocaleDateString("en-PK", {
                weekday: "short",
              }),
              total: r.data.length,
              completed: r.data.filter((a) => a.status === "completed").length,
            })),
          ),
        );
        setWeekData(weekResults);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const stats = [
    {
      label: "Today's Appointments",
      value: todayAppts.length,
      icon: Calendar,
      color: "#1565c0",
      bg: "bg-primary-50",
      iconColor: "text-primary-500",
    },
    {
      label: "Total Doctors",
      value: doctors.length,
      icon: Users,
      color: "#7c3aed",
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Completed",
      value: todayAppts.filter((a) => a.status === "completed").length,
      icon: CheckCircle,
      color: "#059669",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Canceled",
      value: todayAppts.filter((a) => a.status === "canceled").length,
      icon: XCircle,
      color: "#dc2626",
      bg: "bg-red-50",
      iconColor: "text-red-600",
    },
  ];

  const pieData = [
    {
      name: "Scheduled",
      value: todayAppts.filter((a) => a.status === "scheduled").length,
      color: "#1565c0",
    },
    {
      name: "Completed",
      value: todayAppts.filter((a) => a.status === "completed").length,
      color: "#059669",
    },
    {
      name: "Canceled",
      value: todayAppts.filter((a) => a.status === "canceled").length,
      color: "#dc2626",
    },
    {
      name: "No Show",
      value: todayAppts.filter((a) => a.status === "no_show").length,
      color: "#d97706",
    },
  ].filter((d) => d.value > 0);

  const hourData = Array.from({ length: 9 }, (_, i) => {
    const hour = i + 9;
    return {
      hour: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "PM" : "AM"}`,
      patients: todayAppts.filter(
        (a) => new Date(a.start_time).getHours() === hour,
      ).length,
    };
  });

  const statusColors = {
    scheduled: "badge-scheduled",
    completed: "badge-completed",
    canceled: "badge-canceled",
    no_show: "badge-no_show",
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">
            Live Dashboard
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
          {getGreeting()}, {hospital?.name} 👋
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg, iconColor }) => (
          <div key={label} className="card p-5 relative overflow-hidden">
            <div
              style={{ background: color }}
              className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
            />
            <div
              className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}
            >
              <Icon size={20} className={iconColor} />
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight mb-0.5">
              {loading ? "—" : value}
            </p>
            <p className="text-xs text-slate-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Bar Chart */}
        <div className="card p-5 lg:col-span-2">
          <p className="text-sm font-bold text-slate-900 mb-0.5">
            Weekly Appointments
          </p>
          <p className="text-xs text-slate-400 mb-4">Last 7 days overview</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekData} barSize={16}>
              <XAxis
                dataKey="date"
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
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar
                dataKey="total"
                fill="#1565c0"
                radius={[5, 5, 0, 0]}
                name="Total"
              />
              <Bar
                dataKey="completed"
                fill="#34d399"
                radius={[5, 5, 0, 0]}
                name="Completed"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card p-5">
          <p className="text-sm font-bold text-slate-900 mb-0.5">
            Today's Status
          </p>
          <p className="text-xs text-slate-400 mb-4">Appointment breakdown</p>
          {todayAppts.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-slate-300">No data yet</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {pieData.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: color }}
                      />
                      <span className="text-xs text-slate-500">{name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Busy Hours */}
      <div className="card p-5 mb-6">
        <p className="text-sm font-bold text-slate-900 mb-0.5">
          Busy Hours Today
        </p>
        <p className="text-xs text-slate-400 mb-4">Patient load per hour</p>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={hourData}>
            <XAxis
              dataKey="hour"
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
              dataKey="patients"
              stroke="#1565c0"
              strokeWidth={2.5}
              dot={{ fill: "#1565c0", r: 3 }}
              activeDot={{ r: 5 }}
              name="Patients"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Today's Appointments */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
              <Clock size={15} className="text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Today's Appointments
              </p>
              <p className="text-xs text-slate-400">
                {todayAppts.length} total
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg">
            {new Date().toLocaleDateString("en-PK", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading...
          </div>
        ) : todayAppts.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No appointments today</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
              {["Patient", "Doctor", "Time", "Status"].map((h) => (
                <span
                  key={h}
                  className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                >
                  {h}
                </span>
              ))}
            </div>
            {todayAppts.map((a, i) => (
              <div
                key={a.id}
                className={`grid grid-cols-4 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors
                  ${i < todayAppts.length - 1 ? "border-b border-slate-50" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-500 flex-shrink-0">
                    {a.patient_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {a.patient_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {a.reason || "General"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-500">{a.doctor_name}</p>
                <p className="text-sm font-semibold text-slate-700">
                  {new Date(a.start_time).toLocaleTimeString("en-PK", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <span className={`badge-${a.status} w-fit`}>{a.status}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
