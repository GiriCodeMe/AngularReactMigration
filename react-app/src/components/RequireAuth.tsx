import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

/**
 * Redirects unauthenticated users to /login.
 * Passes current location so login can redirect back after success.
 */
export default function RequireAuth({ children }: Props) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return null;

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
