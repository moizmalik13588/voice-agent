import { useEffect, useState } from "react";
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

function formatPKR(amount) {
  if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}K`;
  return `Rs. ${amount}`;
}

const STATUS_CONFIG = {
  paid: {
    label: "Paid",
    bg: "bg-emerald-50",
    color: "text-emerald-600",
    border: "border-emerald-200",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    color: "text-amber-600",
    border: "border-amber-200",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    bg: "bg-red-50",
    color: "text-red-600",
    border: "border-red-200",
    icon: XCircle,
  },
};

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState("");
  const [creating, setCreating] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    fetchAll();
  }, []);

  // Check payment success from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast.success("Payment successful! 🎉");
      window.history.replaceState({}, "", "/payments");
      fetchAll();
    }
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, s, a] = await Promise.all([
        api.get("/payments/"),
        api.get("/payments/stats"),
        api.get("/appointments/all-scheduled"), // ← new endpoint
      ]);
      setPayments(p.data);
      setStats(s.data);
      setAppointments(a.data);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!selectedAppt) return toast.error("Select an appointment");
    setCreating(true);
    try {
      const res = await api.post("/payments/create-session", {
        appointment_id: parseInt(selectedAppt),
        success_url: `${window.location.origin}/payments?payment=success`,
        cancel_url: `${window.location.origin}/payments?payment=canceled`,
      });
      // Stripe checkout pe redirect
      window.open(res.data.checkout_url, "_blank");
      setShowModal(false);
      toast.success("Stripe checkout opened!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create payment");
    } finally {
      setCreating(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw size={24} className="animate-spin text-slate-300" />
      </div>
    );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Payments
          </h1>
          <p className="text-sm text-slate-400">
            Stripe-powered payment collection
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchAll}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <CreditCard size={15} /> Collect Payment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Collected",
            value: formatPKR(stats?.total_collected || 0),
            icon: DollarSign,
            bg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            accent: "#059669",
          },
          {
            label: "Pending",
            value: formatPKR(stats?.total_pending || 0),
            icon: Clock,
            bg: "bg-amber-50",
            iconColor: "text-amber-600",
            accent: "#d97706",
          },
          {
            label: "Paid Transactions",
            value: stats?.paid_count || 0,
            icon: CheckCircle,
            bg: "bg-primary-50",
            iconColor: "text-primary-500",
            accent: "#1565c0",
          },
          {
            label: "Pending Transactions",
            value: stats?.pending_count || 0,
            icon: TrendingUp,
            bg: "bg-violet-50",
            iconColor: "text-violet-600",
            accent: "#7c3aed",
          },
        ].map(({ label, value, icon: Icon, bg, iconColor, accent }) => (
          <div key={label} className="card p-5 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
              style={{ background: accent }}
            />
            <div
              className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}
            >
              <Icon size={20} className={iconColor} />
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight mb-0.5">
              {value}
            </p>
            <p className="text-xs text-slate-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Payment History</p>
            <p className="text-xs text-slate-400">
              {payments.length} transactions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 border-b border-slate-100">
          {["Patient", "Appointment", "Amount", "Status", "Date"].map((h) => (
            <span
              key={h}
              className="text-[10px] font-bold text-slate-400 uppercase tracking-wider"
            >
              {h}
            </span>
          ))}
        </div>

        {payments.length === 0 ? (
          <div className="py-12 text-center">
            <CreditCard size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 mb-1">
              No payments yet
            </p>
            <p className="text-xs text-slate-400">
              Click "Collect Payment" to get started
            </p>
          </div>
        ) : (
          payments.map((p, i) => {
            const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            return (
              <div
                key={p.id}
                className={`grid grid-cols-5 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors
                  ${i < payments.length - 1 ? "border-b border-slate-50" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-500 flex-shrink-0">
                    {p.patient_name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {p.patient_name}
                  </p>
                </div>

                <p className="text-sm text-slate-500">#{p.appointment_id}</p>

                <p className="text-sm font-bold text-slate-900">
                  Rs. {p.amount?.toLocaleString()}
                </p>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border w-fit flex items-center gap-1.5
                  ${status.bg} ${status.color} ${status.border}`}
                >
                  <StatusIcon size={11} />
                  {status.label}
                </span>

                <p className="text-xs text-slate-500">
                  {new Date(p.created_at).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* ── Collect Payment Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Collect Payment
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <XCircle size={15} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* Stripe badge */}
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <CreditCard size={16} className="text-slate-500" />
                <p className="text-sm text-slate-600">
                  Powered by{" "}
                  <span className="font-bold text-slate-900">Stripe</span> —
                  secure payment processing
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Select Appointment *
                </label>
                <select
                  value={selectedAppt}
                  onChange={(e) => setSelectedAppt(e.target.value)}
                  className="input"
                >
                  <option value="">Choose appointment...</option>
                  {appointments.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} — {a.patient_name} · Dr. {a.doctor_name} ·{" "}
                      {new Date(a.start_time).toLocaleTimeString("en-PK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-700">
                  <span className="font-bold">How it works:</span> A Stripe
                  checkout page will open. Patient can pay via card. Payment
                  will be automatically recorded.
                </p>
              </div>

              <button
                onClick={createSession}
                disabled={creating}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-70"
              >
                {creating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <ExternalLink size={15} /> Open Stripe Checkout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
