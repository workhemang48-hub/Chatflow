import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signUp(name, email, password, role);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account.');
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

        <h1 className="text-2xl font-display text-mist mb-1">Create your account</h1>
        <p className="text-sm text-mist/50 mb-8">A few details and you're in.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] rounded-lg bg-white/5 border border-white/10 px-3 text-mist placeholder:text-mist/30 focus:border-signal"
              placeholder="Sam Patel"
            />
          </Field>
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
              minLength={1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[44px] rounded-lg bg-white/5 border border-white/10 px-3 text-mist placeholder:text-mist/30 focus:border-signal"
              placeholder="Set a Strong password"
            />
          </Field>
          <Field label="Role">
            <div className="grid grid-cols-2 gap-2">
              {['employee', 'manager'].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`min-h-[44px] rounded-lg border text-sm capitalize ${
                    role === r
                      ? 'border-signal bg-signal/10 text-signal'
                      : 'border-white/10 text-mist/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[44px] rounded-lg bg-flow text-white font-medium disabled:opacity-50"
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-sm text-mist/40">
          Already have an account?{' '}
          <Link to="/signin" className="text-signal underline underline-offset-2">
            Sign in
          </Link>
        </p>
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
