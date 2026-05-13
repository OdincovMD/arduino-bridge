import { createContext, ReactNode, useContext, useState } from 'react';

import { BackendUser, loginRequest } from '@/lib/api';

type AuthContextValue = {
  token: string | null;
  user: BackendUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginRequest(email, password);
      setToken(result.access_token);
      setUser(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось выполнить вход');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function signOut() {
    setToken(null);
    setUser(null);
    setError(null);
  }

  function clearError() {
    setError(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        error,
        signIn,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
