import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const STATUS_STYLES = {
  pending: { label: 'pending', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  approved: { label: 'approved', dot: 'bg-flow', text: 'text-flow', bg: 'bg-flow/10' },
  changes_requested: {
    label: 'changes requested',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
  },
};

export default function SubmissionCard({ message, onUpdated }) {
  const { user } = useAuth();
  const submission = message.submission;
  const [reviewNote, setReviewNote] = useState('');
  const [resubmitFile, setResubmitFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!submission) return null;

  const status = STATUS_STYLES[submission.status] || STATUS_STYLES.pending;
  const isManager = user.role === 'manager';
  const isOwner = submission.submittedBy?._id === user.id || submission.submittedBy === user.id;
  const canReview = isManager && submission.status === 'pending';
  const canResubmit = isOwner && submission.status === 'changes_requested';

  async function review(decision) {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.patch(`/submissions/${submission._id}/review`, {
        decision,
        reviewNote,
      });
      onUpdated?.(data.message);
      setReviewNote('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update this submission.');
    } finally {
      setBusy(false);
    }
  }

  async function resubmit(e) {
    e.preventDefault();
    if (!resubmitFile) return;
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', resubmitFile);
      const { data } = await api.post(`/submissions/${submission._id}/resubmit`, form);
      onUpdated?.(data.message);
      setResubmitFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not resubmit.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md rounded-2xl border border-ink/10 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink/5">
        <div className="min-w-0">
          <p className="truncate font-medium text-sm text-ink">{submission.fileName}</p>
          <p className="text-xs text-ink/50 font-mono truncate">
            {message.senderId?.name || 'Deleted user'}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono ${status.bg} ${status.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {submission.note && (
        <p className="px-4 pt-3 text-sm text-ink/70">{submission.note}</p>
      )}

      <div className="px-4 pt-3">
        <a
          href={submission.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-flow underline underline-offset-2"
        >
          View file ↗
        </a>
      </div>

      {submission.status !== 'pending' && submission.reviewNote && (
        <p className="mx-4 mt-3 rounded-lg bg-ink/5 px-3 py-2 text-sm text-ink/70">
          {submission.reviewNote}
        </p>
      )}

      {error && <p className="mx-4 mt-3 text-sm text-rose-600">{error}</p>}

      {canReview && (
        <div className="p-4 space-y-2">
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Add a note (optional)"
            rows={2}
            className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm resize-none focus:border-flow"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              disabled={busy}
              onClick={() => review('approved')}
              className="min-h-[44px] flex-1 rounded-lg bg-flow text-white text-sm font-medium disabled:opacity-50 transition-colors hover:bg-flow/90"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => review('changes_requested')}
              className="min-h-[44px] flex-1 rounded-lg border border-ink/15 text-ink text-sm font-medium disabled:opacity-50 transition-colors hover:bg-ink/5"
            >
              Request changes
            </button>
          </div>
        </div>
      )}

      {canResubmit && (
        <form onSubmit={resubmit} className="p-4 space-y-2 border-t border-ink/5">
          <label className="block text-xs text-ink/50 font-mono">Resubmit a new file</label>
          <input
            type="file"
            onChange={(e) => setResubmitFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          <button
            type="submit"
            disabled={busy || !resubmitFile}
            className="min-h-[44px] w-full rounded-lg bg-flow text-white text-sm font-medium disabled:opacity-50"
          >
            Resubmit
          </button>
        </form>
      )}
    </div>
  );
}
