import { useEffect, useState } from "react";
import {
  UserRound,
  Phone,
  X,
  Calendar,
  Stethoscope,
  Clock,
  Search,
  ChevronRight,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  scheduled: "badge-scheduled",
  completed: "badge-completed",
  canceled: "badge-canceled",
  no_show: "badge-no_show",
};

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients/");
      setPatients(res.data);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const openPatient = async (patient) => {
    setSelected(patient);
    setLoadingHistory(true);
    try {
      const res = await api.get(
        `/patients/${encodeURIComponent(patient.name)}/history`,
      );
      setHistory(res.data);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search)),
  );

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatTime = (dt) =>
    new Date(dt).toLocaleTimeString("en-PK", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Patients
          </h1>
          <p className="text-sm text-slate-400">
            {patients.length} total patients
          </p>
        </div>

        {/* Search — full width on mobile */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-full sm:w-72">
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none outline-none text-sm text-slate-900 bg-transparent w-full"
          />
        </div>
      </div>

      {/* ── DESKTOP TABLE (hidden on mobile) ── */}
      <div className="hidden md:block card overflow-hidden">
        {/* Table Headers */}
        <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 border-b border-slate-100">
          {[
            "Patient",
            "Phone",
            "Total Visits",
            "Preferred Doctor",
            "Last Visit",
          ].map((h) => (
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
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <UserRound size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No patients found</p>
          </div>
        ) : (
          filtered.map((p, i) => (
            <div
              key={p.name}
              onClick={() => openPatient(p)}
              className={`grid grid-cols-5 px-5 py-3.5 items-center cursor-pointer hover:bg-slate-50 transition-colors
                ${i < filtered.length - 1 ? "border-b border-slate-50" : ""}`}
            >
              {/* Name */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-500 flex-shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {p.name}
                </p>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-1.5">
                {p.phone ? (
                  <>
                    <Phone size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-500">{p.phone}</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-300">—</span>
                )}
              </div>

              {/* Total visits */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-900">
                  {p.total_visits}
                </span>
                <span className="text-xs text-slate-400">
                  visit{p.total_visits !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Preferred doctor */}
              <div className="flex items-center gap-1.5">
                {p.preferred_doctor ? (
                  <>
                    <Stethoscope
                      size={12}
                      className="text-slate-400 flex-shrink-0"
                    />
                    <span className="text-sm text-slate-500 truncate">
                      {p.preferred_doctor}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-slate-300">—</span>
                )}
              </div>

              {/* Last visit */}
              <span className="text-sm text-slate-500">
                {formatDate(p.last_visit)}
              </span>
            </div>
          ))
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
            <UserRound size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No patients found</p>
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.name}
              onClick={() => openPatient(p)}
              className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:bg-slate-50 transition-colors shadow-sm"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-primary-50 flex items-center justify-center text-sm font-bold text-primary-500 flex-shrink-0">
                {p.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {p.name}
                </p>

                {/* Phone */}
                {p.phone ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone size={11} className="text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-500">{p.phone}</span>
                  </div>
                ) : null}

                {/* Doctor + Visits row */}
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {p.preferred_doctor && (
                    <div className="flex items-center gap-1">
                      <Stethoscope size={11} className="text-slate-400" />
                      <span className="text-xs text-slate-500 truncate max-w-[120px]">
                        {p.preferred_doctor}
                      </span>
                    </div>
                  )}
                  <span className="text-xs font-semibold text-primary-500">
                    {p.total_visits} visit{p.total_visits !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDate(p.last_visit)}
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <ChevronRight
                size={16}
                className="text-slate-300 flex-shrink-0"
              />
            </div>
          ))
        )}
      </div>

      {/* ── Patient History Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          {/* Bottom sheet on mobile, centered modal on desktop */}
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-lg rounded-t-3xl max-h-[92vh] sm:max-h-[85vh] overflow-auto">
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-sm font-bold text-primary-500">
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {selected.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {selected.phone || "No phone"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <X size={15} className="text-slate-500" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 p-5 pb-0">
              {[
                {
                  label: "Total Visits",
                  value: selected.total_visits,
                  icon: Calendar,
                  color: "text-primary-500",
                  bg: "bg-primary-50",
                },
                {
                  label: "First Visit",
                  value: formatDate(selected.first_visit),
                  icon: Clock,
                  color: "text-violet-500",
                  bg: "bg-violet-50",
                },
                {
                  label: "Preferred Dr.",
                  value: selected.preferred_doctor || "—",
                  icon: Stethoscope,
                  color: "text-emerald-500",
                  bg: "bg-emerald-50",
                },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <div
                    className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center mb-2`}
                  >
                    <Icon size={14} className={color} />
                  </div>
                  <p className="text-xs font-bold text-slate-900 mb-0.5 truncate">
                    {value}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* History */}
            <div className="p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Visit History
              </p>

              {loadingHistory ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Loading...
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  No history found
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <Stethoscope size={14} className="text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {h.doctor_name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {h.reason || "General"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-slate-700">
                          {formatDate(h.start_time)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatTime(h.start_time)}
                        </p>
                        <span
                          className={`${STATUS_COLORS[h.status]} mt-1 inline-block`}
                        >
                          {h.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
