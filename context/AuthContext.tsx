import React, { createContext, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Plan } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (plan?: Plan) => void;
  logout: () => void;
}

// This is a placeholder for a real user object you'd get from a backend
const createMockUser = (plan: Plan): User => ({
  email: 'demo@speednetworkingplanner.com',
  plan,
});

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const login = useCallback((plan: Plan = 'Free') => {
    // In a real app, this would involve an API call.
    // Here, we just set a mock user.
    setUser(createMockUser(plan));
    navigate('/app/dashboard');
  }, [navigate]);

  const logout = useCallback(() => {
    // In a real app, this would invalidate a token.
    setUser(null);
    navigate('/');
  }, [navigate]);

  const authContextValue = useMemo(() => ({
    user,
    login,
    logout,
    isAuthenticated: !!user,
  }), [user, login, logout]);
  
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};