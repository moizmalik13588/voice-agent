import { useEffect, useState } from "react";
import {
  UserRound,
  Phone,
  X,
  Calendar,
  Stethoscope,
  Clock,
  Search,
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Patients
          </h1>
          <p className="text-sm text-slate-400">
            {patients.length} total patients
          </p>
        </div>
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-72">
          <Search size={14} className="text-slate-400" />
          <input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none outline-none text-sm text-slate-900 bg-transparent w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {/* Headers */}
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
                <p className="text-sm font-semibold text-slate-900">{p.name}</p>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-1.5">
                {p.phone ? (
                  <>
                    <Phone size={12} className="text-slate-400" />
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
                    <Stethoscope size={12} className="text-slate-400" />
                    <span className="text-sm text-slate-500">
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

      {/* ── Patient History Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
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
            <div className="grid grid-cols-3 gap-3 p-6 pb-0">
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
                  <p className="text-xs font-bold text-slate-900 mb-0.5">
                    {value}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* History */}
            <div className="p-6">
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
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                          <Stethoscope size={14} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {h.doctor_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {h.reason || "General"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
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
