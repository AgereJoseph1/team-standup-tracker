import Link from 'next/link';
import { useAuth } from '../lib/auth';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, hasRole } = useAuth();

  return (
    <div>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/standup/today">Today</Link>
          <Link href="/standup/history">History</Link>
          {hasRole(['manager', 'admin']) && <Link href="/manager/dashboard">Manager</Link>}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {user && (
            <div style={{ fontSize: 14, textAlign: 'right' }}>
              <div>{user.full_name || user.email}</div>
              <div style={{ color: '#6b7280' }}>{user.role}</div>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 4,
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <main style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>{children}</main>
    </div>
  );
}
