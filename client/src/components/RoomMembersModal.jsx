import { useState } from 'react';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';

export default function RoomMembersModal({ room, people, onClose, onAddMembers, onRemoveMember }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState('');

  const realMembers = room.members.filter(Boolean);
  const memberIds = new Set(realMembers.map((m) => m._id));
  const addablePeople = people.filter((p) => !memberIds.has(p.id));

  function toggle(personId) {
    setSelected((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  }

  async function handleAdd() {
    if (selected.length === 0) return;
    setBusy(true);
    setError('');
    try {
      await onAddMembers(selected);
      setSelected([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add people.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(memberId) {
    setRemovingId(memberId);
    setError('');
    try {
      await onRemoveMember(memberId);
      if (memberId === user.id) onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not remove that person.');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
          <h2 className="font-display text-lg text-ink">{room.name}</h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink/40 hover:text-ink transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-5">
          {room.isDefault && (
            <p className="text-xs text-ink/40 bg-ink/5 rounded-lg px-3 py-2">
              Everyone is automatically part of this channel — it can't be left, and there's no need to add people to it.
            </p>
          )}

          <div>
            <p className="text-xs font-mono text-ink/40 mb-2">{realMembers.length} member(s)</p>
            <div className="space-y-1">
              {realMembers.map((m) => {
                const isSelf = m._id === user.id;
                const canRemove = !room.isDefault && (isSelf || user.role === 'manager');
                return (
                  <div key={m._id} className="flex items-center gap-3 min-h-[40px] px-1">
                    <Avatar name={m.name} size={28} />
                    <span className="text-sm text-ink">{m.name}</span>
                    <span className="text-xs text-ink/30 font-mono ml-auto mr-2">{m.role}</span>
                    {canRemove && (
                      <button
                        onClick={() => handleRemove(m._id)}
                        disabled={removingId === m._id}
                        className="text-xs text-rose-500 hover:text-rose-700 transition-colors disabled:opacity-50"
                        title={isSelf ? 'Leave channel' : 'Remove from channel'}
                      >
                        {removingId === m._id ? '…' : isSelf ? 'Leave' : 'Remove'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!room.isDefault && addablePeople.length > 0 && (
            <div>
              <p className="text-xs font-mono text-ink/40 mb-2">Add people</p>
              <div className="space-y-1">
                {addablePeople.map((person) => (
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
              <button
                onClick={handleAdd}
                disabled={selected.length === 0 || busy}
                className="mt-3 min-h-[44px] w-full rounded-lg bg-flow text-white text-sm font-medium disabled:opacity-50 transition-colors hover:bg-flow/90"
              >
                {busy ? 'Adding…' : `Add ${selected.length || ''} to channel`.trim()}
              </button>
            </div>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}