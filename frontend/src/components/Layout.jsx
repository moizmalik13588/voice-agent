import { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  LayoutDashboard,
  Users,
  Calendar,
  LogOut,
  Building2,
  UserRound,
  PhoneCall,
  BarChart2,
  PiggyBank,
  BellRing,
  ShieldAlert,
  FileHeart,
  CreditCard,
  Settings,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { getHospital, logout } from "../store/auth";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/doctors", icon: Users, label: "Doctors" },
  { to: "/appointments", icon: Calendar, label: "Appointments" },
  { to: "/patients", icon: UserRound, label: "Patients" },
  { to: "/call-logs", icon: PhoneCall, label: "Call Logs" },
  { to: "/analytics", icon: BarChart2, label: "Analytics" },
  { to: "/revenue", icon: PiggyBank, label: "Revenue" },
  { to: "/recall", icon: BellRing, label: "Auto Recall" },
  { to: "/noshow", icon: ShieldAlert, label: "No-Show" },
  { to: "/medical", icon: FileHeart, label: "Medical" },
  { to: "/payments", icon: CreditCard, label: "Payments" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const hospital = getHospital();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnread = async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnread(res.data.count);
    } catch {}
  };

  const fetchNotifs = async () => {
    try {
      const res = await api.get("/notifications/");
      setNotifs(res.data);
    } catch {}
  };

  const toggleBell = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) {
      await fetchNotifs();
      await api.patch("/notifications/read-all");
      setUnread(0);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 bg-navy flex flex-col flex-shrink-0 overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Decorative cross */}
        <svg
          className="absolute bottom-16 -right-5 opacity-[0.05]"
          width="100"
          height="100"
          viewBox="0 0 100 100"
        >
          <rect x="38" y="0" width="24" height="100" rx="8" fill="white" />
          <rect x="0" y="38" width="100" height="24" rx="8" fill="white" />
        </svg>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white tracking-tight">
                MediBook
              </p>
              <p className="text-xs text-white/40 truncate">{hospital?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/40 hover:text-white flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto scrollbar-none">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 py-2">
            Menu
          </p>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/10 hover:text-white"}`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                    ${isActive ? "bg-primary-500" : "bg-white/[0.05]"}`}
                  >
                    <Icon
                      size={16}
                      className={isActive ? "text-white" : "text-white/50"}
                    />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-white/[0.07] pt-3">
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                       text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
              <LogOut size={15} />
            </div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 relative">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
          >
            <Menu size={18} className="text-slate-600" />
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">MediBook</span>
          </div>

          {/* Desktop spacer */}
          <div className="hidden lg:block" />

          {/* Bell */}
          <button
            ref={bellRef}
            onClick={toggleBell}
            className="relative w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <Bell size={16} className="text-slate-500" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifs && (
            <div className="absolute top-12 right-4 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900">
                  Notifications
                </p>
              </div>
              <div className="max-h-80 overflow-auto">
                {notifs.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell size={24} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No notifications</p>
                  </div>
                ) : (
                  notifs.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors
                        ${!n.is_read ? "bg-primary-50/50" : ""}`}
                    >
                      <p className="text-sm text-slate-700">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleString("en-PK")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-surface">{children}</main>
      </div>
    </div>
  );
}
