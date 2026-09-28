import { useCallback, useEffect, useState } from 'react';
import {
  getToken,
  getUser,
  setAuth,
  clearAuth,
  login as apiLogin,
  register as apiRegister,
  googleLogin as apiGoogleLogin,
} from '../services/authApi.js';

// Module-level listener set so every useAuth() instance (e.g. AuthPage and
// ChatPage) stays in sync when one of them logs in / out.
const listeners = new Set();
const emitAuthChange = () => listeners.forEach((fn) => fn());

const readAuth = () => ({ token: getToken(), user: getUser() });

/**
 * Auth state hook. Initial state is read from localStorage ('dp_token' /
 * 'dp_user'); login/register persist via setAuth and update every mounted
 * instance, logout clears both.
 */
export function useAuth() {
  const [auth, setAuthState] = useState(readAuth);

  useEffect(() => {
    const sync = () => setAuthState(readAuth());
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await apiLogin(email, password);
    setAuth(token, user);
    setAuthState({ token, user });
    emitAuthChange();
    return { token, user };
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { token, user } = await apiRegister(name, email, password);
    setAuth(token, user);
    setAuthState({ token, user });
    emitAuthChange();
    return { token, user };
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const { token, user } = await apiGoogleLogin(credential);
    setAuth(token, user);
    setAuthState({ token, user });
    emitAuthChange();
    return { token, user };
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuthState({ token: null, user: null });
    emitAuthChange();
  }, []);

  return { user: auth.user, token: auth.token, login, register, googleLogin, logout };
}
