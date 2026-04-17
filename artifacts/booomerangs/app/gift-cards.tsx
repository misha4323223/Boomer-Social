import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
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
import api from "@/lib/api";
import { formatPrice } from "@/lib/types";

const AMOUNTS = [
  { value: 50000, label: "500 ₽" },
  { value: 100000, label: "1 000 ₽" },
  { value: 200000, label: "2 000 ₽" },
  { value: 300000, label: "3 000 ₽" },
  { value: 500000, label: "5 000 ₽" },
];

const THEMES = [
  { id: "black", name: "Midnight", colors: ["#0a0a0a", "#1a1a2e", "#16213e"], accent: "#818cf8" },
  { id: "red", name: "Crimson", colors: ["#7f1d1d", "#b91c1c", "#450a0a"], accent: "#fca5a5" },
  { id: "gold", name: "Gold", colors: ["#78350f", "#d97706", "#92400e"], accent: "#fde68a" },
  { id: "purple", name: "Velvet", colors: ["#2e1065", "#6d28d9", "#1e1b4b"], accent: "#c4b5fd" },
  { id: "emerald", name: "Forest", colors: ["#022c22", "#065f46", "#064e3b"], accent: "#6ee7b7" },
];

function getInstallmentDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
  for (let i = 0; i < 4; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i * 14);
    dates.push(fmt.format(d));
  }
  return dates;
}

export default function GiftCardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selectedAmount, setSelectedAmount] = useState<number>(AMOUNTS[1].value);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [quantity, setQuantity] = useState(1);

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState(user?.name ?? "");
  const [message, setMessage] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"yookassa" | "tbank">("yookassa");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalAmount = useCustom
    ? Math.round((parseFloat(customAmount.replace(",", ".")) || 0) * 100)
    : selectedAmount;

  const total = finalAmount * quantity;

  const handleBuy = async () => {
    if (finalAmount < 50000) {
      setError("Минимальная сумма сертификата — 500 ₽");
      return;
    }
    if (finalAmount > 1000000) {
      setError("Максимальная сумма сертификата — 10 000 ₽");
      return;
    }
    if (!senderName.trim()) {
      setError("Введите имя отправителя");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const returnUrl = "https://booomerangs.ru/gift-cards/success";
      const res = await api.post("/gift-cards", {
        amount: finalAmount,
        quantity,
        theme: selectedTheme.id,
        recipientName: recipientName.trim() || undefined,
        recipientEmail: recipientEmail.trim() || undefined,
        senderName: senderName.trim(),
        message: message.trim() || undefined,
        paymentMethod,
        returnUrl,
      });

      const paymentUrl =
        res.data?.paymentUrl ??
        res.data?.confirmationUrl ??
        res.data?.redirectUrl ??
        res.data?.confirmation?.confirmation_url;

      if (paymentUrl) {
        if (Platform.OS === "web") {
          window.open(paymentUrl, "_blank");
        } else {
          await WebBrowser.openBrowserAsync(paymentUrl);
        }
        router.replace("/gift-card-success" as any);
      } else {
        router.replace("/gift-card-success" as any);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Ошибка при создании сертификата. Попробуйте снова.");
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
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Подарочный сертификат</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Card Preview */}
        <View style={[styles.cardPreview, { backgroundColor: selectedTheme.colors[1] }]}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardBrand, { color: selectedTheme.accent }]}>BOOOMERANGS</Text>
            <Feather name="gift" size={22} color={selectedTheme.accent} />
          </View>
          <Text style={[styles.cardAmount, { color: "#fff" }]}>
            {finalAmount >= 50000 ? formatPrice(finalAmount) : "—"}
          </Text>
          <View style={styles.cardBottom}>
            <Text style={[styles.cardLabel, { color: "rgba(255,255,255,0.6)" }]}>Подарочный сертификат</Text>
            <Text style={[styles.cardTheme, { color: selectedTheme.accent }]}>{selectedTheme.name}</Text>
          </View>
        </View>

        {/* Theme Selection */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Дизайн карты</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themesRow}>
            {THEMES.map((theme) => (
              <Pressable
                key={theme.id}
                onPress={() => setSelectedTheme(theme)}
                style={[
                  styles.themeOption,
                  { backgroundColor: theme.colors[1] },
                  selectedTheme.id === theme.id && { borderColor: colors.foreground, borderWidth: 2 },
                ]}
              >
                <Text style={[styles.themeName, { color: theme.accent }]}>{theme.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Amount Selection */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Номинал</Text>
          <View style={styles.amountsGrid}>
            {AMOUNTS.map((a) => (
              <Pressable
                key={a.value}
                onPress={() => { setSelectedAmount(a.value); setUseCustom(false); }}
                style={[
                  styles.amountChip,
                  { borderColor: !useCustom && selectedAmount === a.value ? colors.foreground : colors.border },
                  !useCustom && selectedAmount === a.value && { backgroundColor: colors.foreground },
                ]}
              >
                <Text
                  style={[
                    styles.amountChipText,
                    { color: !useCustom && selectedAmount === a.value ? colors.background : colors.foreground },
                  ]}
                >
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.customRow}>
            <Pressable
              onPress={() => setUseCustom(!useCustom)}
              style={[
                styles.amountChip,
                { borderColor: useCustom ? colors.foreground : colors.border },
                useCustom && { backgroundColor: colors.foreground },
              ]}
            >
              <Text style={[styles.amountChipText, { color: useCustom ? colors.background : colors.foreground }]}>
                Своя сумма
              </Text>
            </Pressable>
            {useCustom && (
              <TextInput
                style={[styles.customInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Сумма в ₽"
                placeholderTextColor={colors.mutedForeground}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="numeric"
                autoFocus
              />
            )}
          </View>
        </View>

        {/* Quantity */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Количество</Text>
          <View style={styles.qtyRow}>
            <Pressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              style={[styles.qtyBtn, { borderColor: colors.border }]}
            >
              <Feather name="minus" size={18} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.qtyValue, { color: colors.foreground }]}>{quantity}</Text>
            <Pressable
              onPress={() => setQuantity((q) => Math.min(10, q + 1))}
              style={[styles.qtyBtn, { borderColor: colors.border }]}
            >
              <Feather name="plus" size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        {/* Recipient Details */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Данные получателя</Text>
          <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>
            Необязательно — для персонализации и отправки на email
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Имя получателя</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Имя"
              placeholderTextColor={colors.mutedForeground}
              value={recipientName}
              onChangeText={setRecipientName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email получателя</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="email@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Имя отправителя *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Ваше имя"
              placeholderTextColor={colors.mutedForeground}
              value={senderName}
              onChangeText={setSenderName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Личное сообщение</Text>
            <TextInput
              style={[styles.input, styles.textarea, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Поздравление или пожелание..."
              placeholderTextColor={colors.mutedForeground}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Способ оплаты</Text>
          {[
            { id: "yookassa", name: "ЮKassa", desc: "Банковские карты, СБП, ЮMoney" },
            { id: "tbank", name: "Т-Банк", desc: "Оплата картой, Т-Pay" },
          ].map((method) => (
            <Pressable
              key={method.id}
              style={[styles.radioRow, { borderColor: paymentMethod === method.id ? colors.foreground : colors.border }]}
              onPress={() => setPaymentMethod(method.id as "yookassa" | "tbank")}
            >
              <View style={[styles.radio, paymentMethod === method.id && { backgroundColor: colors.foreground, borderColor: colors.foreground }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.radioLabel, { color: colors.foreground }]}>{method.name}</Text>
                <Text style={[styles.radioSub, { color: colors.mutedForeground }]}>{method.desc}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Total */}
        {total > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                {quantity > 1 ? `${quantity} × ${formatPrice(finalAmount)}` : "Номинал"}
              </Text>
              <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatPrice(total)}</Text>
            </View>
          </View>
        )}

        {/* How to use info */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Как использовать</Text>
          {[
            { icon: "shopping-bag", text: "Добавьте товары в корзину" },
            { icon: "tag", text: "Введите код сертификата при оформлении заказа" },
            { icon: "check-circle", text: "Сумма будет вычтена из стоимости заказа" },
          ].map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: colors.foreground }]}>
                <Text style={[styles.stepNumText, { color: colors.background }]}>{i + 1}</Text>
              </View>
              <Feather name={step.icon as any} size={16} color={colors.mutedForeground} />
              <Text style={[styles.stepText, { color: colors.mutedForeground }]}>{step.text}</Text>
            </View>
          ))}
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.buyBtn,
            { backgroundColor: colors.foreground, opacity: pressed || submitting || total === 0 ? 0.7 : 1 },
          ]}
          onPress={handleBuy}
          disabled={submitting || total === 0}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <View style={styles.buyBtnInner}>
              <Feather name="gift" size={20} color={colors.background} />
              <Text style={[styles.buyBtnText, { color: colors.background }]}>
                {total > 0 ? `Купить · ${formatPrice(total)}` : "Выберите номинал"}
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 12, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 18, fontWeight: "700" },

  cardPreview: { marginHorizontal: 16, borderRadius: 20, padding: 24, gap: 12, minHeight: 160, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardBrand: { fontSize: 13, fontWeight: "800", letterSpacing: 2 },
  cardAmount: { fontSize: 36, fontWeight: "800" },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cardLabel: { fontSize: 12 },
  cardTheme: { fontSize: 12, fontWeight: "600" },

  section: { marginHorizontal: 16, borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  fieldHint: { fontSize: 12, marginTop: -4 },

  themesRow: { gap: 10, paddingVertical: 4 },
  themeOption: { width: 80, height: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  themeName: { fontSize: 11, fontWeight: "700" },

  amountsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amountChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  amountChipText: { fontSize: 14, fontWeight: "600" },
  customRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  customInput: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 15 },

  qtyRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  qtyValue: { fontSize: 22, fontWeight: "700", minWidth: 32, textAlign: "center" },

  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: "500" },
  input: { height: 48, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, borderWidth: 1 },
  textarea: { height: 80, paddingTop: 12 },

  radioRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 10, borderWidth: 1.5 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#666", backgroundColor: "transparent" },
  radioLabel: { fontSize: 14, fontWeight: "600" },
  radioSub: { fontSize: 12, marginTop: 2 },

  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 18, fontWeight: "800" },

  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 11, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18 },

  errorText: { color: "#ff3b30", fontSize: 13, textAlign: "center", marginHorizontal: 16 },
  buyBtn: { marginHorizontal: 16, height: 58, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  buyBtnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  buyBtnText: { fontSize: 17, fontWeight: "700" },
});
