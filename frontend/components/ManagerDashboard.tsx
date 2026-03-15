"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function ManagerDashboard() {
  const { user, logout } = useAuth();

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
        <h2>Team Standups</h2>
        <p>View and filter standups from your team.</p>
        <Link href="/manager/standups" className="button-link">
          Go to manager dashboard
        </Link>
      </section>
    </div>
  );
}
