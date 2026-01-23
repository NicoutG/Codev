const API_BASE = "";

export async function fetchJson(url, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });
  
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  
  return res.json();
}

export async function login(username, password) {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    body: formData,
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Login failed");
  }
  
  const data = await res.json();
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("user", JSON.stringify(data.user));
  return data;
}

export async function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function getCurrentUser() {
  return fetchJson("/api/auth/me");
}

export function getStoredUser() {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

export function getToken() {
  return localStorage.getItem("token");
}

export function isAuthenticated() {
  return !!getToken();
}
