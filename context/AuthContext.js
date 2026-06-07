import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  signUpUser,
} from '../utils/authService';

const AuthContext = createContext({
  user: null,
  isLoggedIn: false,
  authLoaded: false,
  refreshAuth: async () => {},
  login: async () => ({ ok: false }),
  signup: async () => ({ ok: false }),
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const refreshAuth = useCallback(async () => {
    const profile = await getCurrentUser();
    setUser(profile);
    setAuthLoaded(true);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async ({ email, password }) => {
    const result = await loginUser({ email, password });
    if (result.ok) {
      setUser(result.user);
    }
    return result;
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    const result = await signUpUser({ name, email, password });
    if (result.ok) {
      setUser(result.user);
    }
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user),
        authLoaded,
        refreshAuth,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
