import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ onClose }) {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  async function handleSaveName(e) {
    e.preventDefault();
    setNameError('');
    setNameSaved(false);
    if (!name.trim()) {
      setNameError('Name cannot be empty.');
      return;
    }
    setNameBusy(true);
    try {
      const { data } = await api.patch('/auth/profile', { name: name.trim() });
      setUser(data.user);
      setNameSaved(true);
    } catch (err) {
      setNameError(err.response?.data?.error || 'Could not update name.');
    } finally {
      setNameBusy(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwSaved(false);

    
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwBusy(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      setPwSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.response?.data?.error || 'Could not update password.');
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden max-h-[85vh] overflow-y-auto">
        <div className="px-5 py-5 border-b border-ink/5 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Your profile</h2>
          <button
            onClick={onClose}
            className="min-h-[32px] min-w-[32px] flex items-center justify-center text-ink/40 hover:text-ink/70"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          <form onSubmit={handleSaveName} className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-wide text-ink/30">Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameSaved(false);
              }}
              className="w-full min-h-[44px] rounded-lg border border-ink/15 px-3 text-sm text-ink focus:border-flow"
            />
            <p className="text-xs text-ink/30">
              Email: <span className="text-ink/50">{user?.email}</span>
            </p>
            {nameError && <p className="text-sm text-rose-600">{nameError}</p>}
            {nameSaved && <p className="text-sm text-flow">Saved.</p>}
            <button
              type="submit"
              disabled={nameBusy}
              className="min-h-[40px] px-4 rounded-lg bg-flow text-white text-sm font-medium disabled:opacity-50"
            >
              {nameBusy ? 'Saving…' : 'Save name'}
            </button>
          </form>

          <div className="border-t border-ink/5 pt-6">
            <form onSubmit={handleChangePassword} className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wide text-ink/30">Change password</p>
              <input
                type="password"
                required
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-ink/15 px-3 text-sm text-ink focus:border-flow"
              />
              <input
                type="password"
                required
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-ink/15 px-3 text-sm text-ink focus:border-flow"
              />
              <input
                type="password"
                required
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full min-h-[44px] rounded-lg border border-ink/15 px-3 text-sm text-ink focus:border-flow"
              />
              {pwError && <p className="text-sm text-rose-600">{pwError}</p>}
              {pwSaved && <p className="text-sm text-flow">Password updated.</p>}
              <button
                type="submit"
                disabled={pwBusy}
                className="min-h-[40px] px-4 rounded-lg bg-ink text-white text-sm font-medium disabled:opacity-50"
              >
                {pwBusy ? 'Saving…' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}