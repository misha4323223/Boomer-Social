import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FEATURES = [
  {
    icon: "box" as const,
    title: "Оригинальный продукт",
    text: "Авторские принты и смелые дизайны, созданные командой бренда.",
  },
  {
    icon: "users" as const,
    title: "Живая аудитория",
    text: "Бренд с активным сообществом в соцсетях и лояльными покупателями.",
  },
  {
    icon: "map-pin" as const,
    title: "Российское производство",
    text: "Делаем в России. Стабильные сроки и контроль качества на каждом этапе.",
  },
];

export default function WholesaleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Оптовым клиентам</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Работаем с партнёрами
          </Text>
          <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
            Сотрудничаем с магазинами и шоурумами, которые ценят качественные вещи и авторский подход. Оптовые цены доступны в личном кабинете после регистрации.
          </Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Почему BOOOMERANGS</Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View
              key={f.title}
              style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: colors.background }]}>
                <Feather name={f.icon} size={20} color={colors.foreground} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.cta, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.ctaTitle, { color: colors.foreground }]}>Хотите стать партнёром?</Text>
          <Text style={[styles.ctaText, { color: colors.mutedForeground }]}>
            Зарегистрируйтесь и получите доступ к оптовым ценам — всё открыто в личном кабинете.
          </Text>
          <Pressable
            style={styles.ctaMainBtn}
            onPress={() => Linking.openURL("https://booomerangs.ru/wholesale/register")}
          >
            <Text style={styles.ctaMainBtnText}>Оптовый вход / Регистрация</Text>
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.orText, { color: colors.mutedForeground }]}>или напишите нам напрямую</Text>

          <Pressable
            style={styles.contactRow}
            onPress={() => Linking.openURL("mailto:info@booomerangs.ru?subject=Оптовое сотрудничество")}
          >
            <Feather name="mail" size={16} color={colors.mutedForeground} />
            <Text style={[styles.contactText, { color: colors.foreground }]}>info@booomerangs.ru</Text>
          </Pressable>

          <Pressable
            style={styles.contactRow}
            onPress={() => Linking.openURL("tel:+79606000047")}
          >
            <Feather name="phone" size={16} color={colors.mutedForeground} />
            <Text style={[styles.contactText, { color: colors.foreground }]}>+7 (960) 600-00-47</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, alignItems: "flex-start" },
  title: { fontSize: 17, fontWeight: "700" },
  hero: { padding: 20, paddingBottom: 4 },
  heroTitle: { fontSize: 24, fontWeight: "800", lineHeight: 32, marginBottom: 10 },
  heroText: { fontSize: 14, lineHeight: 22 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  features: {
    paddingHorizontal: 16,
    gap: 10,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureTextWrap: { flex: 1, gap: 4 },
  featureTitle: { fontSize: 14, fontWeight: "700" },
  featureText: { fontSize: 13, lineHeight: 19 },
  cta: {
    margin: 16,
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    alignItems: "center",
  },
  ctaTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  ctaText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  ctaMainBtn: {
    marginTop: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  ctaMainBtnText: { fontSize: 15, fontWeight: "700", color: "#000000" },
  divider: { width: "100%", height: 1, marginVertical: 4 },
  orText: { fontSize: 12 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { fontSize: 14 },
});
