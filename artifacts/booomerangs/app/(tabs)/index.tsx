import { Feather } from "@expo/vector-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 400);
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

  const activeCategory = categories.find(
    (cat) => (cat.slug ?? String(cat.id)) === selectedCategory
  );
  const subcategories = activeCategory?.subcategories ?? [];

  const handleCategorySelect = (key: string | null) => {
    setSelectedCategory(key);
    setSelectedSubcategory(null);
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<ProductsPage>({
    queryKey: ["products", selectedCategory, selectedSubcategory, debouncedSearch],
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, string | number> = {
        page: pageParam as number,
        limit: PAGE_SIZE,
      };
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
  const total = data?.pages[0]?.pagination.total;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, backgroundColor: colors.background },
        ]}
      >
        <View style={styles.titleRow}>
          <Image
            source={require("../../assets/boomerangs-logo.webp")}
            style={styles.logo}
            resizeMode="contain"
          />
          {total !== undefined && (
            <Text style={[styles.totalCount, { color: colors.mutedForeground }]}>
              {total} товаров
            </Text>
          )}
        </View>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Поиск..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={clearSearch}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            <Pressable
              onPress={() => handleCategorySelect(null)}
              style={[
                styles.catChip,
                {
                  backgroundColor: !selectedCategory ? colors.foreground : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.catText,
                  { color: !selectedCategory ? colors.background : colors.mutedForeground },
                ]}
              >
                Все
              </Text>
            </Pressable>
            {categories.map((cat) => {
              const key = (cat.slug ?? String(cat.id)) as string;
              const active = selectedCategory === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => handleCategorySelect(active ? null : key)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: active ? colors.foreground : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.catText,
                      { color: active ? colors.background : colors.mutedForeground },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
        {subcategories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            <Pressable
              onPress={() => setSelectedSubcategory(null)}
              style={[
                styles.subChip,
                {
                  backgroundColor: !selectedSubcategory ? colors.foreground : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.subText,
                  { color: !selectedSubcategory ? colors.background : colors.mutedForeground },
                ]}
              >
                Все
              </Text>
            </Pressable>
            {subcategories.map((sub) => {
              const active = selectedSubcategory === sub.name;
              return (
                <Pressable
                  key={sub.slug}
                  onPress={() => setSelectedSubcategory(active ? null : sub.name)}
                  style={[
                    styles.subChip,
                    {
                      backgroundColor: active ? colors.foreground : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.subText,
                      { color: active ? colors.background : colors.mutedForeground },
                    ]}
                  >
                    {sub.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.foreground} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            Ошибка загрузки товаров
          </Text>
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, { borderColor: colors.border }]}>
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
          data={products}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 90 },
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 160,
    height: 48,
  },
  totalCount: {
    fontSize: 13,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  categories: {
    gap: 8,
    paddingRight: 16,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  catText: {
    fontSize: 13,
    fontWeight: "500",
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  subText: {
    fontSize: 12,
    fontWeight: "400",
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 10,
  },
  row: {
    gap: 10,
  },
  cardWrapper: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 15,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
