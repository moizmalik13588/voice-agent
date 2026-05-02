import { useEffect, useState } from "react";
import {
  Phone,
  Send,
  RefreshCw,
  Clock,
  UserRound,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Recall() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [days, setDays] = useState(90);
  const [sent, setSent] = useState({});

  useEffect(() => {
    fetchInactive();
  }, [days]);

  const fetchInactive = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/recall/inactive-patients?days=${days}`);
      setPatients(res.data);
    } catch {
      toast.error("Failed to load inactive patients");
    } finally {
      setLoading(false);
    }
  };

  const sendBulk = async () => {
    if (
      !confirm(
        `Send recall message to all ${patients.filter((p) => p.phone).length} patients?`,
      )
    )
      return;
    setSending(true);
    try {
      const res = await api.post(`/recall/send-bulk?days=${days}`);
      toast.success(`✅ ${res.data.sent} messages sent!`);
      // Mark all as sent
      const newSent = {};
      patients.forEach((p) => {
        if (p.phone) newSent[p.name] = true;
      });
      setSent(newSent);
    } catch {
      toast.error("Failed to send bulk recall");
    } finally {
      setSending(false);
    }
  };

  const sendSingle = async (patientName) => {
    setSendingId(patientName);
    try {
      const res = await api.post(
        `/recall/send-single/${encodeURIComponent(patientName)}`,
      );
      if (res.data.success) {
        toast.success(`Message sent to ${patientName}!`);
        setSent((prev) => ({ ...prev, [patientName]: true }));
      } else {
        toast.error(res.data.message);
      }
    } catch {
      toast.error("Failed to send");
    } finally {
      setSendingId(null);
    }
  };

  const withPhone = patients.filter((p) => p.phone).length;
  const withoutPhone = patients.filter((p) => !p.phone).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            Auto Recall
          </h1>
          <p className="text-sm text-slate-400">
            Re-engage patients who haven't visited recently
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Days filter */}
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none bg-white text-slate-700 font-medium"
          >
            <option value={30}>30 days inactive</option>
            <option value={60}>60 days inactive</option>
            <option value={90}>90 days inactive</option>
            <option value={180}>6 months inactive</option>
            <option value={365}>1 year inactive</option>
          </select>

          <button
            onClick={fetchInactive}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={14} /> Refresh
          </button>

          <button
            onClick={sendBulk}
            disabled={sending || withPhone === 0}
            className="btn-primary disabled:opacity-50"
          >
            {sending ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Send size={14} /> Send to All ({withPhone})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Inactive Patients",
            value: patients.length,
            icon: UserRound,
            bg: "bg-primary-50",
            iconColor: "text-primary-500",
            accent: "#1565c0",
          },
          {
            label: "Can be Contacted",
            value: withPhone,
            icon: Phone,
            bg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            accent: "#059669",
          },
          {
            label: "No Phone Number",
            value: withoutPhone,
            icon: AlertCircle,
            bg: "bg-amber-50",
            iconColor: "text-amber-600",
            accent: "#d97706",
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
            <p className="text-3xl font-bold text-slate-900 tracking-tight mb-0.5">
              {value}
            </p>
            <p className="text-xs text-slate-400 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5">
        <AlertCircle size={16} className="text-blue-500 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          These patients haven't visited in <strong>{days}+ days</strong>. Send
          them a WhatsApp reminder to rebook.
        </p>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-5 px-5 py-3 bg-slate-50 border-b border-slate-100">
          {["Patient", "Phone", "Last Visit", "Days Inactive", "Action"].map(
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
            <RefreshCw
              size={20}
              className="animate-spin mx-auto mb-2 text-slate-300"
            />
            Loading...
          </div>
        ) : patients.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle size={28} className="text-emerald-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 mb-1">
              All patients are active!
            </p>
            <p className="text-xs text-slate-400">
              No patients inactive for {days}+ days
            </p>
          </div>
        ) : (
          patients.map((p, i) => {
            const isSent = sent[p.name];
            const isSending = sendingId === p.name;

            return (
              <div
                key={p.name}
                className={`grid grid-cols-5 px-5 py-3.5 items-center hover:bg-slate-50 transition-colors
                  ${i < patients.length - 1 ? "border-b border-slate-50" : ""}
                  ${isSent ? "opacity-60" : ""}`}
              >
                {/* Patient */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-500 flex-shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {p.name}
                  </p>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-1.5">
                  {p.phone ? (
                    <>
                      <Phone size={12} className="text-slate-400" />
                      <span className="text-sm text-slate-600">{p.phone}</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-300 italic">
                      No phone
                    </span>
                  )}
                </div>

                {/* Last visit */}
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {new Date(p.last_visit).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Days inactive */}
                <div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full
                    ${
                      p.days_inactive >= 180
                        ? "bg-red-50 text-red-600"
                        : p.days_inactive >= 90
                          ? "bg-amber-50 text-amber-600"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.days_inactive} days
                  </span>
                </div>

                {/* Action */}
                <div>
                  {isSent ? (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle size={14} />
                      <span className="text-xs font-semibold">Sent</span>
                    </div>
                  ) : p.phone ? (
                    <button
                      onClick={() => sendSingle(p.name)}
                      disabled={isSending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 
                                 text-primary-500 text-xs font-bold border border-primary-100
                                 hover:bg-primary-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />{" "}
                          Sending
                        </>
                      ) : (
                        <>
                          <Send size={12} /> Remind
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
