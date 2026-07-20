import { useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { AuthContext, type User } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.sub, email: payload.email });
      } catch {
        authService.logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser({ id: response.user.id, email: response.user.email });
    return response;
  };

  const register = async (email: string, password: string) => {
    const response = await authService.register({ email, password });
    setUser({ id: response.user.id, email: response.user.email });
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
