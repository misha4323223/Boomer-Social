import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";
import { getCdekPoint, setCdekPoint, subscribeCdekPoint, type CdekPoint } from "@/lib/cdekStore";
import { formatPrice } from "@/lib/types";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
}

interface CdekCity {
  city: string;
  code: number;
  region?: string;
  country_code?: string;
}

const FREE_DELIVERY_THRESHOLD = 500000;

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, sessionId, refetch: refetchCart } = useCart();

  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(user?.name?.split(" ")[1] ?? "");
  const [middleName, setMiddleName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"yookassa" | "tbank">("yookassa");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "door">("pickup");

  const [citySearch, setCitySearch] = useState("");
  const [cityResults, setCityResults] = useState<CdekCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(null);
  const [citySearching, setCitySearching] = useState(false);
  const [doorAddress, setDoorAddress] = useState("");
  const cityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{ valid: boolean; discount?: number; message?: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const [agreeOffer, setAgreeOffer] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [cdekPoint, setCdekPointState] = useState<CdekPoint | null>(getCdekPoint);

  useFocusEffect(
    useCallback(() => {
      setCdekPointState(getCdekPoint());
      const unsub = subscribeCdekPoint((p) => setCdekPointState(p));
      return unsub;
    }, [])
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: paymentMethodsData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const res = await api.get("/payment-methods");
      return res.data?.methods as PaymentMethod[] ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
  const paymentMethods: PaymentMethod[] = paymentMethodsData ?? [
    { id: "yookassa", name: "ЮKassa", description: "Банковские карты, СБП" },
    { id: "tbank", name: "Т-Банк", description: "Оплата картой, Т-Pay" },
  ];

  const subtotal = items.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  const promoDiscount = promoResult?.valid && promoResult.discount ? Math.round(subtotal * promoResult.discount / 100) : 0;
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryCost = isFreeDelivery ? 0 : 30000;
  const total = subtotal - promoDiscount + deliveryCost;

  const searchCities = useCallback(async (text: string) => {
    if (text.length < 2) { setCityResults([]); return; }
    setCitySearching(true);
    try {
      const res = await api.get("/cdek/cities", { params: { city: text } });
      const cities = Array.isArray(res.data) ? res.data : res.data?.cities ?? [];
      setCityResults(cities.slice(0, 8));
    } catch {
      setCityResults([]);
    } finally {
      setCitySearching(false);
    }
  }, []);

  const handleCityInput = (text: string) => {
    setCitySearch(text);
    setSelectedCity(null);
    if (cityDebounce.current) clearTimeout(cityDebounce.current);
    cityDebounce.current = setTimeout(() => searchCities(text), 500);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await api.post("/promo-codes/validate", { code: promoCode, sessionId });
      setPromoResult(res.data);
    } catch (e: any) {
      setPromoResult({ valid: false, message: e?.response?.data?.message ?? "Ошибка проверки промокода" });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!agreeOffer || !agreePrivacy) {
      setError("Необходимо согласиться с офертой и политикой конфиденциальности");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError("Заполните все обязательные поля");
      return;
    }
    if (deliveryType === "pickup" && !cdekPoint) {
      setError("Выберите пункт выдачи СДЭК");
      return;
    }
    if (deliveryType === "door" && !selectedCity) {
      setError("Выберите город доставки");
      return;
    }
    if (deliveryType === "door" && !doorAddress.trim()) {
      setError("Введите адрес доставки");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const fullName = `${lastName} ${firstName} ${middleName}`.trim();
      const body: Record<string, any> = {
        sessionId,
        paymentMethod,
        transportCompany: "cdek",
        cdekDeliveryType: deliveryType,
        firstName,
        lastName,
        middleName,
        email,
        phone,
        customerName: fullName,
        customerEmail: email,
        customerPhone: phone,
        deliveryCost,
      };
      if (deliveryType === "pickup" && cdekPoint) {
        body.cdekCityCode = cdekPoint.cityCode;
        body.cdekPointCode = cdekPoint.code;
        body.address = cdekPoint.address ?? cdekPoint.name ?? "";
      } else if (selectedCity) {
        body.cdekCityCode = selectedCity.code;
        body.address = doorAddress || selectedCity.city;
      }
      if (deliveryType === "door" && doorAddress) {
        body.cdekDoorAddress = doorAddress;
        body.address = doorAddress;
      }
      if (promoResult?.valid && promoCode) {
        body.promoCode = promoCode;
      }

      const res = await api.post("/orders", body);
      console.log("[Checkout] order response:", JSON.stringify(res.data));
      const paymentUrl =
        res.data?.paymentUrl ??
        res.data?.confirmationUrl ??
        res.data?.redirectUrl ??
        res.data?.confirmation?.confirmation_url ??
        res.data?.confirmation?.confirmationUrl ??
        res.data?.payment?.confirmation?.confirmation_url ??
        res.data?.payment?.confirmationUrl ??
        res.data?.payment?.paymentUrl;

      await refetchCart();

      if (paymentUrl) {
        await WebBrowser.openBrowserAsync(paymentUrl);
        router.replace("/(tabs)/");
      } else {
        router.replace("/order-success" as any);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Ошибка при оформлении заказа. Попробуйте снова.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="shopping-cart" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Корзина пуста</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.foreground }]}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Состав заказа */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ваш заказ</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Image
                source={{ uri: item.product?.thumbnailUrl ?? item.product?.imageUrl }}
                style={styles.itemImg}
                contentFit="cover"
              />
              <View style={styles.itemMeta}>
                <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                  {item.product?.name ?? "Товар"}
                </Text>
                {item.size && item.size !== "One Size" && (
                  <Text style={[styles.itemDetail, { color: colors.mutedForeground }]}>{item.size}</Text>
                )}
                {item.color && (
                  <Text style={[styles.itemDetail, { color: colors.mutedForeground }]}>{item.color}</Text>
                )}
                <Text style={[styles.itemDetail, { color: colors.mutedForeground }]}>× {item.quantity}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                {formatPrice((item.product?.price ?? 0) * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Промокод */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Промокод</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputFlex, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Введите код"
              placeholderTextColor={colors.mutedForeground}
              value={promoCode}
              onChangeText={(t) => { setPromoCode(t); setPromoResult(null); }}
              autoCapitalize="characters"
            />
            <Pressable
              style={[styles.applyBtn, { borderColor: colors.border }]}
              onPress={handleApplyPromo}
              disabled={promoLoading || !promoCode.trim()}
            >
              {promoLoading
                ? <ActivityIndicator size="small" color={colors.foreground} />
                : <Text style={[styles.applyBtnText, { color: colors.foreground }]}>Применить</Text>
              }
            </Pressable>
          </View>
          {promoResult && (
            <Text style={{ color: promoResult.valid ? "#22c55e" : "#ff3b30", fontSize: 13, marginTop: 4 }}>
              {promoResult.valid
                ? `✓ Скидка ${promoResult.discount}% применена`
                : promoResult.message ?? "Промокод не найден"}
            </Text>
          )}
        </View>

        {/* Способ доставки */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Feather name="truck" size={16} color={colors.mutedForeground} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Способ доставки</Text>
          </View>

          {isFreeDelivery && (
            <View style={[styles.freeBadge, { borderColor: colors.foreground }]}>
              <Text style={[styles.freeBadgeText, { color: colors.foreground }]}>
                БЕСПЛАТНАЯ ДОСТАВКА от 5 000 ₽
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.radioRow, { borderColor: deliveryType === "pickup" ? "#22c55e" : colors.border }]}
            onPress={() => setDeliveryType("pickup")}
          >
            <View style={[styles.radio, deliveryType === "pickup" && styles.radioActive]} />
            <Text style={[styles.radioLabel, { color: colors.foreground }]}>СДЭК — пункт выдачи</Text>
          </Pressable>

          <Pressable
            style={[styles.radioRow, { borderColor: deliveryType === "door" ? "#22c55e" : colors.border }]}
            onPress={() => setDeliveryType("door")}
          >
            <View style={[styles.radio, deliveryType === "door" && styles.radioActive]} />
            <Text style={[styles.radioLabel, { color: colors.foreground }]}>СДЭК — доставка до двери</Text>
          </Pressable>

          {/* Пункт выдачи — только для pickup */}
          {deliveryType === "pickup" && (
            <View style={{ marginTop: 4 }}>
              {cdekPoint ? (
                <Pressable
                  style={[styles.pointSelected, { backgroundColor: colors.background, borderColor: "#22c55e" }]}
                  onPress={() => router.push("/cdek-select" as any)}
                >
                  <View style={styles.pointSelectedHeader}>
                    <View style={[styles.cdekBadge, { backgroundColor: "#00B140" }]}>
                      <Text style={styles.cdekBadgeText}>СДЭК</Text>
                    </View>
                    <Text style={[styles.pointCode, { color: colors.mutedForeground }]}>{cdekPoint.code}</Text>
                    <Feather name="edit-2" size={14} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
                  </View>
                  {cdekPoint.cityName && (
                    <Text style={[styles.pointCity, { color: colors.mutedForeground }]}>{cdekPoint.cityName}</Text>
                  )}
                  <Text style={[styles.pointAddr, { color: colors.foreground }]} numberOfLines={2}>
                    {cdekPoint.address ?? cdekPoint.name}
                  </Text>
                  {cdekPoint.work_time && (
                    <View style={styles.pointMetaRow}>
                      <Feather name="clock" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.pointMetaText, { color: colors.mutedForeground }]}>{cdekPoint.work_time}</Text>
                    </View>
                  )}
                  {cdekPoint.nearest_station && (
                    <View style={styles.pointMetaRow}>
                      <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.pointMetaText, { color: colors.mutedForeground }]}>{cdekPoint.nearest_station}</Text>
                    </View>
                  )}
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.selectPointBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => router.push("/cdek-select" as any)}
                >
                  <Feather name="map-pin" size={16} color={colors.foreground} />
                  <Text style={[styles.selectPointText, { color: colors.foreground }]}>Выбрать пункт выдачи</Text>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
                </Pressable>
              )}
            </View>
          )}

          {/* Поиск города — только для door */}
          {deliveryType === "door" && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Город доставки</Text>
              <View style={[styles.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="search" size={14} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.cityInput, { color: colors.foreground }]}
                  placeholder="Начните вводить название города"
                  placeholderTextColor={colors.mutedForeground}
                  value={selectedCity ? selectedCity.city : citySearch}
                  onChangeText={handleCityInput}
                  onFocus={() => { if (selectedCity) { setCitySearch(selectedCity.city); setSelectedCity(null); } }}
                />
                {citySearching && <ActivityIndicator size="small" color={colors.mutedForeground} />}
              </View>
              {cityResults.length > 0 && !selectedCity && (
                <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {cityResults.map((city, idx) => (
                    <Pressable
                      key={idx}
                      style={[styles.dropdownItem, idx < cityResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                      onPress={() => { setSelectedCity(city); setCitySearch(""); setCityResults([]); }}
                    >
                      <Text style={[styles.dropdownText, { color: colors.foreground }]}>{city.city}</Text>
                      {city.region && <Text style={[styles.dropdownSub, { color: colors.mutedForeground }]}>{city.region}</Text>}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {deliveryType === "door" && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Адрес доставки</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Улица, дом, квартира"
                placeholderTextColor={colors.mutedForeground}
                value={doorAddress}
                onChangeText={setDoorAddress}
                multiline
              />
            </View>
          )}
        </View>

        {/* Способ оплаты */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Способ оплаты</Text>
          {paymentMethods.map((method) => (
            <Pressable
              key={method.id}
              style={[styles.radioRow, { borderColor: paymentMethod === method.id ? "#22c55e" : colors.border }]}
              onPress={() => setPaymentMethod(method.id as "yookassa" | "tbank")}
            >
              <View style={[styles.radio, paymentMethod === method.id && styles.radioActive]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.radioLabel, { color: colors.foreground }]}>{method.name}</Text>
                <Text style={[styles.radioSub, { color: colors.mutedForeground }]}>{method.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Контактные данные */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Контактные данные</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Фамилия *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Иванов"
              placeholderTextColor={colors.mutedForeground}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Имя *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Иван"
              placeholderTextColor={colors.mutedForeground}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Отчество</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Иванович"
              placeholderTextColor={colors.mutedForeground}
              value={middleName}
              onChangeText={setMiddleName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="email@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Телефон *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="+7 (999) 000-00-00"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Итого */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Сумма</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>{formatPrice(subtotal)}</Text>
          </View>
          {promoDiscount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: "#22c55e" }]}>Скидка по промокоду</Text>
              <Text style={[styles.totalValue, { color: "#22c55e" }]}>−{formatPrice(promoDiscount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Доставка СДЭК</Text>
            <Text style={[styles.totalValue, { color: isFreeDelivery ? "#22c55e" : colors.foreground }]}>
              {isFreeDelivery ? "Бесплатно" : formatPrice(deliveryCost)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.grandLabel, { color: colors.foreground }]}>Всего</Text>
            <Text style={[styles.grandValue, { color: colors.foreground }]}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Согласия */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Pressable style={styles.checkRow} onPress={() => setAgreeOffer(!agreeOffer)}>
            <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: agreeOffer ? colors.foreground : "transparent" }]}>
              {agreeOffer && <Feather name="check" size={12} color={colors.background} />}
            </View>
            <Text style={[styles.checkText, { color: colors.mutedForeground }]}>
              Я ознакомлен с{" "}
              <Text style={{ color: colors.foreground, textDecorationLine: "underline" }}>Публичной офертой</Text>
            </Text>
          </Pressable>
          <Pressable style={styles.checkRow} onPress={() => setAgreePrivacy(!agreePrivacy)}>
            <View style={[styles.checkbox, { borderColor: colors.border, backgroundColor: agreePrivacy ? colors.foreground : "transparent" }]}>
              {agreePrivacy && <Feather name="check" size={12} color={colors.background} />}
            </View>
            <Text style={[styles.checkText, { color: colors.mutedForeground }]}>
              Я согласен с{" "}
              <Text style={{ color: colors.foreground, textDecorationLine: "underline" }}>Политикой персональных данных</Text>
            </Text>
          </Pressable>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.orderBtn,
            { backgroundColor: colors.foreground, opacity: pressed || submitting ? 0.8 : 1 },
          ]}
          onPress={handleOrder}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color={colors.background} />
            : <Text style={[styles.orderBtnText, { color: colors.background }]}>
                Заказать · {formatPrice(total)}
              </Text>
          }
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  section: { borderRadius: 16, padding: 16, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  orderItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  itemImg: { width: 60, height: 80, borderRadius: 8 },
  itemMeta: { flex: 1, gap: 2 },
  itemName: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  itemDetail: { fontSize: 12 },
  itemPrice: { fontSize: 14, fontWeight: "700" },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  inputFlex: { flex: 1 },
  input: { height: 48, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, borderWidth: 1 },
  applyBtn: { height: 48, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  applyBtnText: { fontSize: 14, fontWeight: "600" },
  freeBadge: { borderWidth: 2, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" },
  freeBadgeText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 10, borderWidth: 1.5 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#666", backgroundColor: "transparent" },
  radioActive: { backgroundColor: "#22c55e", borderColor: "#22c55e" },
  radioLabel: { fontSize: 14, fontWeight: "600" },
  radioSub: { fontSize: 12, marginTop: 2 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12 },
  cityInput: { flex: 1, fontSize: 14 },
  dropdown: { marginTop: 4, borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 10 },
  dropdownText: { fontSize: 14, fontWeight: "500" },
  dropdownSub: { fontSize: 12 },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: "500" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 14, fontWeight: "600" },
  grandLabel: { fontSize: 17, fontWeight: "800" },
  grandValue: { fontSize: 17, fontWeight: "800" },
  divider: { height: 1, marginVertical: 4 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkText: { flex: 1, fontSize: 13, lineHeight: 20 },
  errorText: { color: "#ff3b30", fontSize: 13, textAlign: "center" },
  orderBtn: { height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  orderBtnText: { fontSize: 17, fontWeight: "700" },
  selectPointBtn: { flexDirection: "row", alignItems: "center", gap: 10, height: 54, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16 },
  selectPointText: { fontSize: 15, fontWeight: "600" },
  pointSelected: { borderRadius: 12, borderWidth: 2, padding: 12, gap: 6 },
  pointSelectedHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cdekBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  cdekBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  pointCode: { fontSize: 12 },
  pointCity: { fontSize: 12 },
  pointAddr: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  pointMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pointMetaText: { fontSize: 12, flex: 1 },
});
