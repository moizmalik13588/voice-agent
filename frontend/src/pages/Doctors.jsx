import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  X,
  Clock,
  Phone,
  Mail,
  Trash2,
  Edit2,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SPECIALTIES = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic",
  "Pediatrician",
  "Gynecologist",
  "ENT",
  "Ophthalmologist",
  "Psychiatrist",
];
const emptyForm = {
  name: "",
  specialty: "",
  email: "",
  phone: "",
  availability: [],
};

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/doctors/");
      setDoctors(res.data);
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditDoctor(null);
    setShowModal(true);
  };
  const openEdit = (doc) => {
    setForm({
      name: doc.name,
      specialty: doc.specialty,
      email: doc.email || "",
      phone: doc.phone || "",
      availability: doc.availability.map((a) => ({
        day_of_week: a.day_of_week,
        start_time: a.start_time,
        end_time: a.end_time,
        slot_duration_minutes: a.slot_duration_minutes,
      })),
    });
    setEditDoctor(doc);
    setShowModal(true);
  };

  const toggleDay = (i) => {
    const exists = form.availability.find((a) => a.day_of_week === i);
    setForm({
      ...form,
      availability: exists
        ? form.availability.filter((a) => a.day_of_week !== i)
        : [
            ...form.availability,
            {
              day_of_week: i,
              start_time: "09:00",
              end_time: "17:00",
              slot_duration_minutes: 30,
            },
          ],
    });
  };

  const updateSlot = (i, field, value) =>
    setForm({
      ...form,
      availability: form.availability.map((a) =>
        a.day_of_week === i ? { ...a, [field]: value } : a,
      ),
    });

  const handleSave = async () => {
    if (!form.name || !form.specialty)
      return toast.error("Name and specialty required");
    setSaving(true);
    try {
      editDoctor
        ? await api.patch(`/doctors/${editDoctor.id}`, form)
        : await api.post("/doctors/", form);
      toast.success(editDoctor ? "Doctor updated!" : "Doctor added!");
      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (doc) => {
    if (!confirm(`Deactivate Dr. ${doc.name}?`)) return;
    try {
      await api.delete(`/doctors/${doc.id}`);
      toast.success("Deactivated");
      fetchDoctors();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Doctors
          </h1>
          <p className="text-sm text-slate-400">
            {doctors.length} active doctor{doctors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add Doctor
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading...</div>
      ) : doctors.length === 0 ? (
        <div className="card p-16 text-center">
          <Users size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No doctors yet</p>
          <button onClick={openAdd} className="btn-primary mx-auto">
            Add First Doctor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <div
              key={doc.id}
              className="card overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-5 border-b border-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-base font-bold text-primary-500">
                      {doc.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Dr. {doc.name}
                      </p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-500">
                        {doc.specialty}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(doc)}
                      className="w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
                    >
                      <Edit2 size={13} className="text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleDeactivate(doc)}
                      className="w-8 h-8 rounded-lg border border-red-100 bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={13} className="text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-1.5">
                  {doc.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {doc.phone}
                      </span>
                    </div>
                  )}
                  {doc.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {doc.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Availability
                  </span>
                </div>
                {doc.availability.length === 0 ? (
                  <p className="text-xs text-slate-300">No schedule set</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {doc.availability.map((a) => (
                      <span
                        key={a.id}
                        className="text-xs font-medium px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-slate-600"
                      >
                        {DAYS[a.day_of_week]} · {a.start_time}–{a.end_time}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-slate-900">
                {editDoctor ? "Edit Doctor" : "Add Doctor"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <X size={15} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Full Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ahmed Khan"
                  className="input"
                />
              </div>
              {/* Specialty */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Specialty *
                </label>
                <select
                  value={form.specialty}
                  onChange={(e) =>
                    setForm({ ...form, specialty: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select specialty</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="0300-1234567"
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Email
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="dr@hospital.com"
                    className="input"
                  />
                </div>
              </div>
              {/* Availability */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Availability
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {DAYS.map((day, i) => {
                    const active = form.availability.find(
                      (a) => a.day_of_week === i,
                    );
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                          ${active ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                {form.availability
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((slot) => (
                    <div
                      key={slot.day_of_week}
                      className="grid grid-cols-4 gap-2 items-center mb-2 bg-slate-50 rounded-xl p-3"
                    >
                      <span className="text-xs font-bold text-primary-500">
                        {DAYS[slot.day_of_week]}
                      </span>
                      {[
                        { field: "start_time", label: "Start" },
                        { field: "end_time", label: "End" },
                      ].map(({ field, label }) => (
                        <div key={field}>
                          <label className="text-[10px] text-slate-400 block mb-1">
                            {label}
                          </label>
                          <input
                            type="time"
                            value={slot[field]}
                            onChange={(e) =>
                              updateSlot(
                                slot.day_of_week,
                                field,
                                e.target.value,
                              )
                            }
                            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none"
                          />
                        </div>
                      ))}
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">
                          Slot
                        </label>
                        <select
                          value={slot.slot_duration_minutes}
                          onChange={(e) =>
                            updateSlot(
                              slot.day_of_week,
                              "slot_duration_minutes",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none bg-white"
                        >
                          <option value={15}>15m</option>
                          <option value={30}>30m</option>
                          <option value={60}>60m</option>
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-70"
              >
                {saving
                  ? "Saving..."
                  : editDoctor
                    ? "Update Doctor"
                    : "Add Doctor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
