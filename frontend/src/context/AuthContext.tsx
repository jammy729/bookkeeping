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
