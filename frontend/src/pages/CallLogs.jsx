import { useEffect, useState } from "react";
import {
  Phone,
  PhoneOff,
  PhoneMissed,
  Clock,
  DollarSign,
  FileText,
  X,
  Search,
  ChevronRight,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const OUTCOME_LABELS = {
  appointment_booked: {
    label: "Booked",
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    border: "border-emerald-200",
  },
  appointment_canceled: {
    label: "Canceled",
    bg: "bg-red-50",
    color: "text-red-600",
    border: "border-red-200",
  },
  info_provided: {
    label: "Info",
    bg: "bg-blue-50",
    color: "text-blue-600",
    border: "border-blue-200",
  },
  no_action: {
    label: "No Action",
    bg: "bg-slate-50",
    color: "text-slate-500",
    border: "border-slate-200",
  },
};

const STATUS_ICONS = {
  ended: { icon: Phone, color: "text-emerald-500", bg: "bg-emerald-50" },
  missed: { icon: PhoneMissed, color: "text-red-500", bg: "bg-red-50" },
  failed: { icon: PhoneOff, color: "text-orange-500", bg: "bg-orange-50" },
};

function formatDuration(seconds) {
  if (!seconds) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDateTime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CallLogs() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const res = await api.get("/call-logs/");
      setCalls(res.data);
    } catch {
      toast.error("Failed to load call logs");
    } finally {
      setLoading(false);
    }
  };

  const filtered = calls.filter(
    (c) =>
      (c.caller || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || "").includes(search),
  );

  const totalCalls = calls.length;
  const completedCalls = calls.filter((c) => c.status === "ended").length;
  const missedCalls = calls.filter(
    (c) => c.status === "missed" || c.duration === 0,
  ).length;
  const bookedCalls = calls.filter(
    (c) => c.outcome === "appointment_booked",
  ).length;
  const totalCost = calls.reduce((sum, c) => sum + (c.cost || 0), 0);
  const avgDuration = calls.length
    ? Math.round(
        calls.reduce((sum, c) => sum + (c.duration || 0), 0) / calls.length,
      )
    : 0;

  const stats = [
    {
      label: "Total Calls",
      value: totalCalls,
      icon: Phone,
      color: "text-primary-500",
      bg: "bg-primary-50",
      accent: "#1565c0",
    },
    {
      label: "Completed",
      value: completedCalls,
      icon: Phone,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      accent: "#059669",
    },
    {
      label: "Missed",
      value: missedCalls,
      icon: PhoneMissed,
      color: "text-red-600",
      bg: "bg-red-50",
      accent: "#dc2626",
    },
    {
      label: "Appointments Booked",
      value: bookedCalls,
      icon: Phone,
      color: "text-violet-600",
      bg: "bg-violet-50",
      accent: "#7c3aed",
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Call Logs
          </h1>
          <p className="text-sm text-slate-400">
            {totalCalls} total · Avg {formatDuration(avgDuration)} · $
            {totalCost.toFixed(3)} spent
          </p>
        </div>

        {/* Search — full width on mobile */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-full sm:w-64">
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input
            placeholder="Search caller or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none outline-none text-sm text-slate-900 bg-transparent w-full"
          />
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg, accent }) => (
          <div key={label} className="card p-4 sm:p-5 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
              style={{ background: accent }}
            />
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}
            >
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-0.5">
              {loading ? "—" : value}
            </p>
            <p className="text-xs text-slate-400 font-medium leading-tight">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── DESKTOP TABLE (hidden on mobile) ── */}
      <div className="hidden md:block card overflow-hidden">
        <div className="grid grid-cols-6 px-5 py-3 bg-slate-50 border-b border-slate-100">
          {["Caller", "Phone", "Duration", "Cost", "Outcome", "Time"].map(
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

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Phone size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No call logs found</p>
          </div>
        ) : (
          filtered.map((call, i) => {
            const statusInfo = STATUS_ICONS[call.status] || STATUS_ICONS.ended;
            const StatusIcon = statusInfo.icon;
            const outcome =
              OUTCOME_LABELS[call.outcome] || OUTCOME_LABELS.no_action;
            return (
              <div
                key={call.id}
                onClick={() => setSelected(call)}
                className={`grid grid-cols-6 px-5 py-3.5 items-center cursor-pointer hover:bg-slate-50 transition-colors
                  ${i < filtered.length - 1 ? "border-b border-slate-50" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full ${statusInfo.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <StatusIcon size={14} className={statusInfo.color} />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {call.caller || "Unknown"}
                  </p>
                </div>
                <p className="text-sm text-slate-500">{call.phone || "—"}</p>
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-sm text-slate-700 font-medium">
                    {formatDuration(call.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign size={12} className="text-slate-400" />
                  <span className="text-sm text-slate-700">
                    {(call.cost || 0).toFixed(3)}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border w-fit ${outcome.bg} ${outcome.color} ${outcome.border}`}
                >
                  {outcome.label}
                </span>
                <p className="text-xs text-slate-500">
                  {formatDateTime(call.started_at)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* ── MOBILE CARDS (hidden on desktop) ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Phone size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No call logs found</p>
          </div>
        ) : (
          filtered.map((call) => {
            const statusInfo = STATUS_ICONS[call.status] || STATUS_ICONS.ended;
            const StatusIcon = statusInfo.icon;
            const outcome =
              OUTCOME_LABELS[call.outcome] || OUTCOME_LABELS.no_action;
            return (
              <div
                key={call.id}
                onClick={() => setSelected(call)}
                className="bg-white border border-slate-100 rounded-2xl p-4 cursor-pointer active:bg-slate-50 transition-colors shadow-sm"
              >
                {/* Top row: avatar + name + outcome badge + chevron */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${statusInfo.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <StatusIcon size={16} className={statusInfo.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {call.caller || "Unknown Caller"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {call.phone || "No phone"}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${outcome.bg} ${outcome.color} ${outcome.border}`}
                  >
                    {outcome.label}
                  </span>

                  <ChevronRight
                    size={15}
                    className="text-slate-300 flex-shrink-0"
                  />
                </div>

                {/* Bottom row: duration · cost · time */}
                <div className="flex items-center gap-4 mt-3 pl-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">
                      {formatDuration(call.duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign size={11} className="text-slate-400" />
                    <span className="text-xs text-slate-600">
                      {(call.cost || 0).toFixed(3)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 ml-auto">
                    {formatDateTime(call.started_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Call Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg rounded-t-3xl max-h-[92vh] sm:max-h-[85vh] overflow-auto">
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${STATUS_ICONS[selected.status]?.bg || "bg-slate-50"} flex items-center justify-center`}
                >
                  <Phone
                    size={18}
                    className={
                      STATUS_ICONS[selected.status]?.color || "text-slate-400"
                    }
                  />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {selected.caller || "Unknown Caller"}
                  </h2>
                  <p className="text-xs text-slate-400">{selected.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <X size={15} className="text-slate-500" />
              </button>
            </div>

            <div className="p-5">
              {/* Call Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  {
                    label: "Duration",
                    value: formatDuration(selected.duration),
                    icon: Clock,
                  },
                  {
                    label: "Cost",
                    value: `$${(selected.cost || 0).toFixed(4)}`,
                    icon: DollarSign,
                  },
                  {
                    label: "Time",
                    value: formatDateTime(selected.started_at),
                    icon: Phone,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="bg-slate-50 rounded-xl p-3 text-center"
                  >
                    <p className="text-xs font-bold text-slate-900 mb-0.5 break-words">
                      {value}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Transcript */}
              {selected.transcript ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={14} className="text-slate-400" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Transcript
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed max-h-60 overflow-auto">
                    {selected.transcript}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No transcript available
                </div>
              )}

              {/* Recording */}
              {selected.recording_url && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Recording
                  </p>
                  <audio
                    controls
                    className="w-full"
                    src={selected.recording_url}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
