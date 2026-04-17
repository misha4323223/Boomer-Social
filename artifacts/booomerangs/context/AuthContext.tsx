import React, { createContext, useContext, useEffect, useState } from "react";
import api, { clearSessionCookie, clearToken, storeToken } from "@/lib/api";
import { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  forgotPassword: async () => {},
  logout: async () => {},
  refetchUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetchUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data?.user ?? null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refetchUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/mobile-login", { email, password });
    const userData = res.data?.user ?? null;
    const token: string | undefined = res.data?.token;
    if (token) {
      await storeToken(token);
    }
    if (userData) {
      setUser(userData);
    } else {
      await refetchUser();
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post("/auth/mobile-register", { name, email, password });
    const userData = res.data?.user ?? null;
    const token: string | undefined = res.data?.token;
    if (token) {
      await storeToken(token);
    }
    if (userData) {
      setUser(userData);
    } else {
      await refetchUser();
    }
  };

  const forgotPassword = async (email: string) => {
    await api.post("/auth/forgot-password", { email });
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    await clearSessionCookie();
    await clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, forgotPassword, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
