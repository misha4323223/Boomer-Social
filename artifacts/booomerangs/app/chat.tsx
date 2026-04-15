import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  text: string;
  fromUser: boolean;
  timestamp: number;
  senderName?: string;
}

const SESSION_KEY = "booomerangs_chat_session_id";
const USER_NAME_KEY = "booomerangs_chat_user_name";
const MESSAGES_KEY = "booomerangs_chat_messages_v2";
const CHAT_API = "https://booomerangs.ru/api";
const POLL_INTERVAL_MS = 20000;

function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimestampRef = useRef<number>(0);

  const [step, setStep] = useState<"welcome" | "chat">("welcome");
  const [nameInput, setNameInput] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [nameLoading, setNameLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let sid = await AsyncStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = generateSessionId();
        await AsyncStorage.setItem(SESSION_KEY, sid);
      }
      setSessionId(sid);

      const storedName = user?.name ?? (await AsyncStorage.getItem(USER_NAME_KEY));
      if (storedName) {
        setUserName(storedName);
        setStep("chat");
      }

      const storedMessages = await AsyncStorage.getItem(MESSAGES_KEY);
      if (storedMessages) {
        const parsed: Message[] = JSON.parse(storedMessages);
        setMessages(parsed);
        if (parsed.length > 0) {
          lastTimestampRef.current = Math.max(...parsed.map((m) => m.timestamp));
        }
      }

      setNameLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (step === "chat" && sessionId) {
      fetchReplies(sessionId);
      pollRef.current = setInterval(() => fetchReplies(sessionId), POLL_INTERVAL_MS);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, sessionId]);

  const fetchReplies = async (sid: string) => {
    try {
      const since = lastTimestampRef.current > 0 ? lastTimestampRef.current + 1 : undefined;
      const url = since
        ? `${CHAT_API}/chat/messages/${sid}?since=${since}`
        : `${CHAT_API}/chat/messages/${sid}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const incoming: any[] = data.messages ?? [];
      if (incoming.length === 0) return;

      const newMsgs: Message[] = incoming.map((m: any) => ({
        id: m.messageId ?? String(m.timestamp),
        text: m.text,
        fromUser: m.sender === "client",
        timestamp: m.timestamp,
        senderName: m.sender === "admin" ? (m.userName || "Поддержка") : undefined,
      }));

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
        if (fresh.length === 0) return prev;
        const merged = [...prev, ...fresh].sort((a, b) => a.timestamp - b.timestamp);
        AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(merged));
        const maxTs = Math.max(...fresh.map((m) => m.timestamp));
        if (maxTs > lastTimestampRef.current) lastTimestampRef.current = maxTs;
        return merged;
      });
    } catch {}
  };

  const confirmName = async () => {
    const name = nameInput.trim();
    if (!name) return;
    await AsyncStorage.setItem(USER_NAME_KEY, name);
    setUserName(name);
    setStep("chat");
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !sessionId) return;
    setInput("");
    setSending(true);

    const msg: Message = {
      id: Date.now().toString(),
      text,
      fromUser: true,
      timestamp: Date.now(),
    };
    const updated = [...messages, msg];
    setMessages(updated);
    AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
    if (msg.timestamp > lastTimestampRef.current) lastTimestampRef.current = msg.timestamp;

    try {
      await fetch(`${CHAT_API}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text,
          userName: userName ?? user?.name ?? "Гость",
          userId: user?.id ? String(user.id) : undefined,
        }),
      });
    } catch {
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  if (nameLoading) {
    return (
      <View style={[styles.center, { backgroundColor: "#000000" }]}>
        <ActivityIndicator color="#ffffff" size="large" />
      </View>
    );
  }

  if (step === "welcome") {
    return (
      <KeyboardAvoidingView
        style={[styles.center, { backgroundColor: "#000000", paddingHorizontal: 32 }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.welcomeIcon}>
          <Feather name="message-circle" size={56} color="#ffffff" />
        </View>
        <Text style={styles.welcomeTitle}>Привет!</Text>
        <Text style={styles.welcomeSubtitle}>
          Как вас зовут? Это поможет нам обращаться к вам правильно.
        </Text>
        <TextInput
          style={styles.nameInput}
          placeholder="Ваше имя..."
          placeholderTextColor="#555555"
          value={nameInput}
          onChangeText={setNameInput}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={confirmName}
          maxLength={50}
        />
        <Pressable
          style={({ pressed }) => [
            styles.nameBtn,
            { opacity: pressed || !nameInput.trim() ? 0.5 : 1 },
          ]}
          onPress={confirmName}
          disabled={!nameInput.trim()}
        >
          <Text style={styles.nameBtnText}>Начать чат</Text>
        </Pressable>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: "#000000" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.chatHeader, { paddingTop: 12 }]}>
        <View style={styles.chatHeaderLeft}>
          <View style={styles.onlineDot} />
          <Text style={styles.chatHeaderTitle}>Поддержка BOOOMERANGS</Text>
        </View>
        <Text style={styles.chatHeaderSub}>Отвечаем в рабочее время</Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={48} color="#333333" />
          <Text style={styles.emptyTitle}>Чат поддержки</Text>
          <Text style={styles.emptyText}>
            Напишите нам — мы ответим как можно скорее.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messageList, { paddingBottom: 16 }]}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.fromUser ? styles.bubbleUser : styles.bubbleSupport,
              ]}
            >
              {!item.fromUser && (
                <Text style={styles.supportLabel}>
                  {item.senderName ?? "Поддержка"}
                </Text>
              )}
              <Text
                style={[
                  styles.bubbleText,
                  { color: item.fromUser ? "#000000" : "#ffffff" },
                ]}
              >
                {item.text}
              </Text>
              <Text
                style={[
                  styles.bubbleTime,
                  { color: item.fromUser ? "#00000066" : "#ffffff55" },
                ]}
              >
                {formatTime(item.timestamp)}
              </Text>
            </View>
          )}
        />
      )}

      <View
        style={[
          styles.inputRow,
          { borderTopColor: "#222222", paddingBottom: insets.bottom + 8 },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Сообщение..."
          placeholderTextColor="#666666"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            { opacity: pressed || sending || !input.trim() ? 0.5 : 1 },
          ]}
          onPress={sendMessage}
          disabled={sending || !input.trim()}
        >
          {sending ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <Feather name="send" size={18} color="#000000" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeIcon: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#888888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  nameInput: {
    width: "100%",
    backgroundColor: "#111111",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 14,
  },
  nameBtn: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  nameBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  chatHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  chatHeaderSub: {
    fontSize: 12,
    color: "#555555",
    marginTop: 2,
    marginLeft: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#555555",
    textAlign: "center",
    lineHeight: 22,
  },
  messageList: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 4,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#ffffff",
    borderBottomRightRadius: 4,
  },
  bubbleSupport: {
    alignSelf: "flex-start",
    backgroundColor: "#1c1c1c",
    borderBottomLeftRadius: 4,
  },
  supportLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  bubbleTime: {
    fontSize: 11,
    alignSelf: "flex-end",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    backgroundColor: "#000000",
  },
  input: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: "#ffffff",
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#222222",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
});
