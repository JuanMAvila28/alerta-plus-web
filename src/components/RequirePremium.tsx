import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { usePremium } from '../lib/premium';

/** Premium library guard: without Premium, back to /premium (plan section 5). */
export function RequirePremium({ children }: { children: ReactNode }) {
  const premium = usePremium();
  if (premium === undefined) return null;
  return premium ? children : <Navigate to="/premium" replace />;
}
