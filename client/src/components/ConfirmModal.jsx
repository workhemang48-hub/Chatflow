export default function ConfirmModal({ title, message, confirmLabel, danger, busy, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 py-5">
          <h2 className="font-display text-lg text-ink mb-2">{title}</h2>
          <p className="text-sm text-ink/60 leading-relaxed">{message}</p>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="min-h-[44px] flex-1 rounded-lg border border-ink/15 text-ink text-sm font-medium transition-colors hover:bg-ink/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`min-h-[44px] flex-1 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 ${
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-flow hover:bg-flow/90'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}