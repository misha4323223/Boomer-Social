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

const SECTIONS = [
  {
    title: "1. Общие положения",
    items: [
      "Настоящая Политика составлена в соответствии с требованиями Федерального закона от 27.07.2006 №152-ФЗ «О персональных данных».",
      "Использование Сайта Пользователем означает согласие с настоящей Политикой и условиями обработки персональных данных.",
      "В случае несогласия с условиями Политики Пользователь обязан прекратить использование Сайта.",
    ],
  },
  {
    title: "2. Персональные данные, которые обрабатывает Сайт",
    items: [
      "ФИО (при указании Пользователем);",
      "контактный телефон, адрес электронной почты;",
      "данные, автоматически передаваемые при посещении Сайта (IP-адрес, cookies, данные браузера, характеристики устройства и ПО, время доступа, адреса страниц);",
      "технические cookie, необходимые для работы функций сайта и сохранения сессий.",
    ],
  },
  {
    title: "3. Цели обработки персональных данных",
    items: [
      "идентификация Пользователя;",
      "связь с Пользователем (уведомления, запросы, информация);",
      "предоставление услуг и улучшение их качества;",
      "проведение маркетинговых и статистических исследований;",
      "обеспечение корректной работы Сайта и сохранение пользовательских настроек.",
    ],
  },
  {
    title: "4. Использование аналитики и cookie",
    items: [
      "На Сайте используется сервис аналитики Яндекс.Метрика (ООО «Яндекс»), который автоматически собирает обезличенные данные о действиях Пользователей с помощью файлов cookie и иных технологий.",
      "Технические cookie используются исключительно для корректной работы сайта, сохранения сессий и пользовательских настроек. Эти cookie не передаются третьим лицам и не используются для маркетинга.",
      "Сбор и обработка данных осуществляется в целях анализа активности посетителей и улучшения качества сервиса.",
    ],
  },
  {
    title: "5. Правовые основания обработки",
    items: [
      "Персональные данные обрабатываются только при их самостоятельном указании Пользователем.",
      "Согласие выражается при отправке форм на сайте, при установке галочки согласия, при нажатии кнопки «Оформить заказ» или «Согласен» в баннере cookie.",
    ],
  },
  {
    title: "6. Условия обработки и хранения",
    items: [
      "Сайт принимает меры для защиты персональных данных от неправомерного или случайного доступа, изменения, блокирования, уничтожения или распространения.",
      "Данные хранятся до достижения целей обработки или до отзыва согласия Пользователем.",
      "Персональные данные пользователей хранятся на серверах, расположенных на территории Российской Федерации, в соответствии с требованиями ст. 18.1 Федерального закона №152-ФЗ.",
    ],
  },
  {
    title: "7. Передача персональных данных",
    items: [
      "ЮKassa (ООО НКО «ЮМани») — приём платежей банковскими картами и СБП;",
      "Т-Банк (АО «ТБанк») — приём платежей банковскими картами и Т-Pay;",
      "СДЭК (ООО «СДЭК-Глобал») — организация доставки заказов;",
      "Яндекс Доставка (ООО «Яндекс») — организация доставки заказов;",
      "Яндекс.Метрика (ООО «Яндекс») — сбор обезличенной аналитики посещений Сайта.",
    ],
  },
  {
    title: "8. Права Пользователя",
    items: [
      "получать информацию об обработке своих персональных данных;",
      "требовать уточнения, блокировки или уничтожения данных;",
      "отозвать согласие на обработку данных, направив письменное уведомление Администрации Сайта.",
    ],
  },
  {
    title: "9. Изменение Политики",
    items: [
      "Администрация Сайта вправе изменять Политику без предварительного уведомления.",
      "Новая редакция вступает в силу с момента размещения на Сайте.",
    ],
  },
];

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Политика конфиденциальности</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { color: colors.mutedForeground }]}>
          Дата последнего обновления: 01 сентября 2025 г.
        </Text>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          Настоящая Политика конфиденциальности действует в отношении всей информации, которую сайт booomerangs.ru может получить о Пользователе во время использования Сайта, его сервисов, программ и продуктов.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{section.title}</Text>
            {section.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={[styles.bullet, { color: colors.mutedForeground }]}>•</Text>
                <Text style={[styles.itemText, { color: colors.mutedForeground }]}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.contactTitle, { color: colors.foreground }]}>10. Контакты</Text>
          <Text style={[styles.contactText, { color: colors.mutedForeground }]}>
            По всем вопросам, связанным с обработкой персональных данных:
          </Text>
          <Text style={[styles.contactLine, { color: colors.foreground }]}>E-mail: info@booomerangs.ru</Text>
          <Text style={[styles.contactLine, { color: colors.foreground }]}>Телефон: +7 (960) 600-00-47</Text>
          <Text style={[styles.contactLine, { color: colors.mutedForeground }]}>
            301666, Тульская область, г. Новомосковск, ул. Генерала Белова, д. 21 кв. 48
          </Text>
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
  backBtn: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  scroll: { flex: 1 },
  content: { padding: 20 },
  updated: { fontSize: 12, marginBottom: 12 },
  intro: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  itemRow: { flexDirection: "row", marginBottom: 6, paddingLeft: 4 },
  bullet: { fontSize: 14, marginRight: 8, marginTop: 3 },
  itemText: { fontSize: 14, lineHeight: 21, flex: 1 },
  contactCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  contactTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  contactText: { fontSize: 13, marginBottom: 8, lineHeight: 20 },
  contactLine: { fontSize: 13, lineHeight: 20 },
});
