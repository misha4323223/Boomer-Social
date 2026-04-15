import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading, login, register, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.foreground} size="large" />
      </View>
    );
  }

  if (user) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.profileContent, { paddingBottom: insets.bottom + 90 }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.card }]}>
          <Text style={[styles.avatarText, { color: colors.foreground }]}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
        <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.email}</Text>

        <View style={styles.menuSection}>
          <Pressable
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => router.push("/orders" as any)}
          >
            <Feather name="package" size={20} color={colors.foreground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Мои заказы</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={logout}
        >
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
          <Text style={[styles.logoutText, { color: colors.mutedForeground }]}>Выйти</Text>
        </Pressable>
      </ScrollView>
    );
  }

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Произошла ошибка. Попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.authContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.authTitle, { color: colors.foreground }]}>
          {mode === "login" ? "Войти" : "Регистрация"}
        </Text>

        {mode === "register" && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Имя</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
              ]}
              placeholder="Ваше имя"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
            ]}
            placeholder="email@example.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Пароль</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
            ]}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error && (
          <Text style={[styles.errorText, { color: "#ff3b30" }]}>{error}</Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: colors.foreground, opacity: pressed || submitting ? 0.75 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.submitText, { color: colors.background }]}>
              {mode === "login" ? "Войти" : "Зарегистрироваться"}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
          style={styles.switchMode}
        >
          <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
            {mode === "login"
              ? "Нет аккаунта? Зарегистрироваться"
              : "Уже есть аккаунт? Войти"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileContent: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 16,
  },
  menuSection: {
    width: "100%",
    gap: 8,
    marginTop: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 24,
  },
  logoutText: {
    fontSize: 15,
  },
  authContent: {
    padding: 24,
    gap: 16,
    flexGrow: 1,
    justifyContent: "center",
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
  },
  switchMode: {
    alignItems: "center",
    marginTop: 4,
  },
  switchText: {
    fontSize: 14,
  },
});
