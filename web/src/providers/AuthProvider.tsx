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
import { logger } from '../lib/logger';

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
  adminLogin: (credentials: {
    identifier: string;
    password: string;
    twoFactorToken?: string;
  }) => Promise<{
    success: boolean;
    requires2FA?: boolean;
    redirectPath?: string;
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

      // Check session cookie without redundant refetch if user is already present
      const sessionRes = await fetch('/api/auth/session');
      if (sessionRes.ok) {
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
      }

      return true;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  // Check and restore session on mount with zero duplicate requests
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // Single session lookup on mount
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          if (isMounted) setIsLoading(false);
          return;
        }

        const sessionData = await sessionRes.json();

        if (sessionData.authenticated && sessionData.session) {
          // Immediately set user from verified session cookie so UI renders instantly
          if (isMounted) {
            setUser({
              id: sessionData.session.userId,
              email: sessionData.session.email,
              phone: sessionData.session.phone,
              status: sessionData.session.status,
              role: { name: sessionData.session.role },
            } as any);
          }
          // Exchange refresh token for in-memory access token without re-fetching session
          await refreshAccessToken();
        } else {
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (err) {
        logger.error('Failed to initialize auth session:', err);
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

  const adminLogin = async (credentials: {
    identifier: string;
    password: string;
    twoFactorToken?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.message || 'Login failed',
        };
      }

      if (data.data?.requires2FA || data.data?.requiresTwoFactor) {
        return {
          success: true,
          requires2FA: true,
          message: data.message,
        };
      }

      const { accessToken, user: loggedInUser, redirectPath } = data.data || {};
      if (accessToken && loggedInUser) {
        setAccessToken(accessToken);
        setUser({
          ...loggedInUser,
          role: typeof loggedInUser.role === 'string' ? { name: loggedInUser.role } : loggedInUser.role,
        });
      }

      return {
        success: true,
        redirectPath: redirectPath || '/admin',
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
      const isStaff = role && ['super_admin', 'admin', 'teacher', 'content_manager'].includes(role);
      const endpoint = isStaff ? '/api/auth/admin/logout' : '/api/auth/logout';
      await fetch(endpoint, { method: 'POST' });
    } finally {
      setAccessToken(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        const isStaff = role && ['super_admin', 'admin', 'teacher', 'content_manager'].includes(role);
        window.location.href = isStaff ? '/admin/login' : '/login';
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
        adminLogin,
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
