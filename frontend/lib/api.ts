export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: "member" | "manager";
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  role?: "member" | "manager";
}

export interface Standup {
  id: number;
  user_id?: number;
  date: string;
  yesterday: string;
  today: string;
  blockers?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ManagerStandupItem {
  standup: Standup;
  user: User;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      if (data && data.detail) {
        message = Array.isArray(data.detail)
          ? data.detail.map((d: any) => d.msg || d.detail).join(", ")
          : data.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function registerUser(payload: RegisterRequest): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<User>(res);
}

export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthResponse>(res);
}

export async function getCurrentUser(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse<User>(res);
}

export async function upsertTodayStandup({
  token,
  payload,
}: {
  token: string;
  payload: { yesterday: string; today: string; blockers?: string };
}): Promise<Standup> {
  const res = await fetch(`${API_BASE_URL}/api/standups/today`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Standup>(res);
}

export async function getMyStandups({
  token,
  start_date,
  end_date,
  skip,
  limit,
}: {
  token: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}): Promise<Standup[]> {
  const params = new URLSearchParams();
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);
  if (typeof skip === "number") params.append("skip", String(skip));
  if (typeof limit === "number") params.append("limit", String(limit));

  const res = await fetch(
    `${API_BASE_URL}/api/standups/me${
      params.toString() ? `?${params.toString()}` : ""
    }`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<Standup[]>(res);
}

export async function getManagerStandups({
  token,
  email,
  user_id,
  start_date,
  end_date,
  skip,
  limit,
}: {
  token: string;
  email?: string;
  user_id?: number;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}): Promise<ManagerStandupItem[]> {
  const params = new URLSearchParams();
  if (email) params.append("email", email);
  if (typeof user_id === "number") params.append("user_id", String(user_id));
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);
  if (typeof skip === "number") params.append("skip", String(skip));
  if (typeof limit === "number") params.append("limit", String(limit));

  const res = await fetch(
    `${API_BASE_URL}/api/standups${
      params.toString() ? `?${params.toString()}` : ""
    }`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return handleResponse<ManagerStandupItem[]>(res);
}
