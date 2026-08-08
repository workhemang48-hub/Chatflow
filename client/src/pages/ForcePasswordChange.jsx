import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ForcePasswordChange() {
  const { setUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const { data } = await api.patch('/auth/password', { currentPassword, newPassword });
      setUser(data.user);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-mist">
          <Logo size={32} className="text-mist" />
        </div>

        <h1 className="text-2xl font-display text-mist mb-1">Set a new password</h1>
        <p className="text-sm text-mist/50 mb-8">
          Your manager reset your password. Enter the temporary password they gave you, then
          choose a new one only you know.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-mono text-mist/40 mb-1">Temporary password</span>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full min-h-[44px] rounded-lg bg-white/5 border border-white/10 px-3 text-mist placeholder:text-mist/30 focus:border-signal"
              placeholder="Given to you by your manager"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-mono text-mist/40 mb-1">New password</span>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full min-h-[44px] rounded-lg bg-white/5 border border-white/10 px-3 text-mist placeholder:text-mist/30 focus:border-signal"
              placeholder="••••••••"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-mono text-mist/40 mb-1">Confirm new password</span>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full min-h-[44px] rounded-lg bg-white/5 border border-white/10 px-3 text-mist placeholder:text-mist/30 focus:border-signal"
              placeholder="••••••••"
            />
          </label>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[44px] rounded-lg bg-flow text-white font-medium disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Set new password'}
          </button>

          <button
            type="button"
            onClick={signOut}
            className="w-full text-center text-sm text-mist/30 hover:text-mist/50"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}