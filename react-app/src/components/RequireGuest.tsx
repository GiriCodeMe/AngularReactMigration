import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

/**
 * Redirects authenticated users away from guest-only pages (login, register).
 */
export default function RequireGuest({ children }: Props) {
  const { status } = useAuth();

  if (status === 'loading') return null;

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
