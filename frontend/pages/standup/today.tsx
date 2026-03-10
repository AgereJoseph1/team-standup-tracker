import { FormEvent, useEffect, useMemo, useState } from 'react';
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

export default function TodayStandupPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [standup, setStandup] = useState<Standup | null>(null);
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('');
  const [teamId, setTeamId] = useState<number>(1);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (!token) return;
    const fetchToday = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<Standup[]>(`/standups/me?start_date=${todayStr}&end_date=${todayStr}`, { method: 'GET' }, token);
        if (data.length > 0) {
          const s = data[0];
          setStandup(s);
          setYesterday(s.yesterday);
          setToday(s.today);
          setBlockers(s.blockers);
          setTeamId(s.team_id);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load today\'s standup');
      } finally {
        setLoading(false);
      }
    };
    fetchToday();
  }, [token, todayStr]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (standup) {
        const updated = await apiFetch<Standup>(`/standups/${standup.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ yesterday, today, blockers }),
        }, token);
        setStandup(updated);
        setSuccess('Standup updated');
      } else {
        const created = await apiFetch<Standup>('/standups/', {
          method: 'POST',
          body: JSON.stringify({
            date: todayStr,
            yesterday,
            today,
            blockers,
            team_id: teamId,
          }),
        }, token);
        setStandup(created);
        setSuccess('Standup submitted');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save standup');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <h1 style={{ marginBottom: '1rem' }}>Today&apos;s Standup</h1>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>Date: {todayStr}</p>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
            {error && <p style={{ color: 'red', marginBottom: 8 }}>{error}</p>}
            {success && <p style={{ color: 'green', marginBottom: 8 }}>{success}</p>}

            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', marginBottom: 4 }}>Team</span>
              <select
                value={teamId}
                onChange={(e) => setTeamId(Number(e.target.value))}
                disabled={!!standup}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
              >
                <option value={1}>Team 1</option>
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', marginBottom: 4 }}>What did you work on yesterday?</span>
              <textarea
                value={yesterday}
                onChange={(e) => setYesterday(e.target.value)}
                required
                rows={3}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 12 }}>
              <span style={{ display: 'block', marginBottom: 4 }}>What will you work on today?</span>
              <textarea
                value={today}
                onChange={(e) => setToday(e.target.value)}
                required
                rows={3}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', marginBottom: 4 }}>Any blockers?</span>
              <textarea
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 4,
                border: 'none',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 500,
                cursor: saving ? 'default' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : standup ? 'Update standup' : 'Submit standup'}
            </button>
          </form>
        )}
      </Layout>
    </ProtectedRoute>
  );
}
