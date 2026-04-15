import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BASE_URL = "https://booomerangs.ru/api";
const COOKIE_KEY = "bmg_session_cookie";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
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
