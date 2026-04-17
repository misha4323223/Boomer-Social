import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
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
import { colorToHex } from "@/lib/groupProducts";
import { Product, formatPrice } from "@/lib/types";

const { width } = Dimensions.get("window");

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { addToCart } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      const detail: Product = res.data?.product ?? res.data;

      const cachedPages = queryClient.getQueriesData<{ products: Product[] }>({ queryKey: ["products"] });
      let cached: Product | undefined;
      for (const [, data] of cachedPages) {
        const pages = (data as any)?.pages ?? [];
        for (const page of pages) {
          const found = (page?.products ?? []).find((p: Product) => String(p.id) === String(id));
          if (found) { cached = found; break; }
        }
        if (cached) break;
      }

      if (cached) {
        return {
          ...detail,
          noSize: detail.noSize ?? cached.noSize,
          sizeStock: detail.sizeStock ?? cached.sizeStock,
          sizes: detail.sizes ?? cached.sizes,
        };
      }
      return detail;
    },
    enabled: !!id,
  });

  // Запрашиваем варианты товара напрямую с сервера
  const { data: colorVariants = [] } = useQuery<Product[]>({
    queryKey: ["product-variants", id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}/variants`);
      const list: Product[] = Array.isArray(res.data) ? res.data : [];
      return list.length > 1 ? list : [];
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const handleAddToCart = async () => {
    if (!product) return;
    const sizes = product.noSize ? [] : (product.sizes ?? []);
    if (sizes.length > 0 && !selectedSize) return;

    setAdding(true);

    let sizeToSend: string | undefined = selectedSize ?? undefined;
    if (product.noSize) {
      if (product.sizes && product.sizes.length > 0) {
        sizeToSend = product.sizes[0];
      } else if (product.sizeStock) {
        const sizeEntry = Object.entries(product.sizeStock).find(
          ([key, stock]) => key !== "One Size" && stock > 0
        );
        if (sizeEntry) sizeToSend = sizeEntry[0];
      }
    }

    console.log("[Cart] noSize:", product.noSize, "sizeStock:", product.sizeStock, "sizes:", product.sizes, "sizeToSend:", sizeToSend);

    try {
      await addToCart(product.id, sizeToSend, product.color ?? undefined);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      console.error("[Cart] addToCart error:", err?.response?.data ?? err?.message ?? err);
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
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.backBtnText, { color: colors.foreground }]}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  const fav = isFavorite(product.id);
  const sizes = product.noSize ? [] : (product.sizes ?? []);
  const allImages = product.images && product.images.length > 0
    ? product.images
    : [product.imageUrl].filter(Boolean);

  const needSize = sizes.length > 0 && !selectedSize;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Плавающая кнопка назад */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={({ pressed }) => [
          styles.floatingBack,
          { top: insets.top + 8, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Feather name="chevron-left" size={22} color="#ffffff" />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}>
        {/* Галерея изображений */}
        {allImages.length > 1 ? (
          <View>
            <FlatList
              data={allImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(_, i) => String(i)}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveImage(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width, height: width * 1.1 }}
                  contentFit="cover"
                />
              )}
            />
            <View style={styles.dots}>
              {allImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === activeImage ? colors.foreground : colors.border,
                      width: i === activeImage ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
          <Image
            source={{ uri: allImages[0] }}
            style={[styles.productImage, { width }]}
            contentFit="cover"
          />
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
            <Pressable onPress={() => toggle(product)} hitSlop={8}>
              <Feather name="heart" size={22} color={fav ? "#ff3b30" : colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: colors.foreground }]}>
              {formatPrice(product.price)}
            </Text>
            {product.inStock === false ? (
              <View style={[styles.badge, { backgroundColor: "#ff3b3020" }]}>
                <Text style={[styles.badgeText, { color: "#ff3b30" }]}>Нет в наличии</Text>
              </View>
            ) : product.isNew ? (
              <View style={[styles.badge, { backgroundColor: "#22c55e20" }]}>
                <Text style={[styles.badgeText, { color: "#22c55e" }]}>Новинка</Text>
              </View>
            ) : null}
          </View>

          {product.sku && (
            <Text style={[styles.sku, { color: colors.mutedForeground }]}>
              Артикул: {product.sku}
            </Text>
          )}

          {/* Цветовые варианты */}
          {colorVariants.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Цвет</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantRow}>
                {colorVariants.map((v) => {
                  const isActive = String(v.id) === String(product.id);
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => {
                        if (!isActive) router.replace(`/product/${v.id}` as any);
                      }}
                      style={[
                        styles.variantThumb,
                        {
                          borderColor: isActive ? colors.foreground : colors.border,
                          borderWidth: isActive ? 2 : 1,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: v.thumbnailUrl || v.imageUrl }}
                        style={styles.variantImg}
                        contentFit="cover"
                        transition={150}
                      />
                      {v.color && (
                        <View style={[styles.colorDot, { backgroundColor: colorToHex(v.color) }]} />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Размеры */}
          {sizes.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Размер</Text>
                {needSize && (
                  <Text style={{ fontSize: 12, color: "#ff3b30" }}>Выберите размер</Text>
                )}
              </View>
              <View style={styles.optionRow}>
                {sizes.map((size) => {
                  const inStock = product.sizeStock ? (product.sizeStock[size] ?? 0) > 0 : true;
                  return (
                    <Pressable
                      key={size}
                      onPress={() => inStock && setSelectedSize(selectedSize === size ? null : size)}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: selectedSize === size ? colors.foreground : colors.card,
                          borderColor: needSize && !selectedSize
                            ? "#ff3b30"
                            : selectedSize === size
                              ? colors.foreground
                              : colors.border,
                          opacity: inStock ? 1 : 0.4,
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
                  );
                })}
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

          {product.composition && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Состав</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {product.composition}
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
              backgroundColor: added ? "#22c55e" : needSize ? colors.card : colors.foreground,
              opacity: pressed || adding ? 0.8 : 1,
              borderWidth: needSize ? 1 : 0,
              borderColor: "#ff3b30",
            },
          ]}
          onPress={handleAddToCart}
          disabled={adding || product.inStock === false}
        >
          {adding ? (
            <ActivityIndicator color={needSize ? colors.foreground : colors.background} />
          ) : (
            <Text
              style={[
                styles.addBtnText,
                { color: added ? "#fff" : needSize ? "#ff3b30" : colors.background },
              ]}
            >
              {product.inStock === false
                ? "Нет в наличии"
                : added
                  ? "Добавлено!"
                  : needSize
                    ? "Выберите размер"
                    : "В корзину"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  floatingBack: {
    position: "absolute",
    left: 12,
    zIndex: 100,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
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
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingVertical: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
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
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "800",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sku: {
    fontSize: 12,
  },
  section: {
    gap: 10,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  variantRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  variantThumb: {
    borderRadius: 10,
    overflow: "hidden",
    width: 72,
    height: 96,
    position: "relative",
  },
  variantImg: {
    width: "100%",
    height: "100%",
  },
  colorDot: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
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
