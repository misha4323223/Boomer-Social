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
}

const MESSAGES_KEY = "booomerangs_chat_messages";
const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    AsyncStorage.getItem(MESSAGES_KEY).then((data) => {
      if (data) setMessages(JSON.parse(data));
    });
  }, []);

  const saveMessages = (msgs: Message[]) => {
    setMessages(msgs);
    AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const msg: Message = {
      id: Date.now().toString(),
      text,
      fromUser: true,
      timestamp: Date.now(),
    };
    const updated = [...messages, msg];
    saveMessages(updated);

    try {
      const userName = user?.name ?? "Гость";
      const userEmail = user?.email ?? "не авторизован";
      await fetch(`${API_BASE}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, userName, userEmail }),
      });
    } catch {
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    saveMessages([]);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: "#000000" }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="message-circle" size={56} color="#444444" />
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
          contentContainerStyle={[
            styles.messageList,
            { paddingBottom: 16 },
          ]}
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
                <Text style={styles.supportLabel}>Поддержка</Text>
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
                  { color: item.fromUser ? "#00000066" : "#ffffff66" },
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
          {
            borderTopColor: "#222222",
            paddingBottom: insets.bottom + 8,
          },
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666666",
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
    borderRadius: 16,
    gap: 4,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#ffffff",
    borderBottomRightRadius: 4,
  },
  bubbleSupport: {
    alignSelf: "flex-start",
    backgroundColor: "#1a1a1a",
    borderBottomLeftRadius: 4,
  },
  supportLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#888888",
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
