import { FormEvent, useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../lib/auth';
import { apiFetch } from '../../lib/api';

interface Standup {
  id: number;
  date: string;
  yesterday: string;
  today: string;
  blockers: string;
  team_id: number;
}

export default function StandupHistoryPage() {
  const { token } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [teamId, setTeamId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [standups, setStandups] = useState<Standup[]>([]);

  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    setStartDate(weekAgo.toISOString().slice(0, 10));
    setEndDate(today.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!token || !startDate || !endDate) return;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
        if (teamId) params.append('team_id', String(teamId));
        const data = await apiFetch<Standup[]>(`/standups/me?${params.toString()}`, { method: 'GET' }, token);
        setStandups(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token, startDate, endDate, teamId]);

  const handleFilterSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <ProtectedRoute>
      <Layout>
        <h1 style={{ marginBottom: '1rem' }}>Standup History</h1>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <label>
            <div style={{ marginBottom: 4 }}>Start date</div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            <div style={{ marginBottom: 4 }}>End date</div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <label>
            <div style={{ marginBottom: 4 }}>Team</div>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All</option>
              <option value={1}>Team 1</option>
            </select>
          </label>
        </form>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!loading && !error && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', padding: 8 }}>Date</th>
                <th style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', padding: 8 }}>Team</th>
                <th style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', padding: 8 }}>Yesterday</th>
                <th style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', padding: 8 }}>Today</th>
                <th style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', padding: 8 }}>Blockers</th>
              </tr>
            </thead>
            <tbody>
              {standups.map((s) => (
                <tr key={s.id}>
                  <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8 }}>{s.date}</td>
                  <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8 }}>{s.team_id}</td>
                  <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8, whiteSpace: 'pre-wrap' }}>{s.yesterday}</td>
                  <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8, whiteSpace: 'pre-wrap' }}>{s.today}</td>
                  <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8, whiteSpace: 'pre-wrap' }}>{s.blockers}</td>
                </tr>
              ))}
              {standups.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>
                    No standups found for this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
