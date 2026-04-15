import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";
import { Product, ProductVariant, formatPrice } from "@/lib/types";

const { width } = Dimensions.get("window");

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data?.product ?? res.data;
    },
    enabled: !!id,
  });

  const { data: variants } = useQuery<ProductVariant[]>({
    queryKey: ["variants", id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}/variants`);
      return res.data?.variants ?? res.data ?? [];
    },
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart(product.id, selectedSize ?? undefined, selectedColor ?? product.color ?? undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.foreground} size="large" />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Товар не найден
        </Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.foreground }]}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  const fav = isFavorite(product.id);
  const sizes = product.sizes ?? [];
  const colors_list = variants?.map(v => v.color).filter(Boolean) ?? [];
  if (product.color && !colors_list.includes(product.color)) {
    colors_list.unshift(product.color);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        <Image
          source={{ uri: product.imageUrl }}
          style={[styles.productImage, { width }]}
          contentFit="cover"
        />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
            <Pressable onPress={() => toggle(product)}>
              <Feather name="heart" size={22} color={fav ? "#ff3b30" : colors.mutedForeground} />
            </Pressable>
          </View>
          <Text style={[styles.productPrice, { color: colors.foreground }]}>
            {formatPrice(product.price)}
          </Text>

          {product.sku && (
            <Text style={[styles.sku, { color: colors.mutedForeground }]}>
              Артикул: {product.sku}
            </Text>
          )}

          {sizes.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Размер</Text>
              <View style={styles.optionRow}>
                {sizes.map((size) => (
                  <Pressable
                    key={size}
                    onPress={() => setSelectedSize(selectedSize === size ? null : size)}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selectedSize === size ? colors.foreground : colors.card,
                        borderColor: selectedSize === size ? colors.foreground : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: selectedSize === size ? colors.background : colors.foreground },
                      ]}
                    >
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {colors_list.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Цвет</Text>
              <View style={styles.optionRow}>
                {colors_list.map((clr) => (
                  <Pressable
                    key={clr}
                    onPress={() => setSelectedColor(selectedColor === clr ? null : clr)}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selectedColor === clr ? colors.foreground : colors.card,
                        borderColor: selectedColor === clr ? colors.foreground : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: selectedColor === clr ? colors.background : colors.foreground },
                      ]}
                    >
                      {clr}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {product.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Описание</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {product.description}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: added ? "#22c55e" : colors.foreground,
              opacity: pressed || adding ? 0.8 : 1,
            },
          ]}
          onPress={handleAddToCart}
          disabled={adding}
        >
          {adding ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.addBtnText, { color: colors.background }]}>
              {added ? "Добавлено!" : "В корзину"}
            </Text>
          )}
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
  },
  errorText: { fontSize: 16 },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  backBtnText: { fontSize: 14, fontWeight: "600" },
  productImage: {
    height: width * 1.1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  productName: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "800",
  },
  sku: {
    fontSize: 12,
  },
  section: {
    gap: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  addBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
