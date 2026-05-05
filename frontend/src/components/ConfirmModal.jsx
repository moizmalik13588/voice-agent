import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  confirmColor = "bg-red-500 hover:bg-red-600",
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-6">
          {/* Icon */}
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-red-500" />
          </div>

          {/* Text */}
          <h2 className="text-base font-bold text-slate-900 text-center mb-2">
            {title}
          </h2>
          <p className="text-sm text-slate-500 text-center mb-6">{message}</p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-70 ${confirmColor}`}
            >
              {loading ? "Please wait..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
