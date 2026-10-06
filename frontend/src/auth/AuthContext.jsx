import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  authApi,
  setTokens,
  clearTokens,
  hasSession,
  ApiError,
} from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Tokens are kept in memory (see api.js). A full page reload therefore
  // means the session is gone and the user must sign in again — the
  // documented trade-off for browser-only SPA token storage.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasSession());

  useEffect(() => {
    if (!hasSession()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('nexus:unauthorized', onUnauthorized);
    return () => window.removeEventListener('nexus:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const tokens = await authApi.login({ email, password });
    setTokens(tokens);
    const me = await authApi.me();
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (payload) => {
    return authApi.register(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (hasSession()) await authApi.logout();
    } catch {
      /* network failure: clear locally regardless */
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      login,
      register,
      logout,
      setUser,
      ApiError,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
