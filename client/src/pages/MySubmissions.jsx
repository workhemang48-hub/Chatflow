import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import Logo from '../components/Logo';

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

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState(null);

  useEffect(() => {
    api.get('/submissions/mine').then((res) => setSubmissions(res.data.submissions));
  }, []);

  return (
    <div className="min-h-screen bg-[#F6FBF9]">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-ink/10">
        <div className="flex items-center gap-4">
          <Link to="/app" className="text-ink/50 min-h-[44px] flex items-center px-1">
            ← Back
          </Link>
          <Logo size={22} className="text-flow" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-xl font-display text-ink mb-1">My submissions</h1>
        <p className="text-sm text-ink/50 mb-6 font-mono">your work, and where it stands</p>

        {submissions === null && <p className="text-sm text-ink/40">Loading…</p>}
        {submissions?.length === 0 && (
          <p className="text-sm text-ink/40">
            Nothing submitted yet — use the + button in any room to submit work for review.
          </p>
        )}

        <div className="space-y-3">
          {submissions?.map((s) => {
            const status = STATUS_STYLES[s.status] || STATUS_STYLES.pending;
            return (
              <div
                key={s._id}
                className="rounded-2xl border border-ink/10 bg-white p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-ink truncate">{s.fileName}</p>
                  <p className="text-xs text-ink/40 font-mono mt-0.5">
                    {s.roomId?.name} · {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                  {s.reviewNote && <p className="text-sm text-ink/60 mt-2">{s.reviewNote}</p>}
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono ${status.bg} ${status.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
