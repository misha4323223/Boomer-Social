import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SESSION_KEY = "booomerangs_session_id";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export async function getOrCreateSessionId(): Promise<string> {
  if (Platform.OS === "web") {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }
  let id = await SecureStore.getItemAsync(SESSION_KEY);
  if (!id) {
    id = generateId();
    await SecureStore.setItemAsync(SESSION_KEY, id);
  }
  return id;
}

export async function setSessionId(id: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(SESSION_KEY, id);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, id);
}

export async function clearSessionId(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
