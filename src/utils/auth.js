// Using environment variables with fallbacks
import { SERVER_BASE_URL } from "./server-config";

const API_BASE_URL = SERVER_BASE_URL;
const API_URL = `${API_BASE_URL}/api/users`; // Added /api to match backend routes
const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || "auth_token";
const USER_KEY = "admin_user";
const BRANCH_INFO_KEY = "branch_info";
const BRANCH_ID = 4; // Caritas Inn Ilasan branch ID

const persistSession = (data) => {
  localStorage.setItem(TOKEN_KEY, data.token);

  if (data.branch) {
    localStorage.setItem(BRANCH_INFO_KEY, JSON.stringify(data.branch));
  }

  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
};

const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(BRANCH_INFO_KEY);
};

// Login and get token
export const login = async (staffRole, password) => {
  const resolvedRole = password === undefined ? null : staffRole;
  const resolvedPassword = password === undefined ? staffRole : password;

  try {
    console.log("Making request to:", `${API_URL}/login`); // Debug log
    const loginData = {
      branch_id: BRANCH_ID,
      password: resolvedPassword,
      ...(resolvedRole ? { role: resolvedRole } : {}),
    };

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    persistSession(data);
    return data;
  } catch (error) {
    console.error("Login error details:", {
      message: error.message,
      url: `${API_URL}/login`,
      error: error,
    });
    throw error;
  }
};

// Verify token
export const verifyToken = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      clearStoredSession();
      return null;
    }

    const data = await response.json();

    if (data?.branch) {
      localStorage.setItem(BRANCH_INFO_KEY, JSON.stringify(data.branch));
    }

    if (data?.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data?.user || null;
  } catch (error) {
    console.error("Token verification failed:", error);
    clearStoredSession();
    return null;
  }
};

// Change a branch-tier password. `target_role` is optional — omit it to
// change your own password; managers may pass target_role: "receptionist"
// to reset the receptionist's password using their own current password.
export const changePassword = async ({ current_password, new_password, target_role }) => {
  const response = await fetch(`${API_URL}/change-password`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      current_password,
      new_password,
      ...(target_role ? { target_role } : {}),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to change password");
  }
  return data;
};

// Logout
export const logout = () => {
  clearStoredSession();
  window.location.href = "/admin";
};

// Get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  const user = await verifyToken();
  return !!user;
};

export const getStoredAdminUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    console.error("Failed to parse stored admin user:", error);
    return null;
  }
};

export const getStoredStaffRole = () =>
  getStoredAdminUser()?.staff_role || null;

export const getStoredBranch = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawBranch = localStorage.getItem(BRANCH_INFO_KEY);
  if (!rawBranch) {
    return null;
  }

  try {
    return JSON.parse(rawBranch);
  } catch (error) {
    console.error("Failed to parse stored branch info:", error);
    return null;
  }
};

export const isManager = () => getStoredStaffRole() === "manager";

export const canManageRoomPrices = () => isManager();

