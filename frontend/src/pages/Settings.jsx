import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Unlink,
  RotateCcw,
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { getHospital } from "../store/auth";

function StatusPill({ connected }) {
  return connected ? (
    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-emerald-500" />
      <span className="text-xs font-bold text-emerald-600">Connected</span>
    </div>
  ) : (
    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-slate-400" />
      <span className="text-xs font-bold text-slate-500">Not connected</span>
    </div>
  );
}

function ActivePill() {
  return (
    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-xs font-bold text-emerald-600">Active</span>
    </div>
  );
}

export default function Settings() {
  const hospital = getHospital();
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkCalendarStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") === "connected") {
      toast.success("Google Calendar connected! 🎉");
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const checkCalendarStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/calendar/status");
      setCalendarConnected(res.data.connected);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const connectCalendar = async () => {
    setConnecting(true);
    try {
      const res = await api.get("/calendar/auth");
      window.open(res.data.auth_url, "_blank");
      toast.success("Google auth opened — complete it and come back!");
      setTimeout(() => checkCalendarStatus(), 5000);
    } catch {
      toast.error("Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const res = await api.post("/calendar/sync-all");
      toast.success(`✅ ${res.data.synced} appointments synced!`);
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Google Calendar?")) return;
    try {
      await api.delete("/calendar/disconnect");
      setCalendarConnected(false);
      toast.success("Google Calendar disconnected");
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
          Settings
        </h1>
        <p className="text-sm text-slate-400">
          Manage your hospital integrations
        </p>
      </div>

      {/* ── Hospital Info ── */}
      <div className="card p-4 sm:p-5 mb-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Hospital Info
        </p>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {hospital?.name?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {hospital?.name}
            </p>
            <p className="text-xs text-slate-400 truncate">{hospital?.email}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-500 mt-1 inline-block">
              {hospital?.subscription_plan} plan
            </span>
          </div>
        </div>
      </div>

      {/* ── Google Calendar ── */}
      <div className="card p-4 sm:p-5 mb-4">
        {/* Card header */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar size={20} className="text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                Google Calendar
              </p>
              <p className="text-xs text-slate-400 leading-tight">
                Auto-sync appointments to doctor's calendar
              </p>
            </div>
          </div>

          {loading ? (
            <RefreshCw
              size={16}
              className="animate-spin text-slate-300 flex-shrink-0"
            />
          ) : (
            <StatusPill connected={calendarConnected} />
          )}
        </div>

        {/* Features list */}
        <div className="flex flex-col gap-2 mb-4">
          {[
            "New appointments automatically added to calendar",
            "30 min & 1 hour reminders set automatically",
            "Patient info included in event description",
            "Sync all existing appointments at once",
          ].map((f) => (
            <div key={f} className="flex items-start gap-2">
              <CheckCircle
                size={13}
                className="text-emerald-500 flex-shrink-0 mt-0.5"
              />
              <span className="text-xs text-slate-600">{f}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {calendarConnected ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={syncAll}
              disabled={syncing}
              className="btn-primary disabled:opacity-70 justify-center"
            >
              {syncing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Syncing...
                </>
              ) : (
                <>
                  <RotateCcw size={14} /> Sync All Appointments
                </>
              )}
            </button>
            <button
              onClick={disconnect}
              className="btn-secondary flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 hover:border-red-200"
            >
              <Unlink size={14} /> Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectCalendar}
            disabled={connecting}
            className="btn-primary disabled:opacity-70 w-full sm:w-auto justify-center"
          >
            {connecting ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Opening...
              </>
            ) : (
              <>
                <ExternalLink size={14} /> Connect Google Calendar
              </>
            )}
          </button>
        )}
      </div>

      {/* ── AI Voice Assistant ── */}
      <div className="card p-4 sm:p-5 mb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-violet-600 font-bold text-sm">AI</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900">
                AI Voice Assistant
              </p>
              <ActivePill />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              VAPI powered — Alex handles calls 24/7
            </p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 mt-3">
          <p className="text-xs text-slate-500">
            Phone:{" "}
            <span className="font-bold text-slate-700">+1 (662) 238 0044</span>
          </p>
        </div>
      </div>

      {/* ── WhatsApp ── */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-600 font-bold text-sm">WA</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900">
                WhatsApp Reminders
              </p>
              <ActivePill />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Twilio powered — auto confirmations & reminders
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
