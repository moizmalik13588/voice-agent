import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  LogOut,
  Building2,
} from "lucide-react";
import { getHospital, logout } from "../store/auth";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/doctors", icon: Users, label: "Doctors" },
  { to: "/appointments", icon: Calendar, label: "Appointments" },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const hospital = getHospital();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: "240px",
          background: "#0a1628",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative cross */}
        <svg
          style={{
            position: "absolute",
            bottom: "60px",
            right: "-20px",
            opacity: 0.05,
          }}
          width="100"
          height="100"
          viewBox="0 0 100 100"
        >
          <rect x="38" y="0" width="24" height="100" rx="8" fill="white" />
          <rect x="0" y="38" width="100" height="24" rx="8" fill="white" />
        </svg>

        {/* Dot grid */}
        <svg
          style={{
            position: "absolute",
            top: "160px",
            left: "12px",
            opacity: 0.04,
          }}
          width="80"
          height="80"
          viewBox="0 0 80 80"
        >
          {[0, 1, 2, 3, 4].map((r) =>
            [0, 1, 2, 3, 4].map((c) => (
              <circle
                key={`${r}${c}`}
                cx={c * 16 + 8}
                cy={r * 16 + 8}
                r="2"
                fill="white"
              />
            )),
          )}
        </svg>

        {/* Logo */}
        <div
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "#1565c0",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Building2 size={18} color="white" />
          </div>
          <div>
            <p
              style={{
                fontSize: "15px",
                fontWeight: "700",
                color: "white",
                margin: 0,
                letterSpacing: "-0.3px",
              }}
            >
              MediBook
            </p>
            <p
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.4)",
                margin: 0,
                maxWidth: "140px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {hospital?.name}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "12px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <p
            style={{
              fontSize: "10px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              padding: "8px 10px 6px",
            }}
          >
            Menu
          </p>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "9px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.15s",
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                color: isActive ? "white" : "rgba(255,255,255,0.5)",
              })}
            >
              {({ isActive }) => (
                <>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isActive
                        ? "#1565c0"
                        : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <Icon
                      size={16}
                      color={isActive ? "white" : "rgba(255,255,255,0.5)"}
                    />
                  </div>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Hospital info + Logout */}
        <div
          style={{
            padding: "12px 10px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "9px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              transition: "all 0.15s",
              fontSize: "14px",
              fontWeight: "500",
              color: "rgba(255,255,255,0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <LogOut size={15} color="currentColor" />
            </div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, overflow: "auto", background: "#f8fafc" }}>
        {children}
      </main>
    </div>
  );
}
