const API_URL = "http://127.0.0.1:8000/api/v1";

// Extract a readable string from FastAPI's error response.
// FastAPI's `detail` is a plain string for HTTPException, but an array of
// {loc, msg, type, ...} objects for Pydantic validation errors (422s).
const extractErrorMessage = (errorData, fallback) => {
  const detail = errorData?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((err) => {
        const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : "";
        return field ? `${field}: ${err.msg}` : err.msg;
      })
      .join("; ");
  }
  return fallback;
};

// Token management
export const getToken = () => localStorage.getItem("ifind_token");
export const setToken = (token) => localStorage.setItem("ifind_token", token);
export const clearToken = () => localStorage.removeItem("ifind_token");

// Generic API fetch wrapper
const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Only default Content-Type to application/json if the caller hasn't
  // already specified one (e.g. login() sets x-www-form-urlencoded) and
  // the body isn't FormData (browser sets that Content-Type automatically,
  // including the multipart boundary).
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      // response wasn't JSON, fall through to generic message
    }
    const errorMessage = extractErrorMessage(errorData, `HTTP ${response.status}`);
    throw new Error(errorMessage);
  }

  return await response.json();
};

// Auth endpoints
export const register = async (data) => {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const login = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  return apiFetch("/auth/login", {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const getMe = async () => {
  return apiFetch("/auth/me", {
    method: "GET",
  });
};

// Report endpoints
export const createReport = async (formData) => {
  return apiFetch("/reports", {
    method: "POST",
    body: formData, // FormData object, no Content-Type header
  });
};

export const listReports = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.report_type) params.append("report_type", filters.report_type);
  if (filters.category) params.append("category", filters.category);
  if (filters.location) params.append("location", filters.location);
  if (filters.report_status) params.append("report_status", filters.report_status);

  const queryString = params.toString();
  const endpoint = queryString ? `/reports?${queryString}` : "/reports";
  return apiFetch(endpoint, { method: "GET" });
};

export const searchReports = async (q, filters = {}) => {
  const params = new URLSearchParams();
  params.append("q", q);
  if (filters.report_type) params.append("report_type", filters.report_type);
  if (filters.category) params.append("category", filters.category);
  if (filters.location) params.append("location", filters.location);
  if (filters.report_status) params.append("report_status", filters.report_status);

  return apiFetch(`/reports/search?${params.toString()}`, { method: "GET" });
};

export const getReport = async (id) => {
  return apiFetch(`/reports/${id}`, { method: "GET" });
};

// Match endpoints
export const getMyMatches = async () => {
  return apiFetch("/matches/mine", { method: "GET" });
};

export const verifyMatch = async (id) => {
  return apiFetch(`/matches/${id}/verify`, { method: "PATCH" });
};

export const rejectMatch = async (id) => {
  return apiFetch(`/matches/${id}/reject`, { method: "PATCH" });
};

// Notification endpoints
export const getMyNotifications = async () => {
  return apiFetch("/notifications/mine", { method: "GET" });
};

export const markNotificationRead = async (id) => {
  return apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
};

// Admin endpoints
export const getAllReportsAdmin = async () => {
  return apiFetch("/admin/reports", { method: "GET" });
};

export const getAllUsersAdmin = async () => {
  return apiFetch("/admin/users", { method: "GET" });
};

export const deleteReportAdmin = async (id) => {
  return apiFetch(`/admin/reports/${id}`, { method: "DELETE" });
};

export const getAuditLogsAdmin = async () => {
  return apiFetch("/admin/audit-logs", { method: "GET" });
};

export const getAdminStats = async () => {
  return apiFetch("/admin/stats", { method: "GET" });
};