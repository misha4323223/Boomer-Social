import { Feather, FontAwesome } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

const SITE = "https://booomerangs.ru";

const CATALOG_LINKS = [
  { label: "Все товары", href: "/(tabs)/catalog", internal: true },
  { label: "Одежда", href: "/(tabs)/catalog", internal: true },
  { label: "Носки", href: "/(tabs)/catalog", internal: true },
  { label: "Аксессуары", href: "/(tabs)/catalog", internal: true },
];

const INFO_LINKS = [
  { label: "FAQ", href: "/faq", internal: true },
  { label: "Вакансии", href: "/vacancies", internal: true },
  { label: "Оптовым клиентам", href: "/wholesale", internal: true },
  { label: "Подарочные карты", href: "/gift-cards", internal: true },
  { label: "О бренде", href: "/about", internal: true },
];

const LEGAL_LINKS = [
  { label: "Политика конфиденциальности", href: "/privacy", internal: true },
  { label: "Публичная оферта", href: "/terms", internal: true },
];

const SOCIAL = [
  { label: "ВКонтакте", icon: "vk" as const, iconSet: "fa", url: "https://vk.ru/bmgbrand" },
  { label: "Telegram", icon: "send" as const, iconSet: "feather", url: "https://t.me/booomerangs" },
  { label: "Instagram", icon: "instagram" as const, iconSet: "feather", url: "https://www.instagram.com/bmgbrand/" },
];

export function Footer() {
  const colors = useColors();
  const router = useRouter();
  const year = new Date().getFullYear();

  const handleLink = (href: string, internal: boolean) => {
    if (internal) {
      router.push(href as any);
    } else {
      Linking.openURL(href);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>

      {/* Логотип и описание */}
      <View style={styles.brand}>
        <Text style={[styles.logo, { color: colors.foreground }]}>
          BMG<Text style={styles.logoAccent}>BRAND</Text>
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Российский бренд одежды и аксессуаров. Смелые дизайны. Качественные материалы.{"\n"}
          Из Тулы с любовью к уличной культуре.
        </Text>

        {/* Соцсети */}
        <View style={styles.social}>
          {SOCIAL.map((s) => (
            <Pressable
              key={s.label}
              style={({ pressed }) => [styles.socialBtn, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
              onPress={() => Linking.openURL(s.url)}
            >
              {s.iconSet === "fa"
                ? <FontAwesome name={s.icon as any} size={18} color={colors.foreground} />
                : <Feather name={s.icon as any} size={18} color={colors.foreground} />
              }
            </Pressable>
          ))}
        </View>
      </View>

      {/* Колонки ссылок */}
      <View style={styles.columns}>
        {/* Каталог */}
        <View style={styles.column}>
          <Text style={[styles.colTitle, { color: colors.foreground }]}>Каталог</Text>
          {CATALOG_LINKS.map((link) => (
            <Pressable key={link.label} onPress={() => handleLink(link.href, link.internal)}>
              {({ pressed }) => (
                <Text style={[styles.colLink, { color: pressed ? colors.foreground : colors.mutedForeground }]}>
                  {link.label}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Информация */}
        <View style={styles.column}>
          <Text style={[styles.colTitle, { color: colors.foreground }]}>Информация</Text>
          {INFO_LINKS.map((link) => (
            <Pressable key={link.label} onPress={() => handleLink(link.href, link.internal)}>
              {({ pressed }) => (
                <Text style={[styles.colLink, { color: pressed ? colors.foreground : colors.mutedForeground }]}>
                  {link.label}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Контакты */}
      <View style={[styles.contacts, { borderTopColor: colors.border }]}>
        <Feather name="map-pin" size={13} color={colors.mutedForeground} />
        <Text style={[styles.contactText, { color: colors.mutedForeground }]}>Россия, Тула</Text>
        <Text style={[styles.contactDot, { color: colors.mutedForeground }]}>·</Text>
        <Pressable onPress={() => Linking.openURL("mailto:info@booomerangs.ru")}>
          <Text style={[styles.contactLink, { color: colors.mutedForeground }]}>info@booomerangs.ru</Text>
        </Pressable>
      </View>

      {/* Юридические ссылки */}
      <View style={[styles.legal, { borderTopColor: colors.border }]}>
        {LEGAL_LINKS.map((link, i) => (
          <React.Fragment key={link.label}>
            <Pressable onPress={() => handleLink(link.href, link.internal)}>
              {({ pressed }) => (
                <Text style={[styles.legalLink, { color: pressed ? colors.foreground : colors.mutedForeground }]}>
                  {link.label}
                </Text>
              )}
            </Pressable>
            {i < LEGAL_LINKS.length - 1 && (
              <Text style={[styles.contactDot, { color: colors.mutedForeground }]}>·</Text>
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Копирайт */}
      <Text style={[styles.copyright, { color: colors.mutedForeground }]}>
        © {year} Booomerangs. Все права защищены.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  brand: {
    marginBottom: 24,
  },
  logo: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
  },
  logoAccent: {
    fontWeight: "400",
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  social: {
    flexDirection: "row",
    gap: 10,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  columns: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 20,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  colTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  colLink: {
    fontSize: 14,
    lineHeight: 22,
  },
  contacts: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 13,
  },
  contactDot: {
    fontSize: 13,
  },
  contactLink: {
    fontSize: 13,
    textDecorationLine: "underline",
  },
  legal: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 14,
  },
  legalLink: {
    fontSize: 12,
  },
  copyright: {
    fontSize: 12,
    textAlign: "center",
  },
});
