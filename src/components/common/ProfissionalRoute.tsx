import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfissionalRoute({ children }: { children: React.ReactNode }) {
  const { user, isProfissional, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-title font-semibold text-3xl shadow-md">
            S
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isProfissional) return <Navigate to="/portal" replace />;

  return <>{children}</>;
}
