const API_URL = "/api";

export function getUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}
// Only non-sensitive display info is kept here. The login token lives in an HTTP-only cookie.
export function saveSession({ user }) {
  localStorage.setItem("user", JSON.stringify(user));
}
export async function logout() {
  localStorage.removeItem("user");
  try { await fetch(`${API_URL}/auth/logout`, { method: "POST" }); } catch { /* ignore */ }
}

export async function apiRequest(path, options = {}) {
  const headers = { ...(options.body && typeof options.body === "string" ? { "Content-Type": "application/json" } : {}), ...options.headers };
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) localStorage.removeItem("user"); // session expired
    throw new Error(data.message || "Request failed");
  }
  return data;
}
