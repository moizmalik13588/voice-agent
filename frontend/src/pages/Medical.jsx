import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  X,
  Search,
  Stethoscope,
  AlertTriangle,
  Pill,
  ClipboardList,
  RefreshCw,
  Calendar,
  CheckCircle,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const NOTE_TYPES = [
  {
    value: "general",
    label: "General",
    icon: ClipboardList,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  {
    value: "diagnosis",
    label: "Diagnosis",
    icon: Stethoscope,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    value: "medication",
    label: "Medication",
    icon: Pill,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
  {
    value: "allergy",
    label: "Allergy",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
];

const STATUS_COLORS = {
  scheduled: "badge-scheduled",
  completed: "badge-completed",
  canceled: "badge-canceled",
  no_show: "badge-no_show",
};

export default function Medical() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [medData, setMedData] = useState(null);
  const [loadingMed, setLoadingMed] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({
    note: "",
    note_type: "general",
    created_by: "",
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get("/medical/patients");
      setPatients(res.data);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const openPatient = async (patient) => {
    setSelected(patient);
    setLoadingMed(true);
    setMedData(null);
    setActiveTab("notes");
    try {
      const res = await api.get(`/medical/${encodeURIComponent(patient.name)}`);
      setMedData(res.data);
    } catch {
      toast.error("Failed to load medical history");
    } finally {
      setLoadingMed(false);
    }
  };

  const addNote = async () => {
    if (!noteForm.note) return toast.error("Note cannot be empty");
    setSaving(true);
    try {
      await api.post("/medical/notes", {
        patient_name: selected.name,
        ...noteForm,
      });
      toast.success("Note added!");
      setNoteForm({ note: "", note_type: "general", created_by: "" });
      setShowNoteForm(false);
      // Refresh medical data
      const res = await api.get(
        `/medical/${encodeURIComponent(selected.name)}`,
      );
      setMedData(res.data);
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm("Delete this note?")) return;
    try {
      await api.delete(`/medical/notes/${noteId}`);
      toast.success("Note deleted");
      const res = await api.get(
        `/medical/${encodeURIComponent(selected.name)}`,
      );
      setMedData(res.data);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone && p.phone.includes(search)),
  );

  const getNoteType = (type) =>
    NOTE_TYPES.find((t) => t.value === type) || NOTE_TYPES[0];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Medical History
          </h1>
          <p className="text-sm text-slate-400">
            {patients.length} patients · Click to view history
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 w-72">
          <Search size={14} className="text-slate-400" />
          <input
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none outline-none text-sm text-slate-900 bg-transparent w-full"
          />
        </div>
      </div>

      {/* Patients Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.name}
              onClick={() => openPatient(p)}
              className="card p-5 cursor-pointer hover:shadow-md hover:border-primary-100 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary-50 flex items-center justify-center text-base font-bold text-primary-500">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      {p.phone || "No phone"}
                    </p>
                  </div>
                </div>
                {p.note_count > 0 && (
                  <div className="flex items-center gap-1.5 bg-primary-50 rounded-lg px-2.5 py-1">
                    <FileText size={12} className="text-primary-500" />
                    <span className="text-xs font-bold text-primary-500">
                      {p.note_count}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Patient Medical Modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
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
                onClick={() => {
                  setSelected(null);
                  setMedData(null);
                  setShowNoteForm(false);
                }}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <X size={15} className="text-slate-500" />
              </button>
            </div>

            {loadingMed ? (
              <div className="py-12 text-center">
                <RefreshCw
                  size={20}
                  className="animate-spin text-slate-300 mx-auto"
                />
              </div>
            ) : (
              medData && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 p-6 pb-0">
                    {[
                      {
                        label: "Completed Visits",
                        value: medData.stats.total_visits,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                      },
                      {
                        label: "No-Shows",
                        value: medData.stats.no_shows,
                        color: "text-red-600",
                        bg: "bg-red-50",
                      },
                      {
                        label: "Upcoming",
                        value: medData.stats.upcoming,
                        color: "text-primary-500",
                        bg: "bg-primary-50",
                      },
                    ].map(({ label, value, color, bg }) => (
                      <div
                        key={label}
                        className={`${bg} rounded-xl p-3 text-center`}
                      >
                        <p className={`text-xl font-bold ${color} mb-0.5`}>
                          {value}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Tabs */}
                  <div className="flex bg-slate-100 rounded-xl p-1 mx-6 mt-4 mb-0 gap-1">
                    {[
                      { id: "notes", label: `Notes (${medData.notes.length})` },
                      {
                        id: "visits",
                        label: `Visit History (${medData.visits.length})`,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all
                        ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {/* Notes Tab */}
                    {activeTab === "notes" && (
                      <div>
                        {/* Add note button */}
                        {!showNoteForm && (
                          <button
                            onClick={() => setShowNoteForm(true)}
                            className="btn-primary mb-4"
                          >
                            <Plus size={15} /> Add Note
                          </button>
                        )}

                        {/* Note form */}
                        {showNoteForm && (
                          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
                            <p className="text-sm font-bold text-slate-900 mb-3">
                              New Note
                            </p>

                            {/* Note type */}
                            <div className="flex gap-2 mb-3 flex-wrap">
                              {NOTE_TYPES.map((type) => (
                                <button
                                  key={type.value}
                                  onClick={() =>
                                    setNoteForm((f) => ({
                                      ...f,
                                      note_type: type.value,
                                    }))
                                  }
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                                  ${
                                    noteForm.note_type === type.value
                                      ? `${type.bg} ${type.color} ${type.border}`
                                      : "bg-white text-slate-500 border-slate-200"
                                  }`}
                                >
                                  <type.icon size={12} />
                                  {type.label}
                                </button>
                              ))}
                            </div>

                            <textarea
                              value={noteForm.note}
                              onChange={(e) =>
                                setNoteForm((f) => ({
                                  ...f,
                                  note: e.target.value,
                                }))
                              }
                              placeholder="Write note here..."
                              rows={3}
                              className="input resize-none mb-3"
                            />

                            <input
                              value={noteForm.created_by}
                              onChange={(e) =>
                                setNoteForm((f) => ({
                                  ...f,
                                  created_by: e.target.value,
                                }))
                              }
                              placeholder="Doctor name (optional)"
                              className="input mb-3"
                            />

                            <div className="flex gap-2">
                              <button
                                onClick={addNote}
                                disabled={saving}
                                className="btn-primary disabled:opacity-70"
                              >
                                {saving ? "Saving..." : "Save Note"}
                              </button>
                              <button
                                onClick={() => setShowNoteForm(false)}
                                className="btn-secondary"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Notes list */}
                        {medData.notes.length === 0 ? (
                          <div className="py-8 text-center">
                            <FileText
                              size={24}
                              className="text-slate-200 mx-auto mb-2"
                            />
                            <p className="text-sm text-slate-400">
                              No notes yet
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {medData.notes.map((note) => {
                              const type = getNoteType(note.note_type);
                              return (
                                <div
                                  key={note.id}
                                  className={`p-4 rounded-xl border ${type.border} ${type.bg}`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <type.icon
                                        size={14}
                                        className={type.color}
                                      />
                                      <span
                                        className={`text-xs font-bold uppercase tracking-wider ${type.color}`}
                                      >
                                        {type.label}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => deleteNote(note.id)}
                                      className="w-7 h-7 rounded-lg border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 flex-shrink-0"
                                    >
                                      <Trash2
                                        size={12}
                                        className="text-red-500"
                                      />
                                    </button>
                                  </div>
                                  <p className="text-sm text-slate-700 leading-relaxed mb-2">
                                    {note.note}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-400">
                                      {note.created_by
                                        ? `Dr. ${note.created_by}`
                                        : "Staff"}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {new Date(
                                        note.created_at,
                                      ).toLocaleDateString("en-PK", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Visits Tab */}
                    {activeTab === "visits" && (
                      <div>
                        {medData.visits.length === 0 ? (
                          <div className="py-8 text-center">
                            <Calendar
                              size={24}
                              className="text-slate-200 mx-auto mb-2"
                            />
                            <p className="text-sm text-slate-400">
                              No visits yet
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {medData.visits.map((visit) => (
                              <div
                                key={visit.id}
                                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center flex-shrink-0">
                                    <Stethoscope
                                      size={14}
                                      className="text-slate-400"
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                      {visit.doctor_name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {visit.reason || "General"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-medium text-slate-700">
                                    {new Date(
                                      visit.start_time,
                                    ).toLocaleDateString("en-PK", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </p>
                                  <span
                                    className={`${STATUS_COLORS[visit.status]} mt-1 inline-block`}
                                  >
                                    {visit.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
