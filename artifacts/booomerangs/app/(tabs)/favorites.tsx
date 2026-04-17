import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompactHeader } from "@/components/CompactHeader";
import { ProductCard } from "@/components/ProductCard";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CompactHeader title="Избранное" />
        <View style={styles.center}>
          <Feather name="heart" size={56} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Нет избранных</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Нажмите на сердечко у товара, чтобы добавить
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/")}
            style={[styles.shopBtn, { backgroundColor: colors.foreground }]}
          >
            <Text style={[styles.shopBtnText, { color: colors.background }]}>В каталог</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CompactHeader title="Избранное" />
      <FlatList
        data={favorites}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProductCard product={item} />
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
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },
  row: { gap: 10 },
  cardWrapper: { flex: 1 },
});
