import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { CompactHeader } from "@/components/CompactHeader";
import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import { formatPrice } from "@/lib/types";

const DELETE_THRESHOLD = -75;

interface CartItemProps {
  item: any;
  colors: any;
  updateQuantity: (id: number, qty: number) => void;
  removeItem: (id: number) => void;
}

function SwipeableCartItem({ item, colors, updateQuantity, removeItem }: CartItemProps) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue<number | undefined>(undefined);

  const triggerDelete = (id: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    removeItem(id);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX * 0.85, -110);
      } else {
        translateX.value = Math.min(e.translationX * 0.3, 10);
      }
    })
    .onEnd(() => {
      if (translateX.value < DELETE_THRESHOLD) {
        translateX.value = withTiming(-500, { duration: 220 });
        runOnJS(triggerDelete)(item.id);
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 200 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / Math.abs(DELETE_THRESHOLD), 1);
    return {
      opacity: progress,
      transform: [{ scale: 0.7 + 0.3 * progress }],
    };
  });

  return (
    <View style={styles.swipeWrapper}>
      <View style={[styles.deleteBack, { backgroundColor: "#ef4444" }]}>
        <Reanimated.View style={deleteStyle}>
          <Feather name="trash-2" size={24} color="#fff" />
          <Text style={styles.deleteLabel}>Удалить</Text>
        </Reanimated.View>
      </View>

      <GestureDetector gesture={pan}>
        <Reanimated.View
          style={[styles.cartItem, { backgroundColor: colors.card }, rowStyle]}
        >
          <Image
            source={{ uri: item.product?.thumbnailUrl || item.product?.imageUrl }}
            style={styles.itemImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
              {item.product?.name ?? "Товар"}
            </Text>
            {item.size && (
              <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                Размер: {item.size}
              </Text>
            )}
            {item.color && (
              <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                Цвет: {item.color}
              </Text>
            )}
            <Text style={[styles.itemPrice, { color: colors.foreground }]}>
              {formatPrice((item.product?.price ?? 0) * item.quantity)}
            </Text>
            <View style={styles.qtyRow}>
              <Pressable
                style={[styles.qtyBtn, { borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1);
                  else removeItem(item.id);
                }}
              >
                <Feather name="minus" size={16} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.qtyText, { color: colors.foreground }]}>
                {item.quantity}
              </Text>
              <Pressable
                style={[styles.qtyBtn, { borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateQuantity(item.id, item.quantity + 1);
                }}
              >
                <Feather name="plus" size={16} color={colors.foreground} />
              </Pressable>
              <Pressable
                style={styles.removeBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  removeItem(item.id);
                }}
              >
                <Feather name="trash-2" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
}

export default function CartScreen() {
  const colors = useColors();
  const tabBarHeight = useBottomTabBarHeight();
  const { items, isLoading, updateQuantity, removeItem } = useCart();

  const total = items.reduce((sum, item) => {
    const price = item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CompactHeader title="Корзина" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.foreground} size="large" />
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CompactHeader title="Корзина" />
        <View style={styles.center}>
          <Feather name="shopping-cart" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Корзина пуста</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Добавьте товары из каталога
          </Text>
          <Pressable
            onPress={() => router.push("/")}
            style={[styles.shopBtn, { backgroundColor: colors.foreground }]}
          >
            <Text style={[styles.shopBtnText, { color: colors.background }]}>
              Перейти в каталог
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: tabBarHeight }]}>
      <CompactHeader title="Корзина" />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: 8 }]}
        renderItem={({ item }) => (
          <SwipeableCartItem
            item={item}
            colors={colors}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: 16,
          },
        ]}
      >
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Итого:</Text>
          <Text style={[styles.totalAmount, { color: colors.foreground }]}>
            {formatPrice(total)}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.checkoutBtn,
            { backgroundColor: colors.foreground, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => router.push("/checkout" as any)}
        >
          <Text style={[styles.checkoutText, { color: colors.background }]}>
            Оформить заказ
          </Text>
        </Pressable>
      </View>
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
  shopBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  shopBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  swipeWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  deleteBack: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 12,
  },
  deleteLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  cartItem: {
    flexDirection: "row",
    borderRadius: 12,
    gap: 12,
    padding: 12,
  },
  itemImage: {
    width: 90,
    height: 120,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  itemMeta: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
  },
  removeBtn: {
    marginLeft: "auto",
    padding: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 15 },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
  },
  checkoutBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
