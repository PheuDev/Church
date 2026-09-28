// ============================================================
// Authentification — contexte global + gestion de session
// ============================================================
import React, { createContext, useContext, useState } from 'react';
import {
  TOKEN_KEY, USER_KEY, api, setUnauthorizedHandler,
  setPasswordChangeRequiredHandler, getErrorMessage,
} from '../api/client.js';

const AuthContext = createContext(null);

function readSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (token && raw) return { token, user: JSON.parse(raw) };
  } catch { /* session corrompue */ }
  return null;
}

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(readSession);

  function save(session) {
    if (session) {
      localStorage.setItem(TOKEN_KEY, session.token);
      localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    setSessionState(session);
  }

  setUnauthorizedHandler(() => save(null));

  // Le serveur refuse toute route tant que le mot de passe initial n'est pas
  // changé : on répercute l'info dans la session pour déclencher la redirection.
  setPasswordChangeRequiredHandler(() => {
    setSessionState((prev) => {
      if (!prev || prev.user.mustChangePassword) return prev;
      const user = { ...prev.user, mustChangePassword: true };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { ...prev, user };
    });
  });

  async function login(email, password) {
    let res;
    try {
      res = await api.post('/auth/login', { email, password });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
    const { token, user } = res.data;
    save({ token, user });
    return user;
  }

  async function changePassword(currentPassword, newPassword) {
    let res;
    try {
      res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    }
    save({ token: res.data.token, user: res.data.user });
    return res.data.user;
  }

  function logout() {
    save(null);
  }

  const value = {
    session,
    token: session?.token,
    user: session?.user,
    role: session?.user?.role,
    churchId: session?.user?.churchId,
    mustChangePassword: session?.user?.mustChangePassword,
    isAdmin: session?.user?.role === 'ADMIN',
    login,
    changePassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider.');
  return ctx;
}