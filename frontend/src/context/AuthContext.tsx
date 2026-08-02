import { useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { isAdminZone } from '../lib/routes';
import { AuthContext, type User } from './useAuth';

const HASH_TOKEN_PREFIX = '#token=';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cross-origin JWT handoff from the apex zone: the token arrives in the
    // URL hash fragment (localStorage is per-origin). Only the admin zone may
    // persist it — the apex zone must never store a JWT. The hash is always
    // stripped so a token never lingers in the address bar on any zone.
    const hash = window.location.hash;
    if (hash.startsWith(HASH_TOKEN_PREFIX)) {
      let tokenFromHash: string | null = null;
      try {
        tokenFromHash = decodeURIComponent(hash.slice(HASH_TOKEN_PREFIX.length));
      } catch {
        // Malformed percent-encoding (e.g. '#token=%E0%A4%A'). Treat it as
        // "no token" rather than crashing the whole app: this provider renders
        // above the ErrorBoundary, so an uncaught error would blank the app.
        tokenFromHash = null;
      }

      // Strip the hash regardless of zone — never leave a token in the URL.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      if (tokenFromHash) {
        if (isAdminZone()) {
          // A fresh cross-origin handoff token always wins, even when
          // localStorage already holds an older (possibly expired) token.
          authService.setToken(tokenFromHash);
        }
        // On the apex zone the hash token is deliberately NOT persisted —
        // the apex origin is strictly stateless (prevents cross-origin
        // session loops).
      }
    }

    if (!isAdminZone()) {
      // The apex zone is strictly stateless: any token left over from a
      // previous admin-zone visit is actively purged on mount so the public
      // pages never expose a session.
      authService.logout();
      setLoading(false);
      return;
    }

    const token = authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.sub, email: payload.email, firstName: payload.firstName, lastName: payload.lastName });
      } catch {
        authService.logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser({ id: response.user.id, email: response.user.email, firstName: response.user.firstName, lastName: response.user.lastName });
    return response;
  };

  const register = async (email: string, firstName: string, lastName: string, password: string) => {
    const response = await authService.register({ email, firstName, lastName, password });
    setUser({ id: response.user.id, email: response.user.email, firstName: response.user.firstName, lastName: response.user.lastName });
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const setUserFromUpdate = (updatedUser: User | null) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        setUser: setUserFromUpdate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
