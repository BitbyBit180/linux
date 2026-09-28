import { useCallback, useEffect, useState } from 'react';
import {
  getToken,
  getUser,
  setAuth,
  clearAuth,
  login as apiLogin,
  register as apiRegister,
  verifyRegistration as apiVerifyRegistration,
  googleLogin as apiGoogleLogin,
} from '../services/authApi.js';

// Module-level listener set so every useAuth() instance (e.g. AuthPage and
// ChatPage) stays in sync when one of them logs in / out.
const listeners = new Set();
const emitAuthChange = () => listeners.forEach((fn) => fn());

const readAuth = () => ({ token: getToken(), user: getUser() });

// Shared sign-in finalizer: persist + sync every mounted instance.
const useSignIn = (setAuthState) =>
  useCallback(
    async (fn, ...args) => {
      const { token, user } = await fn(...args);
      setAuth(token, user);
      setAuthState({ token, user });
      emitAuthChange();
      return { token, user };
    },
    [setAuthState]
  );

/**
 * Auth state hook. Initial state is read from localStorage ('dp_token' /
 * 'dp_user'). register() only SENDS the signup OTP (no session) — call
 * verifyRegistration() with the code to complete signup and sign in.
 * googleLogin() signs in (or links + signs in) via Sign in with Google.
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

  const signIn = useSignIn(setAuthState);

  const login = useCallback((email, password) => signIn(apiLogin, email, password), [signIn]);

  const register = useCallback(async (name, email, password) => {
    // No session yet — returns { message, data: { email } }; the OTP view
    // follows, then verifyRegistration() signs in.
    const json = await apiRegister(name, email, password);
    return json;
  }, []);

  const verifyRegistration = useCallback(
    (email, token) => signIn(apiVerifyRegistration, email, token),
    [signIn]
  );

  const googleLogin = useCallback((credential) => signIn(apiGoogleLogin, credential), [signIn]);

  const logout = useCallback(() => {
    clearAuth();
    setAuthState({ token: null, user: null });
    emitAuthChange();
  }, []);

  return { user: auth.user, token: auth.token, login, register, verifyRegistration, googleLogin, logout };
}
