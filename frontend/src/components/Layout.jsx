import { NavLink, useNavigate } from "react-router-dom";
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
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const hospital = getHospital();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-60 bg-navy flex flex-col flex-shrink-0 relative overflow-hidden">
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
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.07]">
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 py-2">
            Menu
          </p>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
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
      <main className="flex-1 overflow-auto bg-surface">{children}</main>
    </div>
  );
}
