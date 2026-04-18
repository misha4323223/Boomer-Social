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

const BENEFITS = [
  { icon: "percent" as const, title: "Оптовые цены", text: "Специальные условия при заказе от 10 единиц товара" },
  { icon: "truck" as const, title: "Быстрая доставка", text: "Приоритетная обработка и отгрузка оптовых заказов" },
  { icon: "headphones" as const, title: "Персональный менеджер", text: "Выделенный менеджер для сопровождения вашего заказа" },
  { icon: "refresh-cw" as const, title: "Гибкий возврат", text: "Упрощённые условия возврата для оптовых партнёров" },
];

const CONDITIONS = [
  "Минимальный заказ — от 10 единиц одного артикула",
  "Скидка от 15% при заказе от 50 единиц",
  "Индивидуальные условия для крупных партнёров",
  "Возможна брендирование и упаковка под заказ",
  "Оплата по счёту для юридических лиц",
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

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Станьте партнёром{"\n"}BOOOMERANGS
          </Text>
          <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
            Предлагаем выгодные условия сотрудничества для магазинов, маркетплейсов и других партнёров.
          </Text>
        </View>

        {/* Преимущества */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Преимущества</Text>
        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={[styles.benefitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.background }]}>
                <Feather name={b.icon} size={20} color={colors.foreground} />
              </View>
              <Text style={[styles.benefitTitle, { color: colors.foreground }]}>{b.title}</Text>
              <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Условия */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Условия сотрудничества</Text>
        <View style={[styles.condCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {CONDITIONS.map((c) => (
            <View key={c} style={styles.condRow}>
              <Feather name="check-circle" size={16} color="#4ade80" />
              <Text style={[styles.condText, { color: colors.foreground }]}>{c}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={[styles.cta, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.ctaTitle, { color: colors.foreground }]}>Готовы начать?</Text>
          <Text style={[styles.ctaText, { color: colors.mutedForeground }]}>
            Свяжитесь с нами для получения прайс-листа и условий сотрудничества
          </Text>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => Linking.openURL("mailto:info@booomerangs.ru?subject=Оптовое сотрудничество")}
          >
            <Text style={styles.ctaBtnText}>Написать нам</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL("tel:+79606000047")}>
            <Text style={[styles.phone, { color: colors.mutedForeground }]}>+7 (960) 600-00-47</Text>
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
  hero: { padding: 20, paddingBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: "800", lineHeight: 32, marginBottom: 10 },
  heroText: { fontSize: 14, lineHeight: 22 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  benefits: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  benefitCard: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTitle: { fontSize: 14, fontWeight: "700" },
  benefitText: { fontSize: 12, lineHeight: 18 },
  condCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  condRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  condText: { flex: 1, fontSize: 14, lineHeight: 21 },
  cta: {
    margin: 16,
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  ctaTitle: { fontSize: 18, fontWeight: "700" },
  ctaText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  ctaBtn: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 10,
  },
  ctaBtnText: { fontSize: 14, fontWeight: "700", color: "#000000" },
  phone: { fontSize: 14, marginTop: 4 },
});
