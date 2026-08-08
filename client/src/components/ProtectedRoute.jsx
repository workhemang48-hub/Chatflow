import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowMustChange = false }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center text-mist/40 text-sm font-mono">
        loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/signin" replace />;

  if (user.mustChangePassword && !allowMustChange) {
    return <Navigate to="/force-password-change" replace />;
  }

  return children;
}