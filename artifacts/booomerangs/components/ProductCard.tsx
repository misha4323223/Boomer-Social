import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import { Product, formatPrice } from "@/lib/types";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const colors = useColors();
  const { isFavorite, toggle } = useFavorites();

  const fav = isFavorite(product.id);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, opacity: pressed ? 0.92 : 1 },
      ]}
      onPress={() => router.push(`/product/${product.id}` as any)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.thumbnailUrl || product.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {product.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        {product.onSale && (
          <View style={[styles.newBadge, { backgroundColor: "#ef4444" }]}>
            <Text style={styles.newBadgeText}>SALE</Text>
          </View>
        )}
        <Pressable
          style={[styles.favBtn, { backgroundColor: colors.background }]}
          onPress={() => toggle(product)}
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
        {product.sku ? (
          <Text style={[styles.sku, { color: colors.mutedForeground }]}>
            Арт: {product.sku}
          </Text>
        ) : null}

        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
          {product.name}
        </Text>

        <Text style={[styles.price, { color: colors.foreground }]}>
          {formatPrice(product.price)}
        </Text>

        {product.price >= 300000 && (
          <View style={[styles.dolyame, { borderColor: colors.border }]}>
            <View style={styles.dolyameBars}>
              {[0.45, 0.65, 0.82, 1.0].map((h, i) => (
                <View
                  key={i}
                  style={[styles.dolyameBar, { height: 9 * h, backgroundColor: colors.foreground }]}
                />
              ))}
            </View>
            <Text style={[styles.dolyameLabel, { color: colors.foreground }]}>ДОЛЯМИ</Text>
            <Text style={[styles.dolyameAmt, { color: colors.mutedForeground }]}>
              4 × {new Intl.NumberFormat("ru-RU").format(Math.round(product.price / 4 / 100))} ₽
            </Text>
          </View>
        )}

        {product.inStock === false && (
          <Text style={styles.outOfStock}>Нет в наличии</Text>
        )}
      </View>
    </Pressable>
  );
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
  outOfStock: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "500",
  },
  dolyame: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  dolyameBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 1.5,
  },
  dolyameBar: {
    width: 3,
    borderRadius: 1.5,
  },
  dolyameLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dolyameAmt: {
    fontSize: 9,
    fontWeight: "500",
  },
});
