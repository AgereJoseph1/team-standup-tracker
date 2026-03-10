import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Role, useAuth } from '../lib/auth';

interface Props {
  children: React.ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user, token, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (roles && !hasRole(roles)) {
      router.replace('/standup/today');
    }
  }, [loading, token, user, roles, hasRole, router]);

  if (loading || !token || !user) {
    return <p>Loading...</p>;
  }

  if (roles && !hasRole(roles)) {
    return null;
  }

  return <>{children}</>;
}
