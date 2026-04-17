import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BASE_URL = "https://booomerangs.ru/api";
const COOKIE_KEY = "bmg_session_cookie";
export const TOKEN_KEY = "bmg_jwt_token";

const PROXY_BASE =
  process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
    : "http://localhost:8080/api";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const proxyApi = axios.create({
  baseURL: PROXY_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS !== "web") {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } else {
      return typeof window !== "undefined"
        ? window.localStorage?.getItem(TOKEN_KEY) ?? null
        : null;
    }
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  try {
    if (Platform.OS !== "web") {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      if (typeof window !== "undefined") {
        window.localStorage?.setItem(TOKEN_KEY, token);
      }
    }
  } catch {}
}

export async function clearToken(): Promise<void> {
  try {
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      if (typeof window !== "undefined") {
        window.localStorage?.removeItem(TOKEN_KEY);
      }
    }
  } catch {}
}

api.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

proxyApi.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

if (Platform.OS !== "web") {
  api.interceptors.request.use(async (config) => {
    try {
      const cookie = await SecureStore.getItemAsync(COOKIE_KEY);
      if (cookie) {
        config.headers = config.headers ?? {};
        config.headers["Cookie"] = cookie;
      }
    } catch {}
    return config;
  });

  api.interceptors.response.use(
    async (response) => {
      try {
        const raw = response.headers["set-cookie"];
        if (raw) {
          const headers = Array.isArray(raw) ? raw : [raw];
          const parts: string[] = [];
          for (const h of headers) {
            const nameVal = h.split(";")[0].trim();
            if (nameVal) parts.push(nameVal);
          }
          if (parts.length > 0) {
            await SecureStore.setItemAsync(COOKIE_KEY, parts.join("; "));
          }
        }
      } catch {}
      return response;
    },
    async (error) => {
      return Promise.reject(error);
    }
  );
}

export async function clearSessionCookie() {
  if (Platform.OS !== "web") {
    try {
      await SecureStore.deleteItemAsync(COOKIE_KEY);
    } catch {}
  }
}

export default api;
