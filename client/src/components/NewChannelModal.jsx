import { useState } from 'react';

const COLOR_OPTIONS = ['#5DCAA5', '#0F6E56', '#E9B949', '#5B5F97', '#E4685D'];

export default function NewChannelModal({ people, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [colorTag, setColorTag] = useState(COLOR_OPTIONS[0]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggle(personId) {
    setSelected((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onCreate(name.trim(), colorTag, selected);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create the channel.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
            <h2 className="font-display text-lg text-ink">New channel</h2>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink/40 hover:text-ink transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <label className="block">
              <span className="block text-xs font-mono text-ink/40 mb-1">Channel name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Design, Marketing"
                className="w-full min-h-[44px] rounded-lg border border-ink/10 px-3 text-sm focus:border-flow"
              />
            </label>

            <div>
              <span className="block text-xs font-mono text-ink/40 mb-2">Color tag</span>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColorTag(c)}
                    style={{ backgroundColor: c }}
                    className={`h-8 w-8 rounded-full transition-transform ${
                      colorTag === c ? 'ring-2 ring-offset-2 ring-ink scale-110' : ''
                    }`}
                    aria-label={`Choose color ${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-mono text-ink/40 mb-2">Add people</span>
              {people.length === 0 && (
                <p className="text-sm text-ink/40">No other people to add yet.</p>
              )}
              <div className="space-y-1">
                {people.map((person) => (
                  <label
                    key={person.id}
                    className="flex items-center gap-3 min-h-[44px] px-2 rounded-lg hover:bg-ink/5 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(person.id)}
                      onChange={() => toggle(person.id)}
                      className="h-4 w-4 accent-flow"
                    />
                    <span className="text-sm text-ink">{person.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>

          <div className="px-5 py-4 border-t border-ink/10">
            <button
              type="submit"
              disabled={!name.trim() || busy}
              className="min-h-[44px] w-full rounded-lg bg-flow text-white text-sm font-medium disabled:opacity-50 transition-colors hover:bg-flow/90"
            >
              {busy ? 'Creating…' : 'Create channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}