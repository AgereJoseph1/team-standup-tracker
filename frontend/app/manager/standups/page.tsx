"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthProvider";
import { getManagerStandups, ManagerStandupItem } from "../../../lib/api";

export default function ManagerStandupsPage() {
  const { user, loading, token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ManagerStandupItem[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [email, setEmail] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const limit = 20;

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth/login");
      } else if (user.role !== "manager") {
        router.replace("/");
      }
    }
  }, [loading, user, router]);

  const loadStandups = async (reset = false) => {
    if (!token) return;
    setLoadingData(true);
    try {
      const currentSkip = reset ? 0 : skip;
      const data = await getManagerStandups({
        token,
        email: email || undefined,
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
    if (token && user?.role === "manager") {
      loadStandups(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role]);

  if (loading || !user) {
    return <div className="page-center">Loading...</div>;
  }

  if (user.role !== "manager") {
    return null;
  }

  return (
    <div className="page">
      <h1>Team Standups</h1>
      <div className="filters card">
        <label>
          Member email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Filter by email"
          />
        </label>
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
      <div className="card table-wrapper">
        {items.length === 0 && <p>No standups found.</p>}
        {items.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Yesterday</th>
                <th>Today</th>
                <th>Blockers</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.standup.id}>
                  <td>{item.standup.date}</td>
                  <td>{item.user.full_name || item.user.email}</td>
                  <td>{item.standup.yesterday}</td>
                  <td>{item.standup.today}</td>
                  <td>{item.standup.blockers || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {hasMore && (
          <button onClick={() => loadStandups()} disabled={loadingData}>
            {loadingData ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}
