import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Image } from "expo-image";
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

import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";
import { formatPrice } from "@/lib/types";

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
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.foreground} size="large" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="shopping-cart" size={56} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Корзина пуста</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Добавьте товары из каталога
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/")}
          style={[styles.shopBtn, { backgroundColor: colors.foreground }]}
        >
          <Text style={[styles.shopBtnText, { color: colors.background }]}>
            Перейти в каталог
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: tabBarHeight }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 8 },
        ]}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, { backgroundColor: colors.card }]}>
            <Image
              source={{ uri: item.product?.thumbnailUrl || item.product?.imageUrl }}
              style={styles.itemImage}
              contentFit="cover"
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
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Feather name="plus" size={16} color={colors.foreground} />
                </Pressable>
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => removeItem(item.id)}
                >
                  <Feather name="trash-2" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          </View>
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
  container: {
    flex: 1,
  },
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
  cartItem: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
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
  totalLabel: {
    fontSize: 15,
  },
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
