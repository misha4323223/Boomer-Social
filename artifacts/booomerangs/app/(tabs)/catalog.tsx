import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/ProductCard";
import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";
import { Category, Product } from "@/lib/types";

interface ProductsPage {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

const PAGE_SIZE = 20;

function parseCategoriesResponse(data: any): Category[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    return Object.entries(data).map(([key, val]: [string, any]) => ({
      id: key,
      name: val.name ?? key,
      slug: val.slug ?? key,
      subcategories: val.subcategories ?? [],
    }));
  }
  return [];
}

export default function CatalogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const drawerAnim = useRef(new Animated.Value(width)).current;
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<any>(null);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, { toValue: width, duration: 240, useNativeDriver: true }).start(
      () => setDrawerOpen(false)
    );
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(text), 400);
  };

  const clearSearch = () => {
    setSearch("");
    setDebouncedSearch("");
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
  };

  const { data: categoriesRaw } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return parseCategoriesResponse(res.data?.categories ?? res.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories: Category[] = categoriesRaw ?? [];

  const handleDrawerCategoryPress = (key: string) => {
    setExpandedCat(expandedCat === key ? null : key);
  };

  const handleDrawerSubPress = (subName: string, catKey: string) => {
    setSelectedCategory(catKey);
    setSelectedSubcategory(subName);
    closeDrawer();
  };

  const handleDrawerAllPress = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    closeDrawer();
  };

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery<ProductsPage>({
      queryKey: ["products", selectedCategory, selectedSubcategory, debouncedSearch],
      queryFn: async ({ pageParam = 1 }) => {
        const params: Record<string, string | number> = { page: pageParam as number, limit: PAGE_SIZE };
        if (selectedCategory) params.category = selectedCategory;
        if (selectedSubcategory) params.subcategory = selectedSubcategory;
        if (debouncedSearch) params.search = debouncedSearch;
        const res = await api.get("/products", { params });
        const products: Product[] = res.data?.products ?? res.data ?? [];
        const pagination = res.data?.pagination ?? {
          page: pageParam as number,
          limit: PAGE_SIZE,
          total: products.length,
          totalPages: 1,
          hasMore: false,
        };
        return { products, pagination };
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    });

  const products = data?.pages.flatMap((p) => p.products) ?? [];

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const activeFilterLabel = selectedSubcategory
    ? selectedSubcategory
    : selectedCategory
    ? categories.find((c) => (c.slug ?? String(c.id)) === selectedCategory)?.name ?? null
    : null;

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={colors.foreground} size="small" />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* NAVBAR */}
      <View
        style={[
          styles.navbarWrap,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <View style={styles.navbarOuter}>
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.navbarInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.navIconBtn}>
              <Feather name="arrow-left" size={21} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.navTitle}>Все товары</Text>
            <View style={styles.navIcons}>
              <TouchableOpacity onPress={() => setSearchVisible((v) => !v)} style={styles.navIconBtn}>
                <Feather name={searchVisible ? "x" : "search"} size={21} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={openDrawer} style={styles.navIconBtn}>
                <Feather name="sliders" size={21} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {searchVisible && (
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={15} color={colors.mutedForeground} />
            <TextInput
              autoFocus
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Поиск товаров..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable onPress={clearSearch}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        )}

        {activeFilterLabel && (
          <View style={styles.activePillRow}>
            <View style={[styles.activePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.activePillText, { color: colors.foreground }]}>
                {activeFilterLabel}
              </Text>
              <Pressable onPress={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}>
                <Feather name="x" size={13} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* PRODUCT LIST */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.foreground} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            Ошибка загрузки товаров
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.retryText, { color: colors.foreground }]}>Повторить</Text>
          </Pressable>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Feather name="package" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Товары не найдены
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 90, paddingTop: insets.top + 80 },
          ]}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard product={item} />
            </View>
          )}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FILTER DRAWER */}
      <Modal visible={drawerOpen} transparent animationType="none" onRequestClose={closeDrawer}>
        <Pressable style={styles.backdrop} onPress={closeDrawer} />
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.background,
              borderLeftColor: colors.border,
              paddingTop: insets.top,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX: drawerAnim }],
            },
          ]}
        >
          <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.drawerTitle, { color: colors.foreground }]}>Фильтр</Text>
            <TouchableOpacity onPress={closeDrawer}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <TouchableOpacity
              style={[styles.drawerItem, { borderBottomColor: colors.border }]}
              onPress={handleDrawerAllPress}
            >
              <Text
                style={[
                  styles.drawerItemText,
                  {
                    color: !selectedCategory ? colors.foreground : colors.mutedForeground,
                    fontWeight: !selectedCategory ? "700" : "400",
                  },
                ]}
              >
                Все товары
              </Text>
              {!selectedCategory && <Feather name="check" size={16} color={colors.foreground} />}
            </TouchableOpacity>

            {categories.map((cat) => {
              const key = (cat.slug ?? String(cat.id)) as string;
              const isExpanded = expandedCat === key;
              const isCatActive = selectedCategory === key && !selectedSubcategory;

              return (
                <View key={key}>
                  <TouchableOpacity
                    style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleDrawerCategoryPress(key)}
                  >
                    <Text
                      style={[
                        styles.drawerItemText,
                        {
                          color: isCatActive ? colors.foreground : colors.mutedForeground,
                          fontWeight: isCatActive ? "700" : "500",
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                    <View style={styles.drawerItemRight}>
                      {isCatActive && <Feather name="check" size={14} color={colors.foreground} />}
                      <Feather
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={colors.mutedForeground}
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded &&
                    cat.subcategories?.map((sub) => {
                      const isSubActive = selectedSubcategory === sub.name;
                      return (
                        <TouchableOpacity
                          key={sub.slug}
                          style={[styles.drawerSubItem, { borderBottomColor: colors.border }]}
                          onPress={() => handleDrawerSubPress(sub.name, key)}
                        >
                          <View style={[styles.subDot, { backgroundColor: colors.border }]} />
                          <Text
                            style={[
                              styles.drawerSubText,
                              {
                                color: isSubActive ? colors.foreground : colors.mutedForeground,
                                fontWeight: isSubActive ? "600" : "400",
                              },
                            ]}
                          >
                            {sub.name}
                          </Text>
                          {isSubActive && (
                            <Feather name="check" size={13} color={colors.foreground} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navbarWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  navbarOuter: {
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  navbarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  navTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.4,
  },
  navIcons: { flexDirection: "row", alignItems: "center" },
  navIconBtn: { padding: 6 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  activePillRow: { flexDirection: "row", paddingHorizontal: 4 },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  activePillText: { fontSize: 13, fontWeight: "500" },
  row: { gap: 12, paddingHorizontal: 12 },
  list: { gap: 12, paddingTop: 12 },
  cardWrapper: { flex: 1 },
  footerLoader: { padding: 16, alignItems: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 15 },
  emptyText: { fontSize: 15 },
  retryBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { fontSize: 14 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.5)" },
  drawer: { position: "absolute", top: 0, right: 0, bottom: 0, width: "75%", borderLeftWidth: 1 },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  drawerTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  drawerItemText: { fontSize: 15 },
  drawerItemRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  drawerSubItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 36,
    paddingRight: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  subDot: { width: 5, height: 5, borderRadius: 3 },
  drawerSubText: { flex: 1, fontSize: 14 },
});
