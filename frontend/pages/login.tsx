import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Placeholder - will be wired to real API client
      console.log('Logging in', { email, password });
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ width: 320, padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
        <h1 style={{ marginBottom: 16 }}>Team Standup Tracker</h1>
        {error && (
          <p style={{ color: 'red', marginBottom: 8 }}>{error}</p>
        )}
        <label style={{ display: 'block', marginBottom: 8 }}>
          <span style={{ display: 'block', marginBottom: 4 }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span style={{ display: 'block', marginBottom: 4 }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 10,
            borderRadius: 4,
            border: 'none',
            backgroundColor: '#2563eb',
            color: 'white',
            fontWeight: 500,
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </main>
  );
}
