"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../components/AuthProvider";
import MemberDashboard from "../components/MemberDashboard";
import ManagerDashboard from "../components/ManagerDashboard";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="page-center">Loading...</div>;
  }

  if (user.role === "manager") {
    return <ManagerDashboard />;
  }

  return <MemberDashboard />;
}
