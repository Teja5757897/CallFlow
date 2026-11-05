import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  function login(next) { setUser(next); }

  async function logout() {
    try { await api.logout(); } finally { setUser(null); }
  }

  return <AuthContext.Provider value={{ user, login, logout, checking }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
