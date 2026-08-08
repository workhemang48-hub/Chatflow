import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not sign in.');
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

        <h1 className="text-2xl font-display text-mist mb-1">Welcome back</h1>
        <p className="text-sm text-mist/50 mb-8">Sign in to keep the conversation open.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] rounded-lg bg-white/5 border border-white/10 px-3 text-mist placeholder:text-mist/30 focus:border-signal"
              placeholder="you@company.com"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[44px] rounded-lg bg-white/5 border border-white/10 px-3 text-mist placeholder:text-mist/30 focus:border-signal"
              placeholder="••••••••"
            />
          </Field>

          <p className="text-right text-xs text-mist/30">
            Forgot your password? Ask your manager to reset it for you.
          </p>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[44px] rounded-lg bg-flow text-white font-medium disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-sm text-mist/40">
          New here?{' '}
          <Link to="/signup" className="text-signal underline underline-offset-2">
            Create an account
          </Link>
        </p>

        <div className="mt-8 rounded-lg bg-white/5 px-4 py-3 text-xs font-mono text-mist/40">
          demo: manager@chatflow.dev / employee@chatflow.dev — password123
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-mono text-mist/40 mb-1">{label}</span>
      {children}
    </label>
  );
}
