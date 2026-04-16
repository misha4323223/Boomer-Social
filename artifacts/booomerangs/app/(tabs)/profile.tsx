import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";
import { formatPrice } from "@/lib/types";

const LOYALTY_TIERS = [
  { minSpent: 0, discount: 0, label: "Новый клиент" },
  { minSpent: 500000, discount: 3, label: "Постоянный" },
  { minSpent: 1000000, discount: 5, label: "Серебряный" },
  { minSpent: 3000000, discount: 7, label: "Золотой" },
  { minSpent: 5000000, discount: 10, label: "Платиновый" },
];

function getLoyaltyLabel(totalSpent: number): string {
  let label = LOYALTY_TIERS[0].label;
  for (const tier of LOYALTY_TIERS) {
    if (totalSpent >= tier.minSpent) label = tier.label;
  }
  return label;
}

function getNextTierSpend(totalSpent: number): { next: number; label: string } | null {
  for (const tier of LOYALTY_TIERS) {
    if (totalSpent < tier.minSpent) {
      return { next: tier.minSpent - totalSpent, label: tier.label };
    }
  }
  return null;
}

type ProfileTab = "overview" | "settings" | "subscriptions";
type AuthMode = "login" | "register" | "forgot";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading, login, register, forgotPassword, logout, refetchUser } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [giftExpanded, setGiftExpanded] = useState(true);
  const [promoExpanded, setPromoExpanded] = useState(true);
  const [priceDropExpanded, setPriceDropExpanded] = useState(false);
  const [stockExpanded, setStockExpanded] = useState(false);

  const userEmail = user?.email ?? "";

  const { data: orders, isLoading: ordersLoading } = useQuery<any[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/auth/orders");
      return res.data?.orders ?? [];
    },
    enabled: !!user,
  });

  const { data: giftCards, isLoading: giftLoading, isError: giftError } = useQuery<any[]>({
    queryKey: ["my-gift-cards"],
    queryFn: async () => {
      const res = await api.get("/auth/my-gift-cards");
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user,
  });

  const { data: promoCodes, isLoading: promoLoading, isError: promoError } = useQuery<any[]>({
    queryKey: ["my-promo-codes"],
    queryFn: async () => {
      const res = await api.get("/auth/my-promo-codes");
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!user,
  });

  const { data: priceDropData } = useQuery<{ subscriptions: any[] }>({
    queryKey: ["price-drop-my", userEmail],
    queryFn: async () => {
      const res = await api.get(`/price-drop-notify/my?email=${encodeURIComponent(userEmail)}`);
      return res.data;
    },
    enabled: !!user && activeTab === "subscriptions",
  });

  const { data: stockNotifyData } = useQuery<{ subscriptions: any[] }>({
    queryKey: ["stock-notify-my", userEmail],
    queryFn: async () => {
      const res = await api.get(`/stock-notify/my?email=${encodeURIComponent(userEmail)}`);
      return res.data;
    },
    enabled: !!user && activeTab === "subscriptions",
  });

  const { data: newsletterData } = useQuery<{ subscribed: boolean }>({
    queryKey: ["newsletter-my", userEmail],
    queryFn: async () => {
      const res = await api.get(`/newsletter/my-subscription?email=${encodeURIComponent(userEmail)}`);
      return res.data;
    },
    enabled: !!user && activeTab === "subscriptions",
  });

  const deletePriceDropMutation = useMutation({
    mutationFn: (productId: number) =>
      api.delete("/price-drop-notify", { data: { productId, email: userEmail } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-drop-my", userEmail] });
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: ({ productId, size }: { productId: number; size: string }) =>
      api.delete("/stock-notify", { data: { productId, size, email: userEmail } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-notify-my", userEmail] });
    },
  });

  const unsubscribeNewsletterMutation = useMutation({
    mutationFn: () => api.delete("/newsletter/my-subscription", { data: { email: userEmail } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter-my", userEmail] });
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.foreground} size="large" />
      </View>
    );
  }

  if (user) {
    const loyalty = user.loyaltyDiscount ?? 0;
    const spent = user.totalSpent ?? 0;
    const tierLabel = getLoyaltyLabel(spent);
    const nextTier = getNextTierSpend(spent);

    const handleSaveProfile = async () => {
      setSaving(true);
      try {
        await api.patch("/auth/profile", {
          name: editName.trim() || undefined,
          phone: editPhone.trim() || undefined,
        });
        await refetchUser();
        setEditMode(false);
      } catch (e: any) {
        Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось сохранить");
      } finally {
        setSaving(false);
      }
    };

    const handleChangePassword = async () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert("Ошибка", "Заполните все поля");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Ошибка", "Новый пароль не совпадает");
        return;
      }
      if (newPassword.length < 6) {
        Alert.alert("Ошибка", "Минимум 6 символов");
        return;
      }
      setChangingPassword(true);
      try {
        await api.post("/auth/change-password", { currentPassword, newPassword });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        Alert.alert("Готово", "Пароль успешно изменён");
      } catch (e: any) {
        Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось изменить пароль");
      } finally {
        setChangingPassword(false);
      }
    };

    const renderOverview = () => (
      <View style={styles.tabContent}>
        <View style={[styles.avatar, { backgroundColor: colors.card }]}>
          <Text style={[styles.avatarText, { color: colors.foreground }]}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {editMode ? (
          <View style={[styles.editCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Имя</Text>
            <TextInput
              style={[styles.editInput, { color: colors.foreground, borderColor: colors.border }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Ваше имя"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
            />
            <Text style={[styles.editLabel, { color: colors.mutedForeground }]}>Телефон</Text>
            <TextInput
              style={[styles.editInput, { color: colors.foreground, borderColor: colors.border }]}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="+7 900 000 00 00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
            />
            <View style={styles.editActions}>
              <Pressable
                style={[styles.editSaveBtn, { backgroundColor: colors.foreground }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={[styles.editSaveText, { color: colors.background }]}>Сохранить</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.editCancelBtn, { borderColor: colors.border }]}
                onPress={() => setEditMode(false)}
              >
                <Text style={[styles.editCancelText, { color: colors.mutedForeground }]}>Отмена</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
            {user.phone ? (
              <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>{user.phone}</Text>
            ) : null}
            <Pressable
              onPress={() => { setEditName(user.name); setEditPhone(user.phone ?? ""); setEditMode(true); }}
              style={styles.editProfileBtn}
            >
              <Feather name="edit-2" size={13} color={colors.mutedForeground} />
              <Text style={[styles.editProfileText, { color: colors.mutedForeground }]}>Редактировать</Text>
            </Pressable>
          </>
        )}

        {loyalty > 0 || spent > 0 ? (
          <View style={[styles.loyaltyCard, { backgroundColor: "#1c1033" }]}>
            <View style={styles.loyaltyHeader}>
              <Feather name="award" size={18} color="#a78bfa" />
              <Text style={styles.loyaltyTitle}>{tierLabel}</Text>
              {loyalty > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>−{loyalty}%</Text>
                </View>
              )}
            </View>
            {spent > 0 && (
              <Text style={styles.loyaltySpent}>Потрачено: {formatPrice(spent)}</Text>
            )}
            {nextTier && (
              <Text style={styles.loyaltyNext}>
                До уровня «{nextTier.label}»: ещё {formatPrice(nextTier.next)}
              </Text>
            )}
          </View>
        ) : null}

        {/* Сертификаты — всегда видны */}
        <View style={[styles.collapsibleCard, { backgroundColor: colors.card }]}>
          <Pressable style={styles.collapsibleHeader} onPress={() => setGiftExpanded(!giftExpanded)}>
            <Feather name="gift" size={16} color={colors.foreground} />
            <Text style={[styles.collapsibleTitle, { color: colors.foreground }]}>
              Сертификаты
            </Text>
            {giftCards && giftCards.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.countBadgeText, { color: colors.foreground }]}>{giftCards.length}</Text>
              </View>
            )}
            <Feather name={giftExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </Pressable>
          {giftExpanded && (
            <View style={[styles.collapsibleContent, { borderTopColor: colors.border }]}>
              {giftLoading ? (
                <ActivityIndicator color={colors.mutedForeground} style={{ marginVertical: 10 }} />
              ) : giftError ? (
                <Text style={[styles.emptySubText, { color: "#ef4444" }]}>Не удалось загрузить сертификаты</Text>
              ) : !giftCards || giftCards.length === 0 ? (
                <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>У вас нет подарочных сертификатов</Text>
              ) : (
                giftCards.map((card: any) => (
                  <View key={card.id} style={[styles.giftRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.giftInfo}>
                      <Text style={[styles.giftCode, { color: colors.foreground }]}>{card.code}</Text>
                      <Text style={[styles.giftBalance, { color: colors.mutedForeground }]}>
                        Баланс: {formatPrice(card.balance ?? card.amount)}
                      </Text>
                      {card.expiresAt && (
                        <Text style={[styles.giftBalance, { color: colors.mutedForeground }]}>
                          До: {new Date(card.expiresAt).toLocaleDateString("ru-RU")}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => Alert.alert("Код скопирован", card.code)}
                      style={[styles.copyBtn, { backgroundColor: colors.border }]}
                    >
                      <Feather name="copy" size={13} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Промокоды — всегда видны */}
        <View style={[styles.collapsibleCard, { backgroundColor: colors.card }]}>
          <Pressable style={styles.collapsibleHeader} onPress={() => setPromoExpanded(!promoExpanded)}>
            <Feather name="tag" size={16} color={colors.foreground} />
            <Text style={[styles.collapsibleTitle, { color: colors.foreground }]}>Промокоды</Text>
            {promoCodes && promoCodes.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.countBadgeText, { color: colors.foreground }]}>{promoCodes.length}</Text>
              </View>
            )}
            <Feather name={promoExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </Pressable>
          {promoExpanded && (
            <View style={[styles.collapsibleContent, { borderTopColor: colors.border }]}>
              {promoLoading ? (
                <ActivityIndicator color={colors.mutedForeground} style={{ marginVertical: 10 }} />
              ) : promoError ? (
                <Text style={[styles.emptySubText, { color: "#ef4444" }]}>Не удалось загрузить промокоды</Text>
              ) : !promoCodes || promoCodes.length === 0 ? (
                <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>У вас нет промокодов</Text>
              ) : (
                promoCodes.map((promo: any, idx: number) => (
                  <View key={idx} style={[styles.giftRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.giftInfo}>
                      <Text style={[styles.giftCode, { color: colors.foreground }]}>{promo.code}</Text>
                      {promo.discountPercent ? (
                        <Text style={[styles.giftBalance, { color: "#10b981" }]}>Скидка {promo.discountPercent}%</Text>
                      ) : promo.discountAmount ? (
                        <Text style={[styles.giftBalance, { color: "#10b981" }]}>Скидка {formatPrice(promo.discountAmount)}</Text>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => Alert.alert("Промокод скопирован", promo.code)}
                      style={[styles.copyBtn, { backgroundColor: colors.border }]}
                    >
                      <Feather name="copy" size={13} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Мои заказы — превью прямо в профиле */}
        <View style={[styles.collapsibleCard, { backgroundColor: colors.card }]}>
          <Pressable
            style={styles.collapsibleHeader}
            onPress={() => router.push("/orders" as any)}
          >
            <Feather name="package" size={16} color={colors.foreground} />
            <Text style={[styles.collapsibleTitle, { color: colors.foreground }]}>Мои заказы</Text>
            {orders && orders.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.countBadgeText, { color: colors.foreground }]}>{orders.length}</Text>
              </View>
            )}
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          </Pressable>
          <View style={[styles.collapsibleContent, { borderTopColor: colors.border }]}>
            {ordersLoading ? (
              <ActivityIndicator color={colors.mutedForeground} style={{ marginVertical: 10 }} />
            ) : !orders || orders.length === 0 ? (
              <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>Заказов пока нет</Text>
            ) : (
              orders.slice(0, 3).map((order: any) => (
                <Pressable
                  key={order.id}
                  style={[styles.orderRow, { borderBottomColor: colors.border }]}
                  onPress={() => router.push("/orders" as any)}
                >
                  <View style={styles.orderRowLeft}>
                    <Text style={[styles.orderNum, { color: colors.foreground }]}>Заказ №{order.id}</Text>
                    <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ru-RU") : ""}
                    </Text>
                  </View>
                  <View style={styles.orderRowRight}>
                    <Text style={[styles.orderStatus, { color: colors.mutedForeground }]}>
                      {order.status === "pending" ? "Оформлен" :
                       order.status === "paid" ? "Оплачен" :
                       order.status === "processing" ? "Собирается" :
                       order.status === "shipped" ? "Отправлен" :
                       order.status === "delivered" ? "Доставлен" :
                       order.status === "cancelled" ? "Отменён" : order.status}
                    </Text>
                    <Text style={[styles.orderTotal, { color: colors.foreground }]}>
                      {order.totalAmount ? formatPrice(order.totalAmount) : ""}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
            {orders && orders.length > 3 && (
              <Pressable
                style={[styles.viewAllBtn, { borderTopColor: colors.border }]}
                onPress={() => router.push("/orders" as any)}
              >
                <Text style={[styles.viewAllText, { color: colors.mutedForeground }]}>
                  Все заказы ({orders.length}) →
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.menuSection}>
          <Pressable
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => router.push("/(tabs)/favorites" as any)}
          >
            <Feather name="heart" size={20} color={colors.foreground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Избранное</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => router.push("/(tabs)/favorites" as any)}
          >
            <Feather name="heart" size={20} color={colors.foreground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Избранное</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={() => router.push("/chat" as any)}
          >
            <Feather name="message-circle" size={20} color={colors.foreground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Написать нам</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutBtn,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={logout}
        >
          <Feather name="log-out" size={18} color={colors.mutedForeground} />
          <Text style={[styles.logoutText, { color: colors.mutedForeground }]}>Выйти</Text>
        </Pressable>
      </View>
    );

    const renderSettings = () => (
      <View style={styles.tabContent}>
        <View style={[styles.settingsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Данные профиля</Text>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Имя</Text>
          <TextInput
            style={[styles.settingsInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={editName}
            onChangeText={setEditName}
            placeholder={user.name}
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="words"
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Телефон</Text>
          <TextInput
            style={[styles.settingsInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={editPhone}
            onChangeText={setEditPhone}
            placeholder={user.phone ?? "+7 900 000 00 00"}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
          />
          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.foreground }]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.background }]}>Сохранить данные</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.settingsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Сменить пароль</Text>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Текущий пароль</Text>
          <TextInput
            style={[styles.settingsInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Введите текущий пароль"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Новый пароль</Text>
          <TextInput
            style={[styles.settingsInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Минимум 6 символов"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
          />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Повторите пароль</Text>
          <TextInput
            style={[styles.settingsInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Повторите новый пароль"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
          />
          <Pressable
            style={[styles.saveBtn, { backgroundColor: colors.foreground }]}
            onPress={handleChangePassword}
            disabled={changingPassword}
          >
            {changingPassword ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.background }]}>Изменить пароль</Text>
            )}
          </Pressable>
        </View>
      </View>
    );

    const renderSubscriptions = () => (
      <View style={styles.tabContent}>
        <View style={[styles.collapsibleCard, { backgroundColor: colors.card }]}>
          <Pressable style={styles.collapsibleHeader} onPress={() => setPriceDropExpanded(!priceDropExpanded)}>
            <Feather name="trending-down" size={16} color={colors.foreground} />
            <Text style={[styles.collapsibleTitle, { color: colors.foreground }]}>Слежу за ценой</Text>
            {priceDropData?.subscriptions?.length ? (
              <View style={[styles.countBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.countBadgeText, { color: colors.foreground }]}>
                  {priceDropData.subscriptions.length}
                </Text>
              </View>
            ) : null}
            <Feather name={priceDropExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </Pressable>
          {priceDropExpanded && (
            <View style={[styles.collapsibleContent, { borderTopColor: colors.border }]}>
              {!priceDropData ? (
                <ActivityIndicator color={colors.mutedForeground} />
              ) : priceDropData.subscriptions.length === 0 ? (
                <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
                  Вы не следите ни за одним товаром. На странице товара нажмите «Уведомить о снижении цены».
                </Text>
              ) : (
                priceDropData.subscriptions.map((sub: any) => (
                  <View key={sub.id} style={[styles.subRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.subInfo}>
                      <Text style={[styles.subName, { color: colors.foreground }]} numberOfLines={1}>
                        {sub.productName || `Товар #${sub.productId}`}
                      </Text>
                      <Text style={[styles.subMeta, { color: colors.mutedForeground }]}>
                        Цена при подписке: {formatPrice(sub.priceAtSubscription)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => deletePriceDropMutation.mutate(sub.productId)}
                      disabled={deletePriceDropMutation.isPending}
                      style={styles.deleteBtn}
                    >
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <View style={[styles.collapsibleCard, { backgroundColor: colors.card }]}>
          <Pressable style={styles.collapsibleHeader} onPress={() => setStockExpanded(!stockExpanded)}>
            <Feather name="sliders" size={16} color={colors.foreground} />
            <Text style={[styles.collapsibleTitle, { color: colors.foreground }]}>Жду размер</Text>
            {stockNotifyData?.subscriptions?.length ? (
              <View style={[styles.countBadge, { backgroundColor: colors.border }]}>
                <Text style={[styles.countBadgeText, { color: colors.foreground }]}>
                  {stockNotifyData.subscriptions.length}
                </Text>
              </View>
            ) : null}
            <Feather name={stockExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </Pressable>
          {stockExpanded && (
            <View style={[styles.collapsibleContent, { borderTopColor: colors.border }]}>
              {!stockNotifyData ? (
                <ActivityIndicator color={colors.mutedForeground} />
              ) : stockNotifyData.subscriptions.length === 0 ? (
                <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
                  Вы не ждёте ни одного размера. На странице товара нажмите «Уведомить о появлении размера».
                </Text>
              ) : (
                stockNotifyData.subscriptions.map((sub: any) => (
                  <View key={sub.id} style={[styles.subRow, { borderBottomColor: colors.border }]}>
                    <View style={styles.subInfo}>
                      <Text style={[styles.subName, { color: colors.foreground }]} numberOfLines={1}>
                        {sub.productName || `Товар #${sub.productId}`}
                      </Text>
                      <Text style={[styles.subMeta, { color: colors.mutedForeground }]}>
                        Размер: {sub.size}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => deleteStockMutation.mutate({ productId: sub.productId, size: sub.size })}
                      disabled={deleteStockMutation.isPending}
                      style={styles.deleteBtn}
                    >
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <View style={[styles.collapsibleCard, { backgroundColor: colors.card }]}>
          <View style={styles.collapsibleHeader}>
            <Feather name="mail" size={16} color={colors.foreground} />
            <Text style={[styles.collapsibleTitle, { color: colors.foreground }]}>Рассылка</Text>
            {newsletterData !== undefined && (
              <View style={[styles.countBadge, {
                backgroundColor: newsletterData?.subscribed ? "#10b98122" : colors.border,
              }]}>
                <Text style={[styles.countBadgeText, {
                  color: newsletterData?.subscribed ? "#10b981" : colors.mutedForeground,
                }]}>
                  {newsletterData?.subscribed ? "Активна" : "Нет"}
                </Text>
              </View>
            )}
          </View>
          {newsletterData?.subscribed && (
            <View style={[styles.collapsibleContent, { borderTopColor: colors.border }]}>
              <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>
                Вы подписаны на email-рассылку и получаете акции и новости о новых коллекциях.
              </Text>
              <Pressable
                onPress={() => unsubscribeNewsletterMutation.mutate()}
                disabled={unsubscribeNewsletterMutation.isPending}
                style={[styles.unsubBtn, { borderColor: colors.border }]}
              >
                {unsubscribeNewsletterMutation.isPending ? (
                  <ActivityIndicator color={colors.mutedForeground} size="small" />
                ) : (
                  <Text style={[{ color: colors.mutedForeground, fontSize: 13 }]}>Отписаться</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          {([
            { key: "overview", label: "Обзор", icon: "user" },
            { key: "settings", label: "Настройки", icon: "settings" },
            { key: "subscriptions", label: "Подписки", icon: "bell" },
          ] as { key: ProfileTab; label: string; icon: any }[]).map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && [styles.tabBtnActive, { borderBottomColor: colors.foreground }]]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Feather
                name={tab.icon}
                size={14}
                color={activeTab === tab.key ? colors.foreground : colors.mutedForeground}
              />
              <Text style={[styles.tabLabel, {
                color: activeTab === tab.key ? colors.foreground : colors.mutedForeground,
                fontWeight: activeTab === tab.key ? "700" : "400",
              }]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "overview" && renderOverview()}
        {activeTab === "settings" && renderSettings()}
        {activeTab === "subscriptions" && renderSubscriptions()}
      </ScrollView>
    );
  }

  const handleSubmit = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setSubmitting(true);
    try {
      if (authMode === "login") {
        await login(email, password);
      } else if (authMode === "register") {
        const fullName = [lastName.trim(), firstName.trim()].filter(Boolean).join(" ");
        await register(fullName || firstName || "Пользователь", email, password);
        setAuthSuccess("Регистрация прошла успешно! Проверьте почту для подтверждения email.");
      } else if (authMode === "forgot") {
        await forgotPassword(email);
        setAuthSuccess("Если email зарегистрирован, вы получите письмо для сброса пароля.");
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ??
        e?.response?.data?.message ??
        "Произошла ошибка. Попробуйте снова.";
      setAuthError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.authContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.authTitle, { color: colors.foreground }]}>
          {authMode === "login" ? "Войти" : authMode === "register" ? "Регистрация" : "Восстановление пароля"}
        </Text>

        {authMode === "forgot" && (
          <Text style={[styles.forgotDesc, { color: colors.mutedForeground }]}>
            Введите email, указанный при регистрации — мы отправим ссылку для сброса пароля.
          </Text>
        )}

        <Pressable
          style={[styles.yandexBtn]}
          onPress={() => Linking.openURL("https://booomerangs.ru/api/auth/yandex")}
        >
          <View style={styles.yandexIcon}>
            <Text style={styles.yandexLetter}>Я</Text>
          </View>
          <Text style={styles.yandexText}>Войти с Яндекс ID</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground, backgroundColor: colors.background }]}>
            или по email
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {authMode === "register" && (
          <View style={styles.nameRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Фамилия</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Иванов"
                placeholderTextColor={colors.mutedForeground}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Имя</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Иван"
                placeholderTextColor={colors.mutedForeground}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="email@example.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {authMode !== "forgot" && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Пароль</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable
                style={[styles.eyeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
        )}

        {authError && (
          <Text style={styles.errorText}>{authError}</Text>
        )}
        {authSuccess && (
          <Text style={styles.successText}>{authSuccess}</Text>
        )}

        <Pressable
          style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.foreground, opacity: pressed || submitting ? 0.75 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.submitText, { color: colors.background }]}>
              {authMode === "login" ? "Войти" : authMode === "register" ? "Зарегистрироваться" : "Отправить ссылку"}
            </Text>
          )}
        </Pressable>

        {authMode === "login" && (
          <View style={styles.authLinksRow}>
            <Pressable onPress={() => { setAuthMode("forgot"); setAuthError(null); setAuthSuccess(null); }}>
              <Text style={[styles.authLink, { color: colors.mutedForeground }]}>Забыли пароль?</Text>
            </Pressable>
            <Pressable onPress={() => { setAuthMode("register"); setAuthError(null); setAuthSuccess(null); }}>
              <Text style={[styles.authLink, { color: colors.foreground }]}>Регистрация</Text>
            </Pressable>
          </View>
        )}

        {authMode === "register" && (
          <Pressable onPress={() => { setAuthMode("login"); setAuthError(null); setAuthSuccess(null); }} style={styles.switchMode}>
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Уже есть аккаунт? Войти</Text>
          </Pressable>
        )}

        {authMode === "forgot" && (
          <Pressable onPress={() => { setAuthMode("login"); setAuthError(null); setAuthSuccess(null); }} style={styles.switchMode}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
              <Text style={[styles.switchText, { color: colors.mutedForeground }]}>Вернуться ко входу</Text>
            </View>
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push("/chat" as any)}
          style={[styles.chatLink]}
        >
          <Feather name="message-circle" size={16} color={colors.mutedForeground} />
          <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
            Написать нам без регистрации
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 12,
  },
  tabContent: {
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    marginTop: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
  },
  userEmail: {
    fontSize: 14,
  },
  userPhone: {
    fontSize: 14,
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  editProfileText: {
    fontSize: 13,
  },
  editCard: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  editSaveBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  editSaveText: {
    fontSize: 15,
    fontWeight: "700",
  },
  editCancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  editCancelText: {
    fontSize: 15,
  },
  loyaltyCard: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  loyaltyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loyaltyTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#e9d5ff",
  },
  discountBadge: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  discountText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  loyaltySpent: {
    fontSize: 13,
    color: "#c4b5fd",
  },
  loyaltyNext: {
    fontSize: 12,
    color: "#a78bfa",
  },
  collapsibleCard: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
  },
  collapsibleTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  collapsibleContent: {
    borderTopWidth: 1,
    padding: 12,
    gap: 8,
  },
  giftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  giftInfo: {
    flex: 1,
    gap: 2,
  },
  giftCode: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  giftBalance: {
    fontSize: 12,
  },
  copyBtn: {
    padding: 8,
    borderRadius: 8,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  subInfo: {
    flex: 1,
    gap: 2,
  },
  subName: {
    fontSize: 13,
    fontWeight: "600",
  },
  subMeta: {
    fontSize: 12,
  },
  deleteBtn: {
    padding: 8,
  },
  emptySubText: {
    fontSize: 13,
    lineHeight: 18,
  },
  unsubBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
  },
  menuSection: {
    width: "100%",
    gap: 8,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  logoutText: {
    fontSize: 15,
  },
  settingsSection: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  settingsInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
  },
  saveBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 10,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  authContent: {
    padding: 24,
    gap: 14,
    flexGrow: 1,
    justifyContent: "center",
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  forgotDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  yandexBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    height: 50,
    overflow: "hidden",
    gap: 0,
  },
  yandexIcon: {
    width: 50,
    height: 50,
    backgroundColor: "#FC3F1D",
    alignItems: "center",
    justifyContent: "center",
  },
  yandexLetter: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  yandexText: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    paddingHorizontal: 4,
  },
  nameRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  fieldGroup: {
    gap: 6,
    width: "100%",
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  passwordRow: {
    flexDirection: "row",
    gap: 8,
  },
  passwordInput: {
    flex: 1,
  },
  eyeBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
    color: "#ff3b30",
  },
  successText: {
    fontSize: 13,
    textAlign: "center",
    color: "#10b981",
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
  },
  authLinksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  authLink: {
    fontSize: 14,
  },
  switchMode: {
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
  },
  chatLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: 4,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  orderRowLeft: {
    flex: 1,
    gap: 2,
  },
  orderRowRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  orderNum: {
    fontSize: 14,
    fontWeight: "600",
  },
  orderDate: {
    fontSize: 12,
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: "500",
  },
  orderTotal: {
    fontSize: 13,
    fontWeight: "700",
  },
  viewAllBtn: {
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
