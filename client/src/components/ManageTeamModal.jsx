import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function ManageTeamModal({ onClose }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [results, setResults] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/users');
        setPeople(data.users);
      } catch {
        setError('Could not load team members.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleReset(userId) {
    setError('');
    setBusyId(userId);
    try {
      const { data } = await api.patch(`/users/${userId}/reset-password`, {});
      setResults((prev) => ({ ...prev, [userId]: data.tempPassword }));
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden max-h-[85vh] flex flex-col">
        <div className="px-5 py-5 border-b border-ink/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-display text-lg text-ink">Manage team</h2>
            <p className="text-xs text-ink/40 mt-0.5">Reset a teammate's password if they're locked out.</p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[32px] min-w-[32px] flex items-center justify-center text-ink/40 hover:text-ink/70"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

          {loading ? (
            <p className="text-sm text-ink/40">Loading…</p>
          ) : (
            <div className="space-y-3">
              {people.map((person) => (
                <div key={person.id} className="rounded-xl border border-ink/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{person.name}</p>
                      <p className="text-xs text-ink/40 truncate">{person.email} · {person.role}</p>
                    </div>
                    <button
                      onClick={() => handleReset(person.id)}
                      disabled={busyId === person.id}
                      className="shrink-0 min-h-[36px] px-3 rounded-lg border border-ink/15 text-xs font-medium text-ink/70 hover:bg-ink/5 disabled:opacity-50"
                    >
                      {busyId === person.id ? 'Resetting…' : 'Reset password'}
                    </button>
                  </div>

                  {results[person.id] && (
                    <div className="mt-3 rounded-lg bg-flow/10 border border-flow/30 px-3 py-2">
                      <p className="text-xs text-ink/50 mb-1">
                        Temporary password — share this with {person.name} directly. They'll be
                        asked to set their own password on next sign-in.
                      </p>
                      <p className="font-mono text-sm text-ink select-all">{results[person.id]}</p>
                    </div>
                  )}
                </div>
              ))}

              {people.length === 0 && (
                <p className="text-sm text-ink/40">No other team members yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}