import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { CdekData, Order, RawOrderItem, formatPrice } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачен",
  processing: "Собирается",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  awaiting_payment: "#f59e0b",
  paid: "#10b981",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_STEPS = [
  { key: "pending", label: "Оформлен" },
  { key: "paid", label: "Оплачен" },
  { key: "processing", label: "Собирается" },
  { key: "shipped", label: "Отправлен" },
  { key: "delivered", label: "Доставлен" },
];

const CANCELLABLE = ["pending", "paid", "processing"];

function parseCdek(raw: CdekData | string | null | undefined): CdekData | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw;
}

function parseItems(raw: RawOrderItem[] | string | undefined): RawOrderItem[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return raw;
}

function getOrderTotal(order: Order): number {
  return order.total ?? order.totalAmount ?? 0;
}

function StatusTracker({ status }: { status: string }) {
  const colors = useColors();
  const isCancelled = status === "cancelled";
  const currentIdx = isCancelled ? -1 : STATUS_STEPS.findIndex((s) => s.key === status);

  if (isCancelled) {
    return (
      <View style={[styles.cancelledBanner]}>
        <Feather name="x-circle" size={14} color="#ef4444" />
        <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "600", marginLeft: 6 }}>
          Заказ отменён
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tracker}>
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = currentIdx >= idx;
        const isCurrent = currentIdx === idx;
        return (
          <View key={step.key} style={styles.trackerStep}>
            <View style={styles.trackerDotCol}>
              <View
                style={[
                  styles.trackerDot,
                  {
                    backgroundColor: isCompleted ? "#ffffff" : "transparent",
                    borderColor: isCompleted ? "#ffffff" : colors.border,
                    borderWidth: 2,
                  },
                ]}
              >
                {isCompleted && (
                  <Feather name="check" size={10} color="#000" />
                )}
              </View>
              {idx < STATUS_STEPS.length - 1 && (
                <View
                  style={[
                    styles.trackerLine,
                    { backgroundColor: currentIdx > idx ? "#ffffff" : colors.border },
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.trackerLabel,
                {
                  color: isCurrent ? colors.foreground : isCompleted ? colors.foreground : colors.mutedForeground,
                  fontWeight: isCurrent ? "700" : "400",
                },
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

interface OrderCardProps {
  order: Order;
  onCancel: (id: number) => void;
  onRefreshTracking: (id: number) => void;
  onRefreshYandex: (id: number) => void;
  refreshingId: number | null;
}

function OrderCard({ order, onCancel, onRefreshTracking, onRefreshYandex, refreshingId }: OrderCardProps) {
  const colors = useColors();
  const [showItems, setShowItems] = useState(false);
  const [showTracking, setShowTracking] = useState(false);

  const cdek = parseCdek(order.cdekData);
  const items = parseItems(order.items).filter((i) => !("_discountDetails" in i));
  const statusColor = STATUS_COLORS[order.status] ?? "#999";
  const canCancel = CANCELLABLE.includes(order.status);
  const isRefreshing = refreshingId === order.id;

  const hasCdekOrder = !!(cdek?.orderUuid) && cdek?.deliveryService !== "yandex";
  const isYandex = cdek?.deliveryService === "yandex";
  const hasYandexOrder = isYandex && !!(cdek as any)?.ydRequestId;
  const hasTracking = hasCdekOrder || hasYandexOrder;
  const trackNumber = cdek?.cdekNumber ?? (cdek as any)?.ydTrackNumber ?? null;

  return (
    <View style={[styles.orderCard, { backgroundColor: colors.card }]}>
      <View style={styles.orderHeader}>
        <Text style={[styles.orderId, { color: colors.foreground }]}>
          Заказ #{order.id}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[order.status] ?? order.status}
          </Text>
        </View>
      </View>

      <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
        {new Date(order.createdAt).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </Text>

      <StatusTracker status={order.status} />

      <Text style={[styles.orderTotal, { color: colors.foreground }]}>
        {formatPrice(getOrderTotal(order))}
      </Text>

      {order.address ? (
        <Text style={[styles.orderAddress, { color: colors.mutedForeground }]} numberOfLines={2}>
          <Feather name="map-pin" size={12} /> {order.address}
        </Text>
      ) : null}

      {trackNumber ? (
        <View style={styles.cdekRow}>
          <Feather name="truck" size={13} color={colors.mutedForeground} />
          <Text style={[styles.cdekNumber, { color: colors.mutedForeground }]}>
            {isYandex ? "Яндекс Доставка" : "СДЭК"}{trackNumber ? `: ${trackNumber}` : ""}
          </Text>
        </View>
      ) : null}

      {cdek?.lastCdekStatusName ? (
        <Text style={[styles.cdekStatus, { color: "#8b5cf6" }]}>
          {cdek.lastCdekStatusName}
        </Text>
      ) : null}

      {(cdek as any)?.ydStatusName ? (
        <Text style={[styles.cdekStatus, { color: "#8b5cf6" }]}>
          {(cdek as any).ydStatusName}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {items.length > 0 && (
          <Pressable
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => setShowItems(!showItems)}
          >
            <Feather name="list" size={14} color={colors.mutedForeground} />
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
              {showItems ? "Скрыть" : `Товары (${items.length})`}
            </Text>
          </Pressable>
        )}

        {hasTracking && (
          <Pressable
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => {
              setShowTracking(!showTracking);
              if (!showTracking) {
                if (isYandex) onRefreshYandex(order.id);
                else onRefreshTracking(order.id);
              }
            }}
          >
            <Feather name="map" size={14} color={colors.mutedForeground} />
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>
              {showTracking ? "Скрыть" : "Трекинг"}
            </Text>
          </Pressable>
        )}

        {hasTracking && (
          <Pressable
            style={[styles.actionBtn, { borderColor: colors.border }]}
            onPress={() => {
              if (isYandex) onRefreshYandex(order.id);
              else onRefreshTracking(order.id);
            }}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size={14} color={colors.mutedForeground} />
            ) : (
              <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
            )}
            <Text style={[styles.actionText, { color: colors.mutedForeground }]}>Обновить</Text>
          </Pressable>
        )}

        {canCancel && (
          <Pressable
            style={[styles.actionBtn, { borderColor: "#ef4444" }]}
            onPress={() => onCancel(order.id)}
          >
            <Feather name="x" size={14} color="#ef4444" />
            <Text style={[styles.actionText, { color: "#ef4444" }]}>Отменить</Text>
          </Pressable>
        )}
      </View>

      {showItems && items.length > 0 && (
        <View style={[styles.itemsBlock, { borderTopColor: colors.border }]}>
          {items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                {item.name}
                {item.size ? ` · ${item.size}` : ""}
                {item.color ? ` · ${item.color}` : ""}
              </Text>
              <Text style={[styles.itemQty, { color: colors.mutedForeground }]}>
                {item.quantity} × {formatPrice(item.price)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {showTracking && cdek && (
        <View style={[styles.trackingBlock, { borderTopColor: colors.border }]}>
          {isRefreshing ? (
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
              <ActivityIndicator color="#8b5cf6" />
              <Text style={[styles.trackingEmpty, { color: colors.mutedForeground, marginTop: 8 }]}>
                Обновление трекинга...
              </Text>
            </View>
          ) : (() => {
            const statuses = cdek.cdekStatuses ?? (cdek as any).ydStatuses ?? [];
            return statuses.length > 0 ? (
              statuses.map((s: any, idx: number) => (
                <View key={idx} style={styles.trackingRow}>
                  <View style={[styles.trackingDot, { backgroundColor: idx === 0 ? "#8b5cf6" : colors.border }]} />
                  <View style={styles.trackingInfo}>
                    <Text style={[styles.trackingName, { color: colors.foreground }]}>{s.name}</Text>
                    <Text style={[styles.trackingMeta, { color: colors.mutedForeground }]}>
                      {s.date ? new Date(s.date).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : ""}
                      {s.city ? ` · ${s.city}` : ""}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.trackingEmpty, { color: colors.mutedForeground }]}>
                Нет данных о движении. Нажмите «Обновить».
              </Text>
            );
          })()}
        </View>
      )}
    </View>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshingId, setRefreshingId] = useState<number | null>(null);

  const { data: orders, isLoading, isError, refetch } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get("/auth/orders");
      return res.data?.orders ?? [];
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => api.post(`/auth/orders/${orderId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: any) => {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось отменить заказ");
    },
  });

  const handleCancel = (orderId: number) => {
    Alert.alert(
      "Отменить заказ",
      `Вы уверены, что хотите отменить заказ #${orderId}?`,
      [
        { text: "Нет", style: "cancel" },
        { text: "Отменить заказ", style: "destructive", onPress: () => cancelMutation.mutate(orderId) },
      ]
    );
  };

  const handleRefreshTracking = async (orderId: number) => {
    setRefreshingId(orderId);
    try {
      await api.post(`/auth/orders/${orderId}/refresh-tracking`);
      await refetch();
    } catch (e: any) {
      Alert.alert("Трекинг", e?.response?.data?.error ?? "Не удалось обновить статус");
    } finally {
      setRefreshingId(null);
    }
  };

  const handleRefreshYandex = async (orderId: number) => {
    setRefreshingId(orderId);
    try {
      await api.post(`/auth/orders/${orderId}/refresh-yandex-tracking`);
      await refetch();
    } catch (e: any) {
      Alert.alert("Трекинг", e?.response?.data?.error ?? "Не удалось обновить статус");
    } finally {
      setRefreshingId(null);
    }
  };

  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={48} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Войдите в аккаунт</Text>
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
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Ошибка загрузки заказов</Text>
        <Pressable onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.border }]}>
          <Text style={{ color: colors.foreground, fontSize: 14 }}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="package" size={56} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Заказов нет</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Ваши заказы появятся здесь</Text>
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
          <OrderCard
            order={item}
            onCancel={handleCancel}
            onRefreshTracking={handleRefreshTracking}
            onRefreshYandex={handleRefreshYandex}
            refreshingId={refreshingId}
          />
        )}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
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
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    borderRadius: 14,
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
    fontWeight: "700",
  },
  orderDate: {
    fontSize: 13,
  },
  tracker: {
    flexDirection: "row",
    marginVertical: 10,
    marginHorizontal: -4,
  },
  trackerStep: {
    flex: 1,
    alignItems: "center",
  },
  trackerDotCol: {
    alignItems: "center",
    position: "relative",
    width: "100%",
  },
  trackerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  trackerLine: {
    position: "absolute",
    top: 9,
    left: "50%",
    right: "-50%",
    height: 2,
    zIndex: 0,
  },
  trackerLabel: {
    fontSize: 9,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 12,
  },
  cancelledBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef444420",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginVertical: 4,
  },
  orderTotal: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  orderAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  cdekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  cdekNumber: {
    fontSize: 12,
  },
  cdekStatus: {
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemsBlock: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 10,
    gap: 8,
  },
  itemRow: {
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "500",
  },
  itemQty: {
    fontSize: 12,
  },
  trackingBlock: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 10,
    gap: 10,
  },
  trackingRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  trackingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  trackingInfo: {
    flex: 1,
    gap: 2,
  },
  trackingName: {
    fontSize: 13,
    fontWeight: "600",
  },
  trackingMeta: {
    fontSize: 12,
  },
  trackingEmpty: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
  },
});
