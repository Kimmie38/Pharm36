import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const handleExpired = useCallback(() => setUser(null), []);

  useEffect(() => {
    let active = true;
    setUnauthorizedHandler(handleExpired);
    (async () => {
      try {
        const result = await api.get('me');
        if (active) setUser(result.user || null);
      } catch {
        await setAuthToken(null);
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
      setUnauthorizedHandler(undefined);
    };
  }, [handleExpired]);

  const acceptSession = useCallback(async (result) => {
    await setAuthToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const login = useCallback(async (identifier, password) => {
    const result = await api.post('auth/login', { identifier, password }, { auth: false });
    return acceptSession(result);
  }, [acceptSession]);

  const register = useCallback(async (payload) => {
    const result = await api.post('auth/register', payload, { auth: false });
    return acceptSession(result);
  }, [acceptSession]);

  const logout = useCallback(async () => {
    await setAuthToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const result = await api.get('me');
    setUser(result.user || null);
    return result.user;
  }, []);

  const value = useMemo(() => ({ user, ready, login, register, logout, refreshUser, setUser }), [
    user, ready, login, register, logout, refreshUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
