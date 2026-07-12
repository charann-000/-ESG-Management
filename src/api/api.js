const API_BASE_URL = "https://ecosphere-backend-3n62.onrender.com";

/**
 * Fetch wrapper that auto-attaches JWT Bearer token from localStorage.
 * Handles 401 responses by clearing auth and redirecting to login.
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("ecosphere_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // If unauthorized, clear token
  if (res.status === 401) {
    localStorage.removeItem("ecosphere_token");
    localStorage.removeItem("ecosphere_user");
  }

  return res;
};

/**
 * Login user and store JWT token.
 * Returns { success, data, message }
 */
export const loginUser = async (email, password) => {
  try {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success && data.token) {
      localStorage.setItem("ecosphere_token", data.token);
      if (data.user) {
        localStorage.setItem("ecosphere_user", JSON.stringify(data.user));
      }
    }

    return data;
  } catch (err) {
    return { success: false, message: "Network error. Please try again." };
  }
};

/**
 * Get current authenticated user profile.
 */
export const getMe = async () => {
  try {
    const res = await apiFetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.user || data.data : null;
  } catch {
    return null;
  }
};

/**
 * Logout user — clear local storage and call backend.
 */
export const logoutUser = async () => {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  localStorage.removeItem("ecosphere_token");
  localStorage.removeItem("ecosphere_user");
};

// ─── Manager-specific API calls ───

export const getManagerDashboard = async () => {
  try {
    const res = await apiFetch("/api/manager");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const getESGScores = async () => {
  try {
    const res = await apiFetch("/api/esg/scores");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const getCSRPrograms = async () => {
  try {
    const res = await apiFetch("/api/csr");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const createCSRProgram = async (data) => {
  try {
    const res = await apiFetch("/api/csr", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { success: false, message: "Network error" };
  }
};

export const approveCSREntry = async (id) => {
  try {
    const res = await apiFetch(`/api/csr/${id}/approve`, {
      method: "PUT",
    });
    return await res.json();
  } catch {
    return { success: false, message: "Network error" };
  }
};

export const logEmissionTransaction = async (data) => {
  try {
    const res = await apiFetch("/api/emissions", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { success: false, message: "Network error" };
  }
};

export const getEmissions = async () => {
  try {
    const res = await apiFetch("/api/emissions");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const getCarbonData = async () => {
  try {
    const res = await apiFetch("/api/carbon");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export default API_BASE_URL;
