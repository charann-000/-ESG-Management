import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

const ROLE_DASHBOARD_MAP = {
  'Admin': '/admin/dashboard',
  'Department Manager': '/manager/dashboard',
  'Employee': '/employee/dashboard',
  'Auditor': '/auditor/dashboard',
};

export function getDashboardPath(role) {
  return ROLE_DASHBOARD_MAP[role] || '/login';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (email, password) => {
    const response = await authService.login(email, password);

    if (response.success) {
      const userData = response.data;
      setUser(userData);
      return userData;
    }

    throw new Error(response.message || 'Login failed');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    role: user?.role || null,
    getDashboardPath,
  }), [user, loading, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
