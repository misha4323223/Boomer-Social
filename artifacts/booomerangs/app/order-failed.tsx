import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function OrderFailedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 32 }]}>
      <View style={[styles.iconWrap, { backgroundColor: "#ff3b3020" }]}>
        <Feather name="x-circle" size={64} color="#ff3b30" />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Оплата не прошла</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {orderId
          ? `К сожалению, оплата заказа #${orderId} не была завершена.`
          : "К сожалению, оплата не была завершена."}
        {"\n\n"}Деньги не списаны с карты. Попробуйте оформить заказ снова или выберите другой способ оплаты.
      </Text>

      <View style={[styles.reasons, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.reasonsTitle, { color: colors.foreground }]}>Возможные причины:</Text>
        {[
          "Недостаточно средств на карте",
          "Карта заблокирована банком",
          "Превышен лимит на операции",
          "Оплата была отменена",
        ].map((reason) => (
          <View key={reason} style={styles.reasonRow}>
            <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
            <Text style={[styles.reasonText, { color: colors.mutedForeground }]}>{reason}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.btn, { backgroundColor: colors.foreground }]}
        onPress={() => router.replace("/(tabs)/cart" as any)}
      >
        <Text style={[styles.btnText, { color: colors.background }]}>Вернуться в корзину</Text>
      </Pressable>
      <Pressable
        style={[styles.btnOutline, { borderColor: colors.border }]}
        onPress={() => router.replace("/")}
      >
        <Text style={[styles.btnOutlineText, { color: colors.foreground }]}>На главную</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  reasons: { width: "100%", borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  reasonsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  reasonText: { fontSize: 13, flex: 1, lineHeight: 18 },
  btn: { width: "100%", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: "700" },
  btnOutline: { width: "100%", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  btnOutlineText: { fontSize: 16, fontWeight: "600" },
});
