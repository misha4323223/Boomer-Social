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
      "Заказ Покупателем товара, размещённого на сайте booomerangs.ru, означает полное и безоговорочное принятие условий настоящей Оферты.",
      "Настоящая Оферта является договором, заключаемым между Продавцом и Покупателем в момент оформления заказа.",
      "Продавец оставляет за собой право изменять условия Оферты без предварительного уведомления Покупателей. Актуальная версия всегда доступна на сайте.",
    ],
  },
  {
    title: "2. Предмет договора",
    items: [
      "Продавец обязуется передать Покупателю товар, представленный в интернет-магазине booomerangs.ru, а Покупатель обязуется оплатить и принять товар на условиях настоящей Оферты.",
      "Характеристики, изображения и описание товара размещены на сайте и соответствуют имеющимся у Продавца данным.",
    ],
  },
  {
    title: "3. Оформление заказа и оплата",
    items: [
      "Покупатель оформляет заказ самостоятельно на сайте, добавляя выбранные товары в корзину.",
      "Оплата товара осуществляется безналичным способом через платёжные системы Т-Банк и ЮKassa.",
      "Цены указаны в российских рублях и включают все действующие налоги.",
    ],
  },
  {
    title: "3.1. Предзаказ (предроп) товара",
    items: [
      "Покупатель вправе оформить предзаказ на товар, ещё не поступивший в продажу.",
      "При оформлении предзаказа Покупатель вносит полную предоплату (100%) стоимости товара.",
      "Покупатель вправе отменить предзаказ и получить полный возврат средств, при условии, что товар ещё не передан в производство.",
      "В случае невозможности исполнения предзаказа по вине Продавца, Покупателю гарантируется полный возврат уплаченных средств в течение 10 рабочих дней.",
    ],
  },
  {
    title: "4. Доставка товара",
    items: [
      "Доставка осуществляется по России службами СДЭК и Яндекс Доставка на условиях, указанных при оформлении заказа.",
      "Покупатель самостоятельно выбирает службу доставки и пункт выдачи при оформлении заказа.",
      "Сроки и стоимость доставки зависят от региона и выбранной службы доставки, рассчитываются автоматически.",
      "Обязанность Продавца по передаче товара считается исполненной в момент передачи товара службе доставки.",
    ],
  },
  {
    title: "5. Возврат и обмен товара",
    items: [
      "Покупатель вправе отказаться от товара надлежащего качества в течение 14 календарных дней после получения, если сохранены товарный вид, упаковка и документ, подтверждающий покупку.",
      "Возврат товара ненадлежащего качества осуществляется в порядке, установленном законодательством РФ.",
      "Для оформления возврата Покупатель должен связаться с Продавцом через электронную почту, указанную на сайте.",
    ],
  },
  {
    title: "6. Ответственность сторон",
    items: [
      "Продавец не несёт ответственности за неправильный выбор характеристик товара, если они указаны на сайте корректно.",
      "Продавец не несёт ответственности за задержки в доставке, возникшие по вине транспортных компаний.",
      "Покупатель несёт ответственность за достоверность предоставленных данных при оформлении заказа.",
    ],
  },
  {
    title: "7. Конфиденциальность и защита данных",
    items: [
      "Продавец обрабатывает персональные данные Покупателя в соответствии с ФЗ-152 «О персональных данных».",
      "Предоставленные данные используются исключительно для выполнения заказа и не передаются третьим лицам, за исключением служб доставки и платёжных операторов.",
    ],
  },
  {
    title: "8. Заключительные положения",
    items: [
      "Настоящая Оферта вступает в силу с момента её размещения на сайте и действует до её отзыва Продавцом.",
      "Во всём остальном, не урегулированном настоящей Офертой, стороны руководствуются законодательством Российской Федерации.",
    ],
  },
];

export default function TermsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Пользовательское соглашение</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Публичная оферта о продаже товаров через интернет-магазин{"\n"}г. Новомосковск
        </Text>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          Настоящая публичная оферта является официальным предложением ИП Соболев Дмитрий Анатольевич, ИНН 711614027971, ОГРНИП 316715400111210 (Продавец), любому физическому лицу (Покупатель) заключить договор купли-продажи товаров через интернет-магазин.
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
          <Text style={[styles.contactTitle, { color: colors.foreground }]}>Реквизиты Продавца</Text>
          <Text style={[styles.contactLine, { color: colors.foreground }]}>ИП Соболев Дмитрий Анатольевич</Text>
          <Text style={[styles.contactLine, { color: colors.mutedForeground }]}>ИНН: 711614027971</Text>
          <Text style={[styles.contactLine, { color: colors.mutedForeground }]}>ОГРНИП: 316715400111210</Text>
          <Text style={[styles.contactLine, { color: colors.foreground }]}>E-mail: info@booomerangs.ru</Text>
          <Text style={[styles.contactLine, { color: colors.foreground }]}>Сайт: booomerangs.ru</Text>
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
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 15, fontWeight: "600", flex: 1, textAlign: "center" },
  scroll: { flex: 1 },
  content: { padding: 20 },
  subtitle: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
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
  contactTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  contactLine: { fontSize: 13, lineHeight: 22 },
});
