import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function OrderSuccessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 32 }]}>
      <View style={[styles.iconWrap, { backgroundColor: "#22c55e20" }]}>
        <Feather name="check-circle" size={64} color="#22c55e" />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Заказ оформлен!</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Спасибо за покупку. Мы обработаем ваш заказ и свяжемся с вами для подтверждения.
      </Text>
      <Pressable
        style={[styles.btn, { backgroundColor: colors.foreground }]}
        onPress={() => router.replace("/")}
      >
        <Text style={[styles.btnText, { color: colors.background }]}>На главную</Text>
      </Pressable>
      <Pressable
        style={[styles.btnOutline, { borderColor: colors.border }]}
        onPress={() => router.replace("/orders" as any)}
      >
        <Text style={[styles.btnOutlineText, { color: colors.foreground }]}>Мои заказы</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  iconWrap: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  btn: { width: "100%", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: "700" },
  btnOutline: { width: "100%", height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  btnOutlineText: { fontSize: 16, fontWeight: "600" },
});
