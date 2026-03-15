"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { getMyStandups, Standup } from "../../../lib/api";

export default function StandupHistoryPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Standup[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const limit = 20;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  const loadStandups = async (reset = false) => {
    if (!token) return;
    setLoadingData(true);
    try {
      const currentSkip = reset ? 0 : skip;
      const data = await getMyStandups({
        token,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        skip: currentSkip,
        limit,
      });
      if (reset) {
        setItems(data);
      } else {
        setItems((prev) => [...prev, ...data]);
      }
      setSkip(currentSkip + data.length);
      setHasMore(data.length === limit);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadStandups(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading || !user) {
    return <div className="page-center">Loading...</div>;
  }

  return (
    <div className="page">
      <h1>My Standup History</h1>
      <div className="filters card">
        <label>
          Start date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <button
          onClick={() => {
            setSkip(0);
            loadStandups(true);
          }}
          disabled={loadingData}
        >
          Apply filters
        </button>
      </div>
      <div className="card">
        {items.length === 0 && <p>No standups found.</p>}
        {items.map((s) => (
          <div key={s.id} className="standup-item">
            <h3>{s.date}</h3>
            <p>
              <strong>Yesterday:</strong> {s.yesterday}
            </p>
            <p>
              <strong>Today:</strong> {s.today}
            </p>
            <p>
              <strong>Blockers:</strong> {s.blockers || "None"}
            </p>
          </div>
        ))}
        {hasMore && (
          <button onClick={() => loadStandups()} disabled={loadingData}>
            {loadingData ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
