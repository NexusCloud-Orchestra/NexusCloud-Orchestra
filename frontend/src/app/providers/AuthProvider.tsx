/**
 * AuthProvider — wires real backend auth (POST /api/v1/auth/login JSON)
 * into a React context consumed by useAuth() everywhere.
 *
 * Token strategy (per API contract):
 *  - access_token: memory only (cleared on reload)
 *  - refresh_token: sessionStorage (survives same-tab reload, cleared on logout)
 *  - On any 401 the api() client already does a single coordinated refresh+retry
 *    before calling sessionExpiredHandler which triggers logout here.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  me as apiMe,
} from '../../api/auth';
import {
  readPersistedRefreshToken,
  refreshSession as clientRefreshSession,
  setSessionExpiredHandler,
  setAccessToken,
} from '../../api/client';
import type { User } from '../../types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** true only while the initial silent-refresh check is running */
  isInitialChecking: boolean;
  /** true while a login/logout API call is in flight */
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  simulateExpireToken: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialChecking, setIsInitialChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  // Coordinated session expired handler from api() client
  const handleSessionExpired = useCallback(() => {
    if (!mountedRef.current) return;
    setUser(null);
    setIsAuthenticated(false);
    setError('Your session has expired. Please sign in again.');
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(handleSessionExpired);
    return () => {
      setSessionExpiredHandler(null);
    };
  }, [handleSessionExpired]);

  // Initial silent refresh
  useEffect(() => {
    mountedRef.current = true;

    async function silentRefresh() {
      const stored = readPersistedRefreshToken();
      if (!stored) {
        if (mountedRef.current) setIsInitialChecking(false);
        return;
      }

      try {
        const refreshed = await clientRefreshSession();
        if (!refreshed) {
          if (mountedRef.current) setIsInitialChecking(false);
          return;
        }
        const profile = await apiMe();
        if (mountedRef.current) {
          setUser(profile);
          setIsAuthenticated(true);
        }
      } catch {
        if (mountedRef.current) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mountedRef.current) setIsInitialChecking(false);
      }
    }

    silentRefresh();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await apiLogin(email, password);
      const profile = await apiMe();
      if (mountedRef.current) {
        setUser(profile);
        setIsAuthenticated(true);
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      if (mountedRef.current) {
        setError(msg);
        setIsAuthenticated(false);
      }
      return false;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiLogout();
    } catch {
      // Ignore network errors during logout
    } finally {
      if (mountedRef.current) {
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
        setIsLoading(false);
      }
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const ok = await clientRefreshSession();
      if (ok) {
        const profile = await apiMe();
        if (mountedRef.current) {
          setUser(profile);
          setIsAuthenticated(true);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const simulateExpireToken = useCallback(() => {
    setAccessToken('invalid-simulated-expired-token');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitialChecking,
        isLoading,
        error,
        login,
        logout,
        refreshSession,
        simulateExpireToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
