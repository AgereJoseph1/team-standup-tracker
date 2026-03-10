import { FormEvent, useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import { apiFetch } from '../../lib/api';
import { Role } from '../../lib/auth';
import { useAuth } from '../../lib/auth';

interface Standup {
  id: number;
  date: string;
  yesterday: string;
  today: string;
  blockers: string;
  user_id: number;
  team_id: number;
}

interface SummaryResponse {
  total_entries: number;
}

const TEAM_OPTIONS = [
  { id: 1, name: 'Team 1' },
];

export default function ManagerDashboardPage() {
  const { token } = useAuth();
  const [teamId, setTeamId] = useState<number>(TEAM_OPTIONS[0].id);
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daily, setDaily] = useState<Standup[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    setDate(todayStr);
    setStartDate(weekAgo.toISOString().slice(0, 10));
    setEndDate(today.toISOString().slice(0, 10));
  }, [todayStr]);

  useEffect(() => {
    if (!token || !date) return;
    const fetchDaily = async () => {
      setLoadingDaily(true);
      setError(null);
      try {
        const data = await apiFetch<Standup[]>(`/standups/team/${teamId}/daily?date=${date}`, { method: 'GET' }, token);
        setDaily(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load daily standups');
      } finally {
        setLoadingDaily(false);
      }
    };
    fetchDaily();
  }, [token, teamId, date]);

  useEffect(() => {
    if (!token || !startDate || !endDate) return;
    const fetchSummary = async () => {
      setLoadingSummary(true);
      setError(null);
      try {
        const data = await apiFetch<SummaryResponse>(`/standups/team/${teamId}/summary?start_date=${startDate}&end_date=${endDate}`, { method: 'GET' }, token);
        setSummary(data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load summary');
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, [token, teamId, startDate, endDate]);

  const handleFiltersSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  return (
    <ProtectedRoute roles={['manager' as Role, 'admin' as Role]}>
      <Layout>
        <h1 style={{ marginBottom: '1rem' }}>Manager Dashboard</h1>
        <form onSubmit={handleFiltersSubmit} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <label>
            <div style={{ marginBottom: 4 }}>Team</div>
            <select value={teamId} onChange={(e) => setTeamId(Number(e.target.value))}>
              {TEAM_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ marginBottom: 4 }}>Daily date</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <div style={{ marginBottom: 4 }}>Summary start</div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            <div style={{ marginBottom: 4 }}>Summary end</div>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </form>
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        <section style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '1rem', borderRadius: 8, border: '1px solid #e5e7eb', minWidth: 160 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Total entries (summary range)</div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>
              {loadingSummary ? '...' : summary?.total_entries ?? 0}
            </div>
          </div>
        </section>
        <section>
          <h2 style={{ marginBottom: '0.5rem' }}>Daily standups for {date}</h2>
          {loadingDaily ? (
            <p>Loading daily standups...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', padding: 8 }}>User</th>
                  <th style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', padding: 8 }}>Yesterday</th>
                  <th style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', padding: 8 }}>Today</th>
                  <th style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left', padding: 8 }}>Blockers</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((s) => (
                  <tr key={s.id}>
                    <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8 }}>{s.user_id}</td>
                    <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8, whiteSpace: 'pre-wrap' }}>{s.yesterday}</td>
                    <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8, whiteSpace: 'pre-wrap' }}>{s.today}</td>
                    <td style={{ borderBottom: '1px solid #f3f4f6', padding: 8, whiteSpace: 'pre-wrap' }}>{s.blockers}</td>
                  </tr>
                ))}
                {daily.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>
                      No standups found for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </Layout>
    </ProtectedRoute>
  );
}
