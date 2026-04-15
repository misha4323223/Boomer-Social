import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";
import { Order, formatPrice } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "В обработке",
  processing: "Обрабатывается",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data: orders, isLoading, isError } = useQuery<Order[]>({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const res = await api.get(`/orders/user/${user!.id}`);
      return res.data?.orders ?? res.data ?? [];
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Войдите в аккаунт
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Чтобы посмотреть историю заказов
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.foreground} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Ошибка загрузки заказов
        </Text>
      </View>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="package" size={56} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Заказов нет</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Ваши заказы появятся здесь
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        renderItem={({ item }) => (
          <View style={[styles.orderCard, { backgroundColor: colors.card }]}>
            <View style={styles.orderHeader}>
              <Text style={[styles.orderId, { color: colors.foreground }]}>
                Заказ #{item.id}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.statusText, { color: colors.foreground }]}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
              {new Date(item.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Text style={[styles.orderTotal, { color: colors.foreground }]}>
              Итого: {formatPrice(item.totalAmount)}
            </Text>
            {item.address && (
              <Text style={[styles.orderAddress, { color: colors.mutedForeground }]}>
                {item.address}
              </Text>
            )}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderDate: {
    fontSize: 13,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  orderAddress: {
    fontSize: 13,
  },
});
