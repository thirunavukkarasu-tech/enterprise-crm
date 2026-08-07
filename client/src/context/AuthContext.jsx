import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authService } from '../services/authService.js';
import { setAccessToken } from '../services/api.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load there's no access token in memory (page refresh clears
  // JS state), so we attempt one silent refresh against the httpOnly
  // refresh cookie. If it succeeds, the user stays logged in across a
  // hard refresh with no visible flash of the login page beyond this
  // initial check; if it fails (no cookie / expired), we fall through to
  // the login page via ProtectedRoute.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { accessToken, user: restoredUser } = await authService.refresh();
        setAccessToken(accessToken);
        setUser(restoredUser);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (credentials) => {
    const { accessToken, user: loggedInUser } = await authService.login(credentials);
    setAccessToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  /**
   * Merges a partial user update into the cached session — used after
   * Settings > Profile/Preferences saves (name, avatarUrl, theme, ...) so
   * the Navbar and everywhere else reading `user` from this context update
   * immediately, without requiring a full page reload or re-login.
   */
  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      updateUser,
    }),
    [user, isLoading, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
