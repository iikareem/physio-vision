"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "@/lib/api/auth";
import {
  getStoredToken,
  onUnauthorized,
  setStoredToken,
} from "@/lib/api/client";
import type { User } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthValue = {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      setStoredToken(null);
      setToken(null);
      setUser(null);
      setStatus("anonymous");
    });
  }, []);

  useEffect(() => {
    const existing = getStoredToken();
    if (!existing) {
      setStatus("anonymous");
      return;
    }

    let cancelled = false;
    setToken(existing);
    authApi
      .getMe(existing)
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setStoredToken(null);
        setToken(null);
        setUser(null);
        setStatus("anonymous");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setStatus("authenticated");
  }, []);

  const value = useMemo(
    () => ({ status, user, token, login, logout }),
    [status, user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
