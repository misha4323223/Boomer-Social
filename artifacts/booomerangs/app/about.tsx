import { Feather } from "@expo/vector-icons";
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

const MILESTONES = [
  { year: "2020", text: "Основание бренда в Туле. Первая коллекция носков." },
  { year: "2021", text: "Запуск интернет-магазина. Более 50 моделей носков." },
  { year: "2022", text: "Выход в одежду. Первая линейка уличной одежды." },
  { year: "2023", text: "Коллаборации с российскими музыкантами и художниками." },
  { year: "2024", text: "Более 200 моделей. Собственное мобильное приложение." },
];

const VALUES = [
  { icon: "heart" as const, title: "Делаем для себя", text: "Каждую вещь мы носим сами. Это главный критерий качества." },
  { icon: "map-pin" as const, title: "Сделано в России", text: "Производство и дизайн — в России. Поддерживаем отечественное." },
  { icon: "users" as const, title: "Сообщество", text: "Мы строим комьюнити людей, которым близка уличная культура." },
  { icon: "star" as const, title: "Качество", text: "Только качественные материалы и продуманные конструкции." },
];

export default function AboutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>О бренде</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

        {/* Заголовок */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Мы — BOOOMERANGS
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Российский бренд одежды и аксессуаров из Тулы
          </Text>
          <Text style={[styles.heroText, { color: colors.mutedForeground }]}>
            Базируясь в Туле — городе мастеров, пряников и самоваров — мы создаём вещи для повседневной жизни. Смелые дизайны, качественные материалы и настоящая страсть к уличной культуре.
          </Text>
          <Text style={[styles.quote, { color: colors.foreground, borderLeftColor: colors.border }]}>
            «Делаем вещи, которые носим сами»
          </Text>
        </View>

        {/* Ценности */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Наши ценности</Text>
        <View style={styles.values}>
          {VALUES.map((v) => (
            <View key={v.title} style={[styles.valueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={v.icon} size={22} color={colors.foreground} />
              <Text style={[styles.valueTitle, { color: colors.foreground }]}>{v.title}</Text>
              <Text style={[styles.valueText, { color: colors.mutedForeground }]}>{v.text}</Text>
            </View>
          ))}
        </View>

        {/* История */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>История бренда</Text>
        <View style={[styles.timeline, { borderLeftColor: colors.border }]}>
          {MILESTONES.map((m, i) => (
            <View key={m.year} style={styles.milestone}>
              <View style={[styles.dot, { backgroundColor: i === MILESTONES.length - 1 ? "#ffffff" : colors.border }]} />
              <View style={styles.milestoneContent}>
                <Text style={[styles.year, { color: colors.foreground }]}>{m.year}</Text>
                <Text style={[styles.milestoneText, { color: colors.mutedForeground }]}>{m.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Контакты */}
        <View style={[styles.contacts, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.contactsTitle, { color: colors.foreground }]}>Контакты</Text>
          <View style={styles.contactRow}>
            <Feather name="map-pin" size={16} color={colors.mutedForeground} />
            <Text style={[styles.contactText, { color: colors.mutedForeground }]}>Россия, Тула</Text>
          </View>
          <View style={styles.contactRow}>
            <Feather name="mail" size={16} color={colors.mutedForeground} />
            <Text style={[styles.contactText, { color: colors.mutedForeground }]}>info@booomerangs.ru</Text>
          </View>
          <View style={styles.contactRow}>
            <Feather name="phone" size={16} color={colors.mutedForeground} />
            <Text style={[styles.contactText, { color: colors.mutedForeground }]}>+7 (960) 600-00-47</Text>
          </View>
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
  hero: { padding: 20 },
  heroTitle: { fontSize: 26, fontWeight: "900", marginBottom: 6 },
  heroSub: { fontSize: 14, marginBottom: 14 },
  heroText: { fontSize: 14, lineHeight: 22, marginBottom: 16 },
  quote: {
    fontSize: 16,
    fontWeight: "600",
    fontStyle: "italic",
    lineHeight: 24,
    borderLeftWidth: 3,
    paddingLeft: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  values: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 8,
  },
  valueCard: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  valueTitle: { fontSize: 14, fontWeight: "700" },
  valueText: { fontSize: 12, lineHeight: 18 },
  timeline: {
    marginHorizontal: 16,
    marginBottom: 20,
    paddingLeft: 20,
    borderLeftWidth: 2,
    gap: 0,
  },
  milestone: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -25,
    marginTop: 4,
    marginRight: 15,
  },
  milestoneContent: { flex: 1 },
  year: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  milestoneText: { fontSize: 13, lineHeight: 20 },
  contacts: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  contactsTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  contactText: { fontSize: 14 },
});
