"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { upsertTodayStandup, Standup } from "../lib/api";

export default function MemberDashboard() {
  const { token, user, logout } = useAuth();
  const [yesterday, setYesterday] = useState("");
  const [today, setToday] = useState("");
  const [blockers, setBlockers] = useState("");
  const [saved, setSaved] = useState<Standup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const standup = await upsertTodayStandup({
        token,
        payload: { yesterday, today, blockers: blockers || undefined },
      });
      setSaved(standup);
      setSuccess("Standup saved successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to save standup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Welcome, {user?.full_name || user?.email}</h1>
          <p>Role: {user?.role}</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <section className="card">
        <h2>Today&apos;s Standup</h2>
        <form onSubmit={handleSubmit} className="standup-form">
          <label>
            What did you do yesterday?
            <textarea
              value={yesterday}
              onChange={(e) => setYesterday(e.target.value)}
              required
            />
          </label>
          <label>
            What are you doing today?
            <textarea
              value={today}
              onChange={(e) => setToday(e.target.value)}
              required
            />
          </label>
          <label>
            Any blockers?
            <textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}
          <button type="submit" disabled={loading || !token}>
            {loading ? "Saving..." : "Save standup"}
          </button>
        </form>
        {saved && (
          <div className="saved-standup">
            <h3>Saved for {saved.date}</h3>
            <p>
              <strong>Yesterday:</strong> {saved.yesterday}
            </p>
            <p>
              <strong>Today:</strong> {saved.today}
            </p>
            <p>
              <strong>Blockers:</strong> {saved.blockers || "None"}
            </p>
          </div>
        )}
      </section>

      <section className="card">
        <h2>History</h2>
        <p>View your previous standups.</p>
        <Link href="/standups/history" className="button-link">
          Go to history
        </Link>
      </section>
    </div>
  );
}
