import { Navigate, Outlet } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';

export default function PlanGuard({ requiredFeature }: { requiredFeature: 'scheduling' | 'crm' | 'dashboard' }) {
  const { hasFeature, loading } = useSubscription();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasFeature(requiredFeature)) {
    return <Navigate to="/meu-estudio" replace />;
  }

  return <Outlet />;
}
