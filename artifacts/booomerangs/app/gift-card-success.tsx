import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  Platform,
  View,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";
import { formatPrice } from "@/lib/types";

interface GiftCardData {
  code: string;
  amount: number;
  recipientEmail?: string;
}

export default function GiftCardSuccessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [giftCards, setGiftCards] = useState<GiftCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      api
        .get(`/gift-cards/batch/${id}`)
        .then((res) => {
          if (res.data?.giftCards?.length > 0) {
            setGiftCards(
              res.data.giftCards.map((gc: any) => ({
                code: gc.code,
                amount: gc.amount,
                recipientEmail: gc.recipientEmail,
              }))
            );
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    if (Platform.OS === "android") {
      ToastAndroid.show("Код скопирован", ToastAndroid.SHORT);
    } else {
      Alert.alert("Скопировано", "Код сертификата скопирован в буфер обмена");
    }
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.iconWrap, { backgroundColor: "#22c55e20" }]}>
        <Feather name="check-circle" size={64} color="#22c55e" />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Оплата прошла успешно!</Text>

      {loading ? (
        <ActivityIndicator color={colors.foreground} size="large" style={{ marginTop: 24 }} />
      ) : giftCards.length > 0 ? (
        <>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {giftCards.length === 1
              ? "Ваш подарочный сертификат готов к использованию"
              : `Ваши ${giftCards.length} сертификата готовы к использованию`}
          </Text>

          <View style={styles.cardsWrap}>
            {giftCards.map((gc, idx) => (
              <View key={gc.code} style={[styles.cardBlock, { backgroundColor: colors.card, borderColor: "#22c55e40" }]}>
                <View style={styles.cardBlockHeader}>
                  <Feather name="gift" size={18} color="#22c55e" />
                  <Text style={[styles.cardBlockTitle, { color: colors.foreground }]}>
                    Сертификат {giftCards.length > 1 ? `#${idx + 1} · ` : "· "}
                    {formatPrice(gc.amount)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => copyCode(gc.code)}
                  style={[styles.codeRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Text style={[styles.code, { color: colors.foreground }]}>{gc.code}</Text>
                  <Feather
                    name={copiedCode === gc.code ? "check" : "copy"}
                    size={18}
                    color={copiedCode === gc.code ? "#22c55e" : colors.mutedForeground}
                  />
                </Pressable>
                {gc.recipientEmail && (
                  <Text style={[styles.sentTo, { color: colors.mutedForeground }]}>
                    Отправлен на: {gc.recipientEmail}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View style={[styles.howToUse, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.howTitle, { color: colors.foreground }]}>Как использовать:</Text>
            {[
              "Добавьте товары в корзину",
              "На странице оформления заказа введите код сертификата",
              "Сумма сертификата будет вычтена из стоимости заказа",
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={[styles.stepNum, { color: colors.mutedForeground }]}>{i + 1}.</Text>
                <Text style={[styles.stepText, { color: colors.mutedForeground }]}>{step}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Подарочный сертификат успешно оплачен. Информация отправлена на вашу почту.
        </Text>
      )}

      <Pressable
        style={[styles.btn, { backgroundColor: colors.foreground }]}
        onPress={() => router.replace("/")}
      >
        <Text style={[styles.btnText, { color: colors.background }]}>Продолжить покупки</Text>
      </Pressable>
      <Pressable
        style={[styles.btnOutline, { borderColor: colors.border }]}
        onPress={() => router.replace("/gift-cards" as any)}
      >
        <Text style={[styles.btnOutlineText, { color: colors.foreground }]}>Купить ещё сертификат</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", padding: 24, gap: 16 },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginBottom: 8, marginTop: 24 },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  cardsWrap: { width: "100%", gap: 12 },
  cardBlock: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 10, width: "100%" },
  cardBlockHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardBlockTitle: { fontSize: 15, fontWeight: "700" },
  codeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  code: { fontSize: 20, fontWeight: "800", letterSpacing: 3, fontVariant: ["tabular-nums"] },
  sentTo: { fontSize: 12 },
  howToUse: { width: "100%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  howTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  stepRow: { flexDirection: "row", gap: 8 },
  stepNum: { fontSize: 13, fontWeight: "700" },
  stepText: { fontSize: 13, flex: 1, lineHeight: 18 },
  btn: { width: "100%", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: "700" },
  btnOutline: { width: "100%", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  btnOutlineText: { fontSize: 16, fontWeight: "600" },
});
