import { useEffect, useState } from "react";
import { Calendar, Plus, X, Search, Filter } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

const STATUS_COLORS = {
  scheduled: "badge-scheduled",
  completed: "badge-completed",
  canceled: "badge-canceled",
  no_show: "badge-no_show",
};

const emptyForm = {
  doctor_id: "",
  patient_name: "",
  patient_phone: "",
  patient_email: "",
  reason: "",
  date: "",
  time: "",
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterDate, setFilterDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [search, setSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    appointmentId: null,
  });

  useEffect(() => {
    fetchDoctors();
  }, []);
  useEffect(() => {
    fetchAppointments();
  }, [filterDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.post("/appointments/list", { date: filterDate });
      setAppointments(res.data);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/doctors/");
      setDoctors(res.data);
    } catch {}
  };

  const fetchSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;
    setLoadingSlots(true);
    setAvailableSlots([]);
    setForm((f) => ({ ...f, time: "" }));
    try {
      const res = await api.get("/appointments/available-slots", {
        params: { doctor_id: doctorId, date },
      });
      setAvailableSlots(res.data.available_slots || []);
    } catch {
      setAvailableSlots([]);
      toast.error("Doctor not available on this day");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "doctor_id" || field === "date")
      fetchSlots(
        field === "doctor_id" ? value : form.doctor_id,
        field === "date" ? value : form.date,
      );
  };

  const handleBook = async () => {
    if (!form.doctor_id || !form.patient_name || !form.date || !form.time)
      return toast.error("Fill all required fields");
    setSaving(true);
    try {
      await api.post("/appointments/", {
        doctor_id: parseInt(form.doctor_id),
        patient_name: form.patient_name,
        patient_phone: form.patient_phone || undefined,
        patient_email: form.patient_email || undefined,
        reason: form.reason || undefined,
        start_time: `${form.date}T${form.time}:00`,
      });
      toast.success("Appointment booked!");
      setShowModal(false);
      setForm(emptyForm);
      setAvailableSlots([]);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to book");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      await api.patch(`/appointments/${confirmModal.appointmentId}/cancel`);
      toast.success("Appointment canceled");
      setConfirmModal({ open: false, appointmentId: null });
      fetchAppointments();
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}/status?status=${status}`);
      toast.success(`Marked as ${status}`);
      fetchAppointments();
    } catch {
      toast.error("Failed");
    }
  };

  const filtered = appointments.filter(
    (a) =>
      a.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor_name.toLowerCase().includes(search.toLowerCase()),
  );

  const fmt12 = (t) => {
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Appointments
          </h1>
          <p className="text-sm text-slate-400">
            {filtered.length} appointment{filtered.length !== 1 ? "s" : ""} on{" "}
            {new Date(filterDate + "T00:00:00").toLocaleDateString("en-PK", {
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
          <Filter size={14} className="text-slate-400" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="border-none outline-none text-sm text-slate-900 bg-transparent"
          />
        </div>
        <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
          <Search size={14} className="text-slate-400" />
          <input
            placeholder="Search patient or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none outline-none text-sm text-slate-900 bg-transparent w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 border-b border-slate-100">
          {["Patient", "Doctor", "Time", "Status", "Actions"].map((h) => (
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
            <Calendar size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No appointments found</p>
          </div>
        ) : (
          filtered.map((a, i) => (
            <div
              key={a.id}
              className={`grid grid-cols-5 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors
                ${i < filtered.length - 1 ? "border-b border-slate-50" : ""}`}
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
              <span className={`${STATUS_COLORS[a.status]} w-fit`}>
                {a.status}
              </span>
              <div className="flex gap-1.5">
                {a.status === "scheduled" && (
                  <>
                    <button
                      onClick={() => handleStatus(a.id, "completed")}
                      className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-colors"
                    >
                      ✓ Done
                    </button>
                    <button
                      onClick={() =>
                        setConfirmModal({ open: true, appointmentId: a.id })
                      }
                    >
                      ✕ Cancel
                    </button>
                    <button
                      onClick={() => handleStatus(a.id, "no_show")}
                      className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 text-xs font-bold hover:bg-amber-100 transition-colors"
                    >
                      No Show
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-slate-900">
                Book Appointment
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(emptyForm);
                  setAvailableSlots([]);
                }}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <X size={15} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Doctor *
                </label>
                <select
                  value={form.doctor_id}
                  onChange={(e) =>
                    handleFormChange("doctor_id", e.target.value)
                  }
                  className="input"
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Date *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleFormChange("date", e.target.value)}
                  // min date for date input
                  min={new Date().toLocaleDateString("en-CA")}
                  className="input"
                />
              </div>

              {(loadingSlots || availableSlots.length > 0) && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Available Slots *
                  </label>
                  {loadingSlots ? (
                    <p className="text-xs text-slate-400">Loading slots...</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setForm((f) => ({ ...f, time: slot }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                            ${form.time === slot ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          {fmt12(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Patient Name *
                </label>
                <input
                  value={form.patient_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patient_name: e.target.value }))
                  }
                  placeholder="Ahmed Ali"
                  className="input"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Phone
                </label>
                <input
                  value={form.patient_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patient_phone: e.target.value }))
                  }
                  placeholder="0300-1234567"
                  className="input"
                />
              </div>
              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Patient Email
                </label>
                <input
                  value={form.patient_email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patient_email: e.target.value }))
                  }
                  type="email"
                  placeholder="patient@gmail.com"
                  className="input"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Reason
                </label>
                <input
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="Fever, checkup..."
                  className="input"
                />
              </div>

              <button
                onClick={handleBook}
                disabled={saving}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-70"
              >
                {saving ? "Booking..." : "Book Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, appointmentId: null })}
        onConfirm={handleCancel}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Yes, Cancel"
      />
    </div>
  );
}
