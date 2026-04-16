import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import api from "@/lib/api";
import { formatPrice } from "@/lib/types";

const LOYALTY_TIERS = [
  { minSpent: 0, discount: 0, label: "Новый клиент" },
  { minSpent: 500000, discount: 3, label: "Постоянный" },
  { minSpent: 1000000, discount: 5, label: "Серебряный" },
  { minSpent: 3000000, discount: 7, label: "Золотой" },
  { minSpent: 5000000, discount: 10, label: "Платиновый" },
];

function getLoyaltyLabel(totalSpent: number): string {
  let label = LOYALTY_TIERS[0].label;
  for (const tier of LOYALTY_TIERS) {
    if (totalSpent >= tier.minSpent) label = tier.label;
  }
  return label;
}

function getNextTierSpend(totalSpent: number): { next: number; label: string } | null {
  for (const tier of LOYALTY_TIERS) {
    if (totalSpent < tier.minSpent) {
      return { next: tier.minSpent - totalSpent, label: tier.label };
    }
  }
  return null;
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading, login, register, logout, refetchUser } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.foreground} size="large" />
      </View>
    );
  }

  if (user) {
    const loyalty = user.loyaltyDiscount ?? 0;
    const spent = user.totalSpent ?? 0;
    const tierLabel = getLoyaltyLabel(spent);
    const nextTier = getNextTierSpend(spent);

    const handleSaveProfile = async () => {
      setSaving(true);
      try {
        await api.patch("/auth/profile", {
          name: editName.trim() || undefined,
          phone: editPhone.trim() || undefined,
        });
        await refetchUser();
        setEditMode(false);
      } catch (e: any) {
        Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось сохранить");
      } finally {
        setSaving(false);
      }
    };

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.profileContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.avatar, { backgroundColor: colors.card }]}>
          <Text style={[styles.avatarText, { color: colors.foreground }]}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {editMode ? (
          <View style={[styles.editCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Имя</Text>
            <TextInput
              style={[styles.editInput, { color: colors.foreground, borderColor: colors.border }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Ваше имя"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
            />
            <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Телефон</Text>
            <TextInput
              style={[styles.editInput, { color: colors.foreground, borderColor: colors.border }]}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+7 900 000 00 00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
            />
            <View style={styles.editActions}>
              <Pressable
                style={[styles.editSaveBtn, { backgroundColor: colors.foreground }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={[styles.editSaveText, { color: colors.background }]}>
                    Сохранить
                  </Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.editCancelBtn, { borderColor: colors.border }]}
                onPress={() => setEditMode(false)}
              >
                <Text style={[styles.editCancelText, { color: colors.mutedForeground }]}>
                  Отмена
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
            {user.phone ? (
              <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>{user.phone}</Text>
            ) : null}
            <Pressable
              onPress={() => {
                setEditName(user.name);
                setEditPhone(user.phone ?? "");
                setEditMode(true);
              }}
              style={styles.editProfileBtn}
            >
              <Feather name="edit-2" size={13} color={colors.mutedForeground} />
              <Text style={[styles.editProfileText, { color: colors.mutedForeground }]}>
                Редактировать
              </Text>
            </Pressable>
          </>
        )}

        {loyalty > 0 || spent > 0 ? (
          <View style={[styles.loyaltyCard, { backgroundColor: "#1c1033" }]}>
            <View style={styles.loyaltyHeader}>
              <Feather name="award" size={18} color="#a78bfa" />
              <Text style={styles.loyaltyTitle}>{tierLabel}</Text>
              {loyalty > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>−{loyalty}%</Text>
                </View>
              )}
            </View>
            {spent > 0 && (
              <Text style={styles.loyaltySpent}>
                Потрачено: {formatPrice(spent)}
              </Text>
            )}
            {nextTier && (
              <Text style={styles.loyaltyNext}>
                До уровня «{nextTier.label}»: ещё {formatPrice(nextTier.next)}
              </Text>
            )}
          </View>
        ) : null}

        <View style={styles.menuSection}>
          <Pressable
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => router.push("/orders" as any)}
          >
            <Feather name="package" size={20} color={colors.foreground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Мои заказы</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => router.push("/(tabs)/favorites" as any)}
          >
            <Feather name="heart" size={20} color={colors.foreground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Избранное</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => router.push("/chat" as any)}
          >
            <Feather name="message-circle" size={20} color={colors.foreground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Написать нам</Text>
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
        setError("Регистрация прошла успешно! Проверьте почту для подтверждения email.");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ??
        e?.response?.data?.message ??
        "Произошла ошибка. Попробуйте снова.";
      setError(msg);
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
          <Text
            style={[
              styles.errorText,
              { color: error.startsWith("Регистрация") ? "#10b981" : "#ff3b30" },
            ]}
          >
            {error}
          </Text>
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

        <Pressable
          onPress={() => router.push("/chat" as any)}
          style={[styles.chatLink]}
        >
          <Feather name="message-circle" size={16} color={colors.mutedForeground} />
          <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
            Написать нам без регистрации
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
  },
  userPhone: {
    fontSize: 14,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  editProfileText: {
    fontSize: 13,
  },
  editCard: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  editSaveBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  editSaveText: {
    fontSize: 15,
    fontWeight: "700",
  },
  editCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  editCancelText: {
    fontSize: 15,
  },
  loyaltyCard: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  loyaltyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loyaltyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#e9d5ff",
  },
  discountBadge: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  discountText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  loyaltySpent: {
    fontSize: 13,
    color: "#c4b5fd",
  },
  loyaltyNext: {
    fontSize: 12,
    color: "#a78bfa",
  },
  menuSection: {
    width: "100%",
    gap: 8,
    marginTop: 8,
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
  chatLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
});
