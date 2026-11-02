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
  ApiError,
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  onUnauthorized,
  setStoredToken,
  setStoredUser,
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

function isUnauthorized(err: unknown) {
  return err instanceof ApiError && err.status === 401;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      clearStoredSession();
      setToken(null);
      setUser(null);
      setStatus("anonymous");
    });
  }, []);

  useEffect(() => {
    const existing = getStoredToken();
    const cachedUser = getStoredUser<User>();
    if (!existing) {
      clearStoredSession();
      setStatus("anonymous");
      return;
    }

    let cancelled = false;
    setToken(existing);

    // Restore last known user immediately so a blip / cold start doesn't
    // bounce the therapist to the login screen.
    if (cachedUser) {
      setUser(cachedUser);
      setStatus("authenticated");
    }

    authApi
      .getMe(existing)
      .then((me) => {
        if (cancelled) return;
        setStoredUser(me);
        setUser(me);
        setStatus("authenticated");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Only drop the session when the token is actually rejected.
        // Network / API downtime must not force a re-login.
        if (isUnauthorized(err)) {
          clearStoredSession();
          setToken(null);
          setUser(null);
          setStatus("anonymous");
          return;
        }
        if (cachedUser) {
          setStatus("authenticated");
          return;
        }
        setUser({
          id: "offline",
          email: "",
          name: "Therapist",
          createdAt: "",
        });
        setStatus("authenticated");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setStoredToken(res.token);
    setStoredUser(res.user);
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
