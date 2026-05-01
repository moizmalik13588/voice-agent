import { useEffect, useState } from "react";
import { Calendar, Plus, X, Search, Filter } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  scheduled: { bg: "#e3f0fc", color: "#1565c0" },
  completed: { bg: "#ecfdf5", color: "#059669" },
  canceled: { bg: "#fef2f2", color: "#dc2626" },
  no_show: { bg: "#fffbeb", color: "#d97706" },
};

const emptyForm = {
  doctor_id: "",
  patient_name: "",
  patient_phone: "",
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
    new Date().toISOString().split("T")[0],
  );
  const [search, setSearch] = useState("");

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
      toast.error("Failed to load appointments");
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

  // Jab doctor + date select ho toh slots fetch karo
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
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (field === "doctor_id" || field === "date") {
      fetchSlots(
        field === "doctor_id" ? value : form.doctor_id,
        field === "date" ? value : form.date,
      );
    }
  };

  const handleBook = async () => {
    if (!form.doctor_id || !form.patient_name || !form.date || !form.time)
      return toast.error("Please fill all required fields");
    setSaving(true);
    try {
      await api.post("/appointments/", {
        doctor_id: parseInt(form.doctor_id),
        patient_name: form.patient_name,
        patient_phone: form.patient_phone || undefined,
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

  const handleCancel = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      toast.success("Appointment canceled");
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
      toast.error("Failed to update status");
    }
  };

  const filtered = appointments.filter(
    (a) =>
      a.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor_name.toLowerCase().includes(search.toLowerCase()),
  );

  // Convert "09:00" → "09:00 AM"
  const fmt12 = (t) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
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
            Appointments
          </h1>
          <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0 }}>
            {filtered.length} appointment{filtered.length !== 1 ? "s" : ""} on{" "}
            {new Date(filterDate + "T00:00:00").toLocaleDateString("en-PK", {
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
          <Plus size={17} /> Book Appointment
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        {/* Date picker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "9px 14px",
          }}
        >
          <Filter size={15} color="#94a3b8" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#0f172a",
              background: "transparent",
            }}
          />
        </div>

        {/* Search */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "9px 14px",
          }}
        >
          <Search size={15} color="#94a3b8" />
          <input
            placeholder="Search patient or doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              fontSize: "14px",
              color: "#0f172a",
              background: "transparent",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #f1f5f9",
          overflow: "hidden",
        }}
      >
        {/* Column headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
            padding: "12px 24px",
            background: "#f8fafc",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          {["Patient", "Doctor", "Time", "Status", "Actions"].map((h) => (
            <span
              key={h}
              style={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {loading ? (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "14px",
            }}
          >
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <Calendar
              size={36}
              color="#e2e8f0"
              style={{ marginBottom: "10px" }}
            />
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
              No appointments found
            </p>
          </div>
        ) : (
          filtered.map((a, i) => (
            <div
              key={a.id}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr",
                padding: "14px 24px",
                alignItems: "center",
                borderBottom:
                  i < filtered.length - 1 ? "1px solid #f8fafc" : "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#fafafa")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {/* Patient */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "#e3f0fc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#1565c0",
                    flexShrink: 0,
                  }}
                >
                  {a.patient_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    {a.patient_name}
                  </p>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    {a.reason || "General"}
                  </p>
                </div>
              </div>

              {/* Doctor */}
              <p style={{ fontSize: "14px", color: "#475569", margin: 0 }}>
                {a.doctor_name}
              </p>

              {/* Time */}
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                {new Date(a.start_time).toLocaleTimeString("en-PK", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              {/* Status */}
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  display: "inline-block",
                  background: STATUS_COLORS[a.status]?.bg,
                  color: STATUS_COLORS[a.status]?.color,
                }}
              >
                {a.status}
              </span>

              {/* Actions */}
              <div style={{ display: "flex", gap: "6px" }}>
                {a.status === "scheduled" && (
                  <>
                    <button
                      onClick={() => handleStatus(a.id, "completed")}
                      title="Mark completed"
                      style={{
                        padding: "5px 10px",
                        borderRadius: "7px",
                        border: "1px solid #d1fae5",
                        background: "#ecfdf5",
                        color: "#059669",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Done
                    </button>
                    <button
                      onClick={() => handleCancel(a.id)}
                      title="Cancel"
                      style={{
                        padding: "5px 10px",
                        borderRadius: "7px",
                        border: "1px solid #fee2e2",
                        background: "#fef2f2",
                        color: "#dc2626",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </>
                )}
                {a.status === "scheduled" && (
                  <button
                    onClick={() => handleStatus(a.id, "no_show")}
                    title="No show"
                    style={{
                      padding: "5px 10px",
                      borderRadius: "7px",
                      border: "1px solid #fde68a",
                      background: "#fffbeb",
                      color: "#d97706",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    No Show
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Book Modal ── */}
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
              maxWidth: "480px",
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
                Book Appointment
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(emptyForm);
                  setAvailableSlots([]);
                }}
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

            <div
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Doctor */}
              <div>
                <label style={labelStyle}>Doctor *</label>
                <select
                  value={form.doctor_id}
                  onChange={(e) =>
                    handleFormChange("doctor_id", e.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name} — {d.specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label style={labelStyle}>Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleFormChange("date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={inputStyle}
                />
              </div>

              {/* Time slots */}
              {(loadingSlots || availableSlots.length > 0) && (
                <div>
                  <label style={labelStyle}>Available Slots *</label>
                  {loadingSlots ? (
                    <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                      Loading slots...
                    </p>
                  ) : (
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                    >
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setForm((f) => ({ ...f, time: slot }))}
                          style={{
                            padding: "7px 14px",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            background:
                              form.time === slot ? "#1565c0" : "#f1f5f9",
                            color: form.time === slot ? "white" : "#475569",
                            transition: "all 0.15s",
                          }}
                        >
                          {fmt12(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Patient Name */}
              <div>
                <label style={labelStyle}>Patient Name *</label>
                <input
                  value={form.patient_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patient_name: e.target.value }))
                  }
                  placeholder="Ahmed Ali"
                  style={inputStyle}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Patient Phone</label>
                <input
                  value={form.patient_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patient_phone: e.target.value }))
                  }
                  placeholder="0300-1234567"
                  style={inputStyle}
                />
              </div>

              {/* Reason */}
              <div>
                <label style={labelStyle}>Reason</label>
                <input
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  placeholder="Fever, checkup, follow-up..."
                  style={inputStyle}
                />
              </div>

              <button
                onClick={handleBook}
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
                  marginTop: "4px",
                }}
              >
                {saving ? "Booking..." : "Book Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "block",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  fontSize: "14px",
  color: "#0f172a",
  outline: "none",
  background: "white",
  boxSizing: "border-box",
};
