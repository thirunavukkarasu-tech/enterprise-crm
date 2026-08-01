import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(undefined);

/**
 * Holds the current user + auth status app-wide. Phase 1 ships the
 * container and the "restore session on refresh" bootstrap so routing/
 * layout work (ProtectedRoute, Navbar user menu) has something real to
 * render against. login()/logout() are wired to the API in Phase 2.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Placeholder bootstrap: in Phase 2 this calls GET /auth/me with the
    // stored token to rehydrate the user on a hard refresh.
    const token = localStorage.getItem('crm_access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  }, []);

  const login = async (_credentials) => {
    throw new Error('Not implemented yet — ships in Phase 2 (Authentication module).');
  };

  const logout = () => {
    localStorage.removeItem('crm_access_token');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
