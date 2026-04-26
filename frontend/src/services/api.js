import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("rateguard_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Stats / Dashboard ─────────────────────────────────────────────────────

export const fetchStats = () => api.get("/stats").then((r) => r.data?.data || r.data);

export const fetchTopUsers = (limit = 10) =>
  api.get(`/top-users?limit=${limit}`).then((r) => r.data?.data || r.data);

export const fetchBlockedUsers = () =>
  api.get("/blocked-users").then((r) => r.data?.data || r.data);

export const fetchAlerts = () => api.get("/alerts").then((r) => r.data?.data || r.data);

export const fetchHealth = () => api.get("/health").then((r) => r.data?.data || r.data);

export const fetchLogs = (page = 1, limit = 50) =>
  api.get(`/logs?page=${page}&limit=${limit}`).then((r) => r.data?.data || r.data);

// ─── Actions ────────────────────────────────────────────────────────────────

export const blockUser = (identifier, duration = 10) =>
  api.post("/block", { identifier, duration }).then((r) => r.data);

export const unblockUser = (identifier) =>
  api.post("/unblock", { identifier }).then((r) => r.data);

// ─── Export ─────────────────────────────────────────────────────────────────

export const exportLogs = (hours = 24) =>
  api
    .get(`/logs/export?hours=${hours}`, { responseType: "blob" })
    .then((r) => {
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `rateguard-logs-${hours}h.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    });

// ─── Auth ───────────────────────────────────────────────────────────────────

export const login = (email, password) =>
  api.post("/auth/login", { email, password }).then((r) => {
    const data = r.data?.data || r.data;
    if (data.token) localStorage.setItem("rateguard_token", data.token);
    return data;
  });

export const register = (username, email, password) =>
  api.post("/auth/register", { username, email, password }).then((r) => {
    const data = r.data?.data || r.data;
    if (data.token) localStorage.setItem("rateguard_token", data.token);
    return data;
  });

export const getMe = () => api.get("/auth/me").then((r) => r.data?.data || r.data);

export const logout = () => {
  localStorage.removeItem("rateguard_token");
};

// ─── API Keys ───────────────────────────────────────────────────────────────

export const generateApiKey = (name, userId, tier = "free") =>
  api.post("/keys/generate", { name, userId, tier }).then((r) => r.data?.data || r.data);

export const listApiKeys = () => api.get("/keys").then((r) => r.data?.data || r.data);

export const revokeApiKey = (id) =>
  api.delete(`/keys/${id}`).then((r) => r.data?.data || r.data);

// ─── Test endpoints (rate-limited) ──────────────────────────────────────────

export const testSlidingWindow = () =>
  api.get("/protected/data").then((r) => r.data);

export const testTokenBucket = () =>
  api.get("/tb/data").then((r) => r.data);

export default api;
