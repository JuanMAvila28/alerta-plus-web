import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../lib/auth';
import { rememberReturnTo } from '../lib/loginReturn';

/**
 * Route guard (plan section 5). "Has an account" = a user saved on the device:
 * no connection or valid token is needed.
 */
export function RequireAccount({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { pathname, search } = useLocation();

  if (!session) return <Navigate to={`/login?volver=${encodeURIComponent(pathname + search)}`} replace />;
  if (!session.dataConsent) {
    rememberReturnTo(pathname + search);
    return <Navigate to="/bienvenida" replace />;
  }
  return children;
}
