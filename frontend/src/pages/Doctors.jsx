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

  const toggleDay = (dayIndex) => {
    const exists = form.availability.find((a) => a.day_of_week === dayIndex);
    if (exists) {
      setForm({
        ...form,
        availability: form.availability.filter(
          (a) => a.day_of_week !== dayIndex,
        ),
      });
    } else {
      setForm({
        ...form,
        availability: [
          ...form.availability,
          {
            day_of_week: dayIndex,
            start_time: "09:00",
            end_time: "17:00",
            slot_duration_minutes: 30,
          },
        ],
      });
    }
  };

  const updateSlot = (dayIndex, field, value) => {
    setForm({
      ...form,
      availability: form.availability.map((a) =>
        a.day_of_week === dayIndex ? { ...a, [field]: value } : a,
      ),
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.specialty)
      return toast.error("Name and specialty required");
    setSaving(true);
    try {
      if (editDoctor) {
        await api.patch(`/doctors/${editDoctor.id}`, form);
        toast.success("Doctor updated!");
      } else {
        await api.post("/doctors/", form);
        toast.success("Doctor added!");
      }
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
      toast.success("Doctor deactivated");
      fetchDoctors();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "#0f172a",
              margin: "0 0 4px",
              letterSpacing: "-0.5px",
            }}
          >
            Doctors
          </h1>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
            {doctors.length} active doctor{doctors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#1565c0",
            color: "white",
            border: "none",
            padding: "10px 18px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <Plus size={17} /> Add Doctor
        </button>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
          Loading...
        </div>
      ) : doctors.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            background: "white",
            borderRadius: "14px",
            border: "1px solid #f1f5f9",
          }}
        >
          <Users size={40} color="#e2e8f0" style={{ marginBottom: "12px" }} />
          <p style={{ color: "#94a3b8", fontSize: "15px", margin: "0 0 16px" }}>
            No doctors yet
          </p>
          <button
            onClick={openAdd}
            style={{
              background: "#1565c0",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "9px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Add First Doctor
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {doctors.map((doc) => (
            <div
              key={doc.id}
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid #f1f5f9",
                overflow: "hidden",
              }}
            >
              {/* Card top */}
              <div
                style={{
                  padding: "20px 20px 16px",
                  borderBottom: "1px solid #f8fafc",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        background: "#e3f0fc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#1565c0",
                      }}
                    >
                      {doc.name.charAt(0)}
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#0f172a",
                          margin: "0 0 2px",
                        }}
                      >
                        Dr. {doc.name}
                      </p>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          background: "#e3f0fc",
                          color: "#1565c0",
                        }}
                      >
                        {doc.specialty}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => openEdit(doc)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        background: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Edit2 size={14} color="#64748b" />
                    </button>
                    <button
                      onClick={() => handleDeactivate(doc)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        border: "1px solid #fee2e2",
                        background: "#fff5f5",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Trash2 size={14} color="#dc2626" />
                    </button>
                  </div>
                </div>

                {/* Contact */}
                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {doc.phone && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      <Phone size={13} color="#94a3b8" />
                      <span style={{ fontSize: "13px", color: "#64748b" }}>
                        {doc.phone}
                      </span>
                    </div>
                  )}
                  {doc.email && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      <Mail size={13} color="#94a3b8" />
                      <span style={{ fontSize: "13px", color: "#64748b" }}>
                        {doc.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability */}
              <div style={{ padding: "14px 20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  <Clock size={13} color="#94a3b8" />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Availability
                  </span>
                </div>
                {doc.availability.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
                    No schedule set
                  </p>
                ) : (
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
                  >
                    {doc.availability.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          background: "#f8fafc",
                          borderRadius: "8px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          color: "#475569",
                          fontWeight: "500",
                          border: "1px solid #f1f5f9",
                        }}
                      >
                        {DAYS[a.day_of_week]} · {a.start_time}–{a.end_time}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "540px",
              maxHeight: "85vh",
              overflow: "auto",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                background: "white",
                zIndex: 1,
              }}
            >
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                {editDoctor ? "Edit Doctor" : "Add Doctor"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {/* Basic Info */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "14px",
                }}
              >
                {[
                  {
                    label: "Full Name *",
                    name: "name",
                    placeholder: "Ahmed Khan",
                  },
                  {
                    label: "Phone",
                    name: "phone",
                    placeholder: "0300-1234567",
                  },
                  {
                    label: "Email",
                    name: "email",
                    placeholder: "dr@hospital.com",
                  },
                ].map(({ label, name, placeholder }) => (
                  <div
                    key={name}
                    style={{ gridColumn: name === "name" ? "1 / -1" : "auto" }}
                  >
                    <label
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      {label}
                    </label>
                    <input
                      value={form[name]}
                      onChange={(e) =>
                        setForm({ ...form, [name]: e.target.value })
                      }
                      placeholder={placeholder}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e2e8f0",
                        borderRadius: "9px",
                        fontSize: "14px",
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}

                {/* Specialty */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Specialty *
                  </label>
                  <select
                    value={form.specialty}
                    onChange={(e) =>
                      setForm({ ...form, specialty: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "9px",
                      fontSize: "14px",
                      color: "#0f172a",
                      outline: "none",
                      background: "white",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Availability */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  Availability
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    flexWrap: "wrap",
                    marginBottom: "12px",
                  }}
                >
                  {DAYS.map((day, i) => {
                    const active = form.availability.find(
                      (a) => a.day_of_week === i,
                    );
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(i)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          border: "none",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          background: active ? "#1565c0" : "#f1f5f9",
                          color: active ? "white" : "#64748b",
                          transition: "all 0.15s",
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Time slots */}
                {form.availability
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((slot) => (
                    <div
                      key={slot.day_of_week}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "60px 1fr 1fr 1fr",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "8px",
                        background: "#f8fafc",
                        borderRadius: "9px",
                        padding: "10px 12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#1565c0",
                        }}
                      >
                        {DAYS[slot.day_of_week]}
                      </span>
                      {[
                        { field: "start_time", label: "Start", type: "time" },
                        { field: "end_time", label: "End", type: "time" },
                      ].map(({ field, label, type }) => (
                        <div key={field}>
                          <label
                            style={{
                              fontSize: "10px",
                              color: "#94a3b8",
                              display: "block",
                              marginBottom: "2px",
                            }}
                          >
                            {label}
                          </label>
                          <input
                            type={type}
                            value={slot[field]}
                            onChange={(e) =>
                              updateSlot(
                                slot.day_of_week,
                                field,
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              border: "1px solid #e2e8f0",
                              borderRadius: "7px",
                              fontSize: "13px",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>
                      ))}
                      <div>
                        <label
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            display: "block",
                            marginBottom: "2px",
                          }}
                        >
                          Slot (min)
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
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            border: "1px solid #e2e8f0",
                            borderRadius: "7px",
                            fontSize: "13px",
                            outline: "none",
                            background: "white",
                            boxSizing: "border-box",
                          }}
                        >
                          <option value={15}>15</option>
                          <option value={30}>30</option>
                          <option value={60}>60</option>
                        </select>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#1565c0",
                  border: "none",
                  borderRadius: "9px",
                  color: "white",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
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
