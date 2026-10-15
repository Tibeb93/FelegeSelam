'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { User, UserRoleName } from '../types/api';
import { setAccessToken, refreshAccessToken } from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  role: UserRoleName | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: {
    email?: string;
    phone?: string;
    identifier?: string;
    password: string;
  }) => Promise<{
    success: boolean;
    requires2FA?: boolean;
    tempToken?: string;
    message?: string;
  }>;
  verify2FA: (tempToken: string, token: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role: UserRoleName | null = (user?.role?.name as UserRoleName) || null;
  const isAuthenticated = Boolean(user);

  /**
   * Refreshes the session by calling the deduplicated refreshAccessToken helper
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        setUser(null);
        return false;
      }

      // Read restored session metadata
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.authenticated && sessionData.session) {
        setUser({
          id: sessionData.session.userId,
          email: sessionData.session.email,
          phone: sessionData.session.phone,
          status: sessionData.session.status,
          role: { name: sessionData.session.role },
        } as any);
      }

      return true;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  // Check and restore session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // First check session cookie availability
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        if (sessionData.authenticated) {
          // Exchange refresh token for in-memory access token
          await refreshSession();
        }
      } catch (err) {
        console.error('Failed to initialize auth session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen for global unauthorized events from api-client
    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [refreshSession]);

  const login = async (credentials: {
    email?: string;
    phone?: string;
    identifier?: string;
    password: string;
  }) => {
    try {
      const payload = {
        identifier:
          credentials.identifier ||
          credentials.email ||
          credentials.phone ||
          '',
        password: credentials.password,
      };

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: data.message || 'Login failed',
        };
      }

      // Check if 2FA step is required
      if (data.data?.requires2FA) {
        return {
          success: true,
          requires2FA: true,
          tempToken: data.data.tempToken,
          message: data.message,
        };
      }

      const { accessToken, user: loggedInUser } = data.data || {};
      if (accessToken && loggedInUser) {
        setAccessToken(accessToken);
        setUser(loggedInUser);
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error occurred during login',
      };
    }
  };

  const verify2FA = async (tempToken: string, token: string) => {
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: data.message || '2FA code verification failed',
        };
      }

      const { accessToken, user: verifiedUser } = data.data || {};
      if (accessToken && verifiedUser) {
        setAccessToken(accessToken);
        setUser(verifiedUser);
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network error during 2FA verification',
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        verify2FA,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
