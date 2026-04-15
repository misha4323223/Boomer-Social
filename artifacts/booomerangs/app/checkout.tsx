import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";
import { formatPrice } from "@/lib/types";

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, sessionId, refetch } = useCart();
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const total = items.reduce((sum, item) => {
    return sum + (item.product?.price ?? 0) * item.quantity;
  }, 0);

  const handleOrder = async () => {
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setError("Заполните все поля");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/orders", {
        sessionId,
        customerName,
        phone,
        address,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          price: i.product?.price ?? 0,
        })),
        totalAmount: total,
      });
      setSuccess(true);
      await refetch();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Ошибка при оформлении заказа");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <View style={[styles.successIcon, { backgroundColor: "#22c55e20" }]}>
          <Feather name="check-circle" size={56} color="#22c55e" />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Заказ оформлен!</Text>
        <Text style={[styles.successText, { color: colors.mutedForeground }]}>
          Спасибо за покупку. Мы свяжемся с вами для подтверждения.
        </Text>
        <Pressable
          style={[styles.homeBtn, { backgroundColor: colors.foreground }]}
          onPress={() => router.replace("/(tabs)/")}
        >
          <Text style={[styles.homeBtnText, { color: colors.background }]}>
            На главную
          </Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Корзина пуста
        </Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.foreground }]}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        Данные получателя
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Имя</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Ваше имя"
          placeholderTextColor={colors.mutedForeground}
          value={customerName}
          onChangeText={setCustomerName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Телефон</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="+7 (___) ___-__-__"
          placeholderTextColor={colors.mutedForeground}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Адрес доставки</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Город, улица, дом, квартира"
          placeholderTextColor={colors.mutedForeground}
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          Состав заказа
        </Text>
        {items.map((item) => (
          <View key={item.id} style={styles.summaryRow}>
            <Text style={[styles.summaryItem, { color: colors.foreground }]} numberOfLines={1}>
              {item.product?.name ?? "Товар"} × {item.quantity}
            </Text>
            <Text style={[styles.summaryPrice, { color: colors.foreground }]}>
              {formatPrice((item.product?.price ?? 0) * item.quantity)}
            </Text>
          </View>
        ))}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryRow}>
          <Text style={[styles.totalLabel, { color: colors.foreground }]}>Итого</Text>
          <Text style={[styles.totalAmount, { color: colors.foreground }]}>
            {formatPrice(total)}
          </Text>
        </View>
      </View>

      {error && (
        <Text style={[styles.errorText, { color: "#ff3b30" }]}>{error}</Text>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.orderBtn,
          { backgroundColor: colors.foreground, opacity: pressed || submitting ? 0.75 : 1 },
        ]}
        onPress={handleOrder}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={[styles.orderBtnText, { color: colors.background }]}>
            Подтвердить заказ
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: -4,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "500" },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 80,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  summaryItem: {
    flex: 1,
    fontSize: 14,
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "800",
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
  orderBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  orderBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 16,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  successText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  homeBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
