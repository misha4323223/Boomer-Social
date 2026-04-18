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

const VACANCIES = [
  {
    title: "Менеджер по продажам",
    type: "Полная занятость",
    location: "Тула / Удалённо",
    description:
      "Ищем энергичного менеджера по работе с клиентами. Обработка заказов, консультации покупателей, взаимодействие с логистическими службами.",
    requirements: ["Опыт в продажах от 1 года", "Грамотная речь", "Знание ПК"],
  },
  {
    title: "SMM-специалист",
    type: "Полная занятость / Проектная работа",
    location: "Удалённо",
    description:
      "Ведение социальных сетей бренда: ВКонтакте, Telegram, Instagram. Создание контента, съёмки, сторис, работа с блогерами.",
    requirements: ["Опыт ведения соцсетей бренда", "Понимание уличной культуры", "Портфолио"],
  },
  {
    title: "Дизайнер одежды",
    type: "Проектная работа",
    location: "Тула / Удалённо",
    description:
      "Разработка принтов, коллекций и дизайнов для одежды и аксессуаров. Работа совместно с командой бренда.",
    requirements: ["Adobe Illustrator / Photoshop", "Понимание трендов streetwear", "Портфолио"],
  },
];

export default function VacanciesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Вакансии</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          Мы — молодой российский бренд из Тулы. Ищем людей, которые разделяют нашу страсть к уличной культуре и качественным вещам.
        </Text>

        {VACANCIES.map((vac) => (
          <View key={vac.title} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.vacTitle, { color: colors.foreground }]}>{vac.title}</Text>
            <View style={styles.tags}>
              <View style={[styles.tag, { backgroundColor: colors.background }]}>
                <Feather name="briefcase" size={12} color={colors.mutedForeground} />
                <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{vac.type}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: colors.background }]}>
                <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{vac.location}</Text>
              </View>
            </View>
            <Text style={[styles.desc, { color: colors.mutedForeground }]}>{vac.description}</Text>
            <View style={styles.reqs}>
              {vac.requirements.map((r) => (
                <View key={r} style={styles.reqRow}>
                  <Feather name="check" size={13} color="#4ade80" />
                  <Text style={[styles.reqText, { color: colors.foreground }]}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.cta, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="mail" size={24} color={colors.foreground} />
          <Text style={[styles.ctaTitle, { color: colors.foreground }]}>Не нашли подходящую вакансию?</Text>
          <Text style={[styles.ctaText, { color: colors.mutedForeground }]}>
            Отправьте резюме — мы всегда рады талантливым людям.
          </Text>
          <Pressable
            style={styles.ctaBtn}
            onPress={() => Linking.openURL("mailto:info@booomerangs.ru?subject=Резюме")}
          >
            <Text style={styles.ctaBtnText}>Написать на почту</Text>
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
  intro: {
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  vacTitle: { fontSize: 17, fontWeight: "700" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 12 },
  desc: { fontSize: 14, lineHeight: 21 },
  reqs: { gap: 6 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reqText: { fontSize: 13 },
  cta: {
    margin: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  ctaTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  ctaText: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  ctaBtn: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaBtnText: { fontSize: 14, fontWeight: "700", color: "#000000" },
});
