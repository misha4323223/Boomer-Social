import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const FAQ_ITEMS = [
  {
    q: "Как оформить заказ?",
    a: "Выберите товар, добавьте в корзину и перейдите к оформлению. Укажите адрес доставки и выберите удобный пункт выдачи СДЭК или Яндекс Доставки.",
  },
  {
    q: "Какие способы оплаты доступны?",
    a: "Оплата картами Visa, MasterCard, МИР через Т-Банк и ЮKassa. Оплата безналичная, онлайн.",
  },
  {
    q: "Сколько идёт доставка?",
    a: "Доставка по России через СДЭК и Яндекс Доставку. Сроки зависят от региона — обычно 3–10 рабочих дней. Стоимость рассчитывается автоматически при оформлении.",
  },
  {
    q: "Можно ли вернуть или обменять товар?",
    a: "Да. В течение 14 дней с момента получения вы можете вернуть товар надлежащего качества при сохранении товарного вида и упаковки.",
  },
  {
    q: "Как узнать статус заказа?",
    a: "Статус заказа и трек-номер доступны в разделе «Мои заказы» в профиле приложения. Также можно отследить посылку на сайте транспортной компании.",
  },
  {
    q: "Есть ли размерная сетка?",
    a: "Да, на странице каждого товара указана подробная размерная сетка. Если сомневаетесь — напишите нам в чат поддержки.",
  },
  {
    q: "Как связаться с поддержкой?",
    a: "Напишите нам в раздел «Чат» в приложении или на почту info@booomerangs.ru. Мы отвечаем в рабочие дни с 9:00 до 18:00 МСК.",
  },
  {
    q: "Есть ли подарочные карты?",
    a: "Да! Подарочные карты доступны в разделе «Подарочные карты». Можно выбрать любой номинал и подарить близким.",
  },
  {
    q: "Как воспользоваться промокодом?",
    a: "Введите промокод в корзине перед оформлением заказа. Скидка применится автоматически.",
  },
  {
    q: "Вы отправляете за рубеж?",
    a: "На данный момент доставка осуществляется только по России.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const colors = useColors();

  return (
    <Pressable
      style={[styles.item, { borderBottomColor: colors.border }]}
      onPress={() => setOpen(!open)}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.question, { color: colors.foreground }]}>{q}</Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </View>
      {open && (
        <Text style={[styles.answer, { color: colors.mutedForeground }]}>{a}</Text>
      )}
    </Pressable>
  );
}

export default function FaqScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Частые вопросы</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Ответы на самые популярные вопросы о заказах, доставке и возвратах.
        </Text>
        {FAQ_ITEMS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
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
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  answer: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
});
