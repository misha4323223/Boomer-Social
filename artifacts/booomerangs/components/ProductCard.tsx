import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import { Product, formatPrice } from "@/lib/types";

interface Props {
  product: Product;
  variants?: Product[];
}

export function ProductCard({ product: initialProduct, variants = [] }: Props) {
  const colors = useColors();
  const { isFavorite, toggle } = useFavorites();

  const [activeProduct, setActiveProduct] = useState<Product>(initialProduct);
  const fav = isFavorite(activeProduct.id);

  const sizes = activeProduct.noSize ? [] : (activeProduct.sizes ?? []);
  const hasSizes = sizes.length > 0;

  const colorVariants = variants.filter((v) => v.color && v.id !== initialProduct.id);
  const hasVariants = colorVariants.length > 0 && variants.some((v) => v.color);

  const getStockForSize = (size: string) => {
    if (!activeProduct.sizeStock) return true;
    return (activeProduct.sizeStock[size] ?? 0) > 0;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, opacity: pressed ? 0.92 : 1 },
      ]}
      onPress={() => router.push(`/product/${activeProduct.id}` as any)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: activeProduct.thumbnailUrl || activeProduct.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {activeProduct.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        {activeProduct.onSale && (
          <View style={[styles.newBadge, { backgroundColor: "#ef4444" }]}>
            <Text style={styles.newBadgeText}>SALE</Text>
          </View>
        )}
        <Pressable
          style={[styles.favBtn, { backgroundColor: colors.background }]}
          onPress={(e) => {
            toggle(activeProduct);
          }}
          hitSlop={8}
        >
          <Feather
            name="heart"
            size={16}
            color={fav ? "#ff3b30" : colors.mutedForeground}
          />
        </Pressable>
      </View>

      <View style={styles.info}>
        {activeProduct.sku ? (
          <Text style={[styles.sku, { color: colors.mutedForeground }]}>
            Арт: {activeProduct.sku}
          </Text>
        ) : null}

        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {activeProduct.name}
        </Text>

        <Text style={[styles.price, { color: colors.foreground }]}>
          {formatPrice(activeProduct.price)}
        </Text>

        {/* Variant thumbnails */}
        {hasVariants && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.variantRow}
          >
            <VariantThumb
              product={initialProduct}
              isActive={activeProduct.id === initialProduct.id}
              onPress={() => setActiveProduct(initialProduct)}
            />
            {colorVariants.map((v) => (
              <VariantThumb
                key={v.id}
                product={v}
                isActive={activeProduct.id === v.id}
                onPress={() => setActiveProduct(v)}
              />
            ))}
          </ScrollView>
        )}

        {/* Size chips */}
        {hasSizes && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sizesRow}
          >
            {sizes.map((size) => {
              const inStock = getStockForSize(size);
              return (
                <View
                  key={size}
                  style={[
                    styles.sizeChip,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      opacity: inStock ? 1 : 0.35,
                    },
                  ]}
                >
                  <Text style={[styles.sizeChipText, { color: colors.foreground }]}>
                    {size}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}

        {activeProduct.inStock === false && (
          <Text style={styles.outOfStock}>Нет в наличии</Text>
        )}
      </View>
    </Pressable>
  );
}

function ColorDot({
  color,
  isActive,
  onPress,
}: {
  color?: string | null;
  isActive: boolean;
  onPress: () => void;
}) {
  const hex = colorToHex(color);
  const isLight = isLightColor(hex);
  return (
    <Pressable
      onPress={(e) => {
        onPress();
      }}
      style={[
        styles.colorDot,
        {
          backgroundColor: hex,
          borderColor: isActive ? "#888" : isLight ? "#ddd" : "transparent",
          borderWidth: isActive ? 2 : 1,
          transform: [{ scale: isActive ? 1.18 : 1 }],
        },
      ]}
      hitSlop={4}
    />
  );
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 180;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    flex: 1,
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  newBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#000000",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    padding: 10,
    gap: 4,
  },
  sku: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingVertical: 2,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  sizesRow: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 2,
  },
  sizeChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  sizeChipText: {
    fontSize: 10,
    fontWeight: "600",
  },
  outOfStock: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "500",
  },
});
