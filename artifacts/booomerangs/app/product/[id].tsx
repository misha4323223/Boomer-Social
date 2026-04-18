import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
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
  const { user } = useAuth();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Stock notify modal
  const [stockModal, setStockModal] = useState<{ size: string } | null>(null);
  const [stockEmail, setStockEmail] = useState("");

  // Price drop modal (for guests)
  const [priceDropModal, setPriceDropModal] = useState(false);
  const [priceDropEmail, setPriceDropEmail] = useState("");

  // Share / Hint
  const [linkCopied, setLinkCopied] = useState(false);
  const [hintCopied, setHintCopied] = useState(false);

  // ─── Fetch product ────────────────────────────────────────────────────────
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

  // ─── Check price-drop subscription for this product ───────────────────────
  const { data: priceDropCheck, refetch: refetchPriceDrop } = useQuery<{ subscribed: boolean }>({
    queryKey: ["price-drop-check", id, user?.email ?? ""],
    queryFn: async () => {
      const res = await api.get(
        `/price-drop-notify/check?productId=${id}&email=${encodeURIComponent(user!.email!)}`
      );
      return res.data;
    },
    enabled: !!id && !!user?.email,
  });

  const priceDropSubscribed = priceDropCheck?.subscribed ?? false;

  // ─── Fetch all stock subscriptions for current user (to know which sizes) ─
  const { data: stockNotifyData, refetch: refetchStockNotify } = useQuery<{ subscriptions: any[] }>({
    queryKey: ["stock-notify-my", user?.email ?? ""],
    queryFn: async () => {
      const res = await api.get(`/stock-notify/my?email=${encodeURIComponent(user!.email!)}`);
      return res.data;
    },
    enabled: !!user?.email,
    staleTime: 0,
  });

  // Sizes that the user has already subscribed to for THIS product
  const subscribedSizes = new Set<string>(
    (stockNotifyData?.subscriptions ?? [])
      .filter((s: any) => String(s.productId) === String(id))
      .map((s: any) => s.size as string)
  );

  // ─── Mutations ────────────────────────────────────────────────────────────
  const invalidateSubscriptions = (email: string) => {
    queryClient.invalidateQueries({ queryKey: ["stock-notify-my", email] });
    queryClient.invalidateQueries({ queryKey: ["price-drop-my", email] });
    queryClient.invalidateQueries({ queryKey: ["price-drop-check", id, email] });
  };

  // Subscribe to stock
  const stockSubscribeMutation = useMutation({
    mutationFn: async ({ size, email }: { size: string; email: string }) => {
      await api.post("/stock-notify", {
        productId: Number(id),
        productName: product?.name ?? "",
        size,
        email,
      });
    },
    onSuccess: (_, { email }) => {
      setStockModal(null);
      setStockEmail("");
      invalidateSubscriptions(email);
      refetchStockNotify();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert("Ошибка", err?.response?.data?.error ?? "Не удалось оформить подписку");
    },
  });

  // Unsubscribe from stock
  const stockUnsubscribeMutation = useMutation({
    mutationFn: async ({ size, email }: { size: string; email: string }) => {
      await api.delete("/stock-notify", { data: { productId: Number(id), size, email } });
    },
    onSuccess: (_, { email }) => {
      invalidateSubscriptions(email);
      refetchStockNotify();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert("Ошибка", err?.response?.data?.error ?? "Не удалось отменить подписку");
    },
  });

  // Subscribe to price drop
  const priceDropSubscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      await api.post("/price-drop-notify", {
        productId: Number(id),
        productName: product?.name ?? "",
        email,
      });
    },
    onSuccess: (_, email) => {
      setPriceDropModal(false);
      setPriceDropEmail("");
      invalidateSubscriptions(email);
      refetchPriceDrop();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert("Ошибка", err?.response?.data?.error ?? "Не удалось оформить подписку");
    },
  });

  // Unsubscribe from price drop
  const priceDropUnsubscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      await api.delete("/price-drop-notify", { data: { productId: Number(id), email } });
    },
    onSuccess: (_, email) => {
      invalidateSubscriptions(email);
      refetchPriceDrop();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err: any) => {
      Alert.alert("Ошибка", err?.response?.data?.error ?? "Не удалось отменить подписку");
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
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

  const handleSizePress = (size: string, inStock: boolean) => {
    if (inStock) {
      setSelectedSize(selectedSize === size ? null : size);
      return;
    }
    // Out of stock — toggle subscribe/unsubscribe
    const email = user?.email;
    const alreadySubscribed = subscribedSizes.has(size);

    if (alreadySubscribed && email) {
      Alert.alert(
        "Отменить подписку",
        `Отписаться от уведомления о поступлении размера ${size}?`,
        [
          { text: "Нет", style: "cancel" },
          {
            text: "Отписаться",
            style: "destructive",
            onPress: () => stockUnsubscribeMutation.mutate({ size, email }),
          },
        ]
      );
      return;
    }

    if (email) {
      stockSubscribeMutation.mutate({ size, email });
    } else {
      setStockEmail("");
      setStockModal({ size });
    }
  };

  const handlePriceDropPress = () => {
    const email = user?.email;

    if (priceDropSubscribed && email) {
      Alert.alert(
        "Отменить подписку",
        "Отписаться от уведомлений о снижении цены?",
        [
          { text: "Нет", style: "cancel" },
          {
            text: "Отписаться",
            style: "destructive",
            onPress: () => priceDropUnsubscribeMutation.mutate(email),
          },
        ]
      );
      return;
    }

    if (email) {
      priceDropSubscribeMutation.mutate(email);
    } else {
      setPriceDropEmail("");
      setPriceDropModal(true);
    }
  };

  // ─── Loading / Error states ────────────────────────────────────────────────
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
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>Товар не найден</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.foreground }]}>Назад</Text>
        </Pressable>
      </View>
    );
  }

  const fav = isFavorite(product.id);
  const sizes = product.noSize ? [] : (product.sizes ?? []);
  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.imageUrl].filter(Boolean);
  const needSize = sizes.length > 0 && !selectedSize;
  const allOutOfStock = product.inStock === false;

  const priceDropLoading =
    priceDropSubscribeMutation.isPending || priceDropUnsubscribeMutation.isPending;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const getProductUrl = (hint = false) => {
    const slug = product?.slug || id;
    const base = `https://booomerangs.ru/${slug}`;
    return hint ? `${base}?hint=1` : base;
  };

  const handleShare = async () => {
    if (!product) return;
    const url = getProductUrl();
    try {
      await Share.share({ message: `${product.name} — ${url}`, url });
    } catch {
      await Clipboard.setStringAsync(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleHint = async () => {
    if (!product) return;
    const url = getProductUrl(true);
    await Clipboard.setStringAsync(url);
    setHintCopied(true);
    setTimeout(() => setHintCopied(false), 2500);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          style={({ pressed }) => [styles.headerBack, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
          <Text style={[styles.headerBackText, { color: colors.foreground }]}>Назад</Text>
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable onPress={handleShare} hitSlop={8} style={styles.headerIconBtn}>
            <Feather
              name={linkCopied ? "check" : "share-2"}
              size={20}
              color={linkCopied ? "#22c55e" : colors.mutedForeground}
            />
          </Pressable>
          <Pressable onPress={() => toggle(product)} hitSlop={8} style={styles.headerIconBtn}>
            <Feather name="heart" size={20} color={fav ? "#ff3b30" : colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}
      >
        {/* ─── Gallery ──────────────────────────────────────────────────── */}
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
                  style={{ width, height: width * 1.35, backgroundColor: "#1a1a1a" }}
                  contentFit="contain"
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
            style={[styles.productImage, { width, backgroundColor: "#1a1a1a" }]}
            contentFit="contain"
          />
        )}

        <View style={styles.content}>
          {/* ─── Title ──────────────────────────────────────────────────── */}
          <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>

          {/* ─── Price + badge ───────────────────────────────────────────── */}
          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: colors.foreground }]}>
              {formatPrice(product.price)}
            </Text>
            {allOutOfStock ? (
              <View style={[styles.badge, { backgroundColor: "#ff3b3020" }]}>
                <Text style={[styles.badgeText, { color: "#ff3b30" }]}>Нет в наличии</Text>
              </View>
            ) : product.isNew ? (
              <View style={[styles.badge, { backgroundColor: "#22c55e20" }]}>
                <Text style={[styles.badgeText, { color: "#22c55e" }]}>Новинка</Text>
              </View>
            ) : null}
          </View>

          {/* ─── Action buttons row ──────────────────────────────────────── */}
          <View style={styles.actionRow}>
            {/* Price-drop subscription */}
            <Pressable
              onPress={handlePriceDropPress}
              disabled={priceDropLoading}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: priceDropSubscribed ? "#22c55e15" : colors.card,
                  borderColor: priceDropSubscribed ? "#22c55e" : colors.border,
                  flex: 1,
                },
              ]}
            >
              {priceDropLoading ? (
                <ActivityIndicator size="small" color={colors.mutedForeground} />
              ) : (
                <Feather
                  name={priceDropSubscribed ? "check" : "bell"}
                  size={14}
                  color={priceDropSubscribed ? "#22c55e" : colors.mutedForeground}
                />
              )}
              <Text
                style={[
                  styles.actionBtnText,
                  { color: priceDropSubscribed ? "#22c55e" : colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {priceDropSubscribed ? "Подписаны" : "Следить за ценой"}
              </Text>
            </Pressable>

            {/* Hint button */}
            <Pressable
              onPress={handleHint}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: hintCopied ? "#a855f715" : colors.card,
                  borderColor: hintCopied ? "#a855f7" : colors.border,
                  flex: 1,
                },
              ]}
            >
              <Feather
                name={hintCopied ? "check" : "gift"}
                size={14}
                color={hintCopied ? "#a855f7" : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: hintCopied ? "#a855f7" : colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {hintCopied ? "Ссылка скопирована" : "Намекнуть"}
              </Text>
            </Pressable>
          </View>

          {/* ─── Dolyame ────────────────────────────────────────────────── */}
          {product.price >= 300000 && (
            <View
              style={[
                styles.dolyameBanner,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.dolyameBars}>
                {[0.45, 0.65, 0.82, 1.0].map((h, i) => (
                  <View
                    key={i}
                    style={[styles.dolyameBar, { height: 14 * h, backgroundColor: colors.foreground }]}
                  />
                ))}
              </View>
              <Text style={[styles.dolyameText, { color: colors.foreground }]}>
                от{" "}
                {new Intl.NumberFormat("ru-RU").format(Math.round(product.price / 4 / 100))} ₽ × 4
                платежа без процентов
              </Text>
            </View>
          )}

          {product.sku && (
            <Text style={[styles.sku, { color: colors.mutedForeground }]}>
              Артикул: {product.sku}
            </Text>
          )}

          {/* ─── Color variants ──────────────────────────────────────────── */}
          {colorVariants.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Цвет</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.variantRow}
              >
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
                        <View
                          style={[styles.colorDot, { backgroundColor: colorToHex(v.color) }]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ─── Sizes ───────────────────────────────────────────────────── */}
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
                  const subscribed = subscribedSizes.has(size);
                  const isLoading =
                    (stockSubscribeMutation.isPending || stockUnsubscribeMutation.isPending) &&
                    (stockModal?.size === size || (!stockModal && !inStock));

                  return (
                    <Pressable
                      key={size}
                      onPress={() => handleSizePress(size, inStock)}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor:
                            selectedSize === size ? colors.foreground : colors.card,
                          borderColor:
                            needSize && !selectedSize
                              ? "#ff3b30"
                              : selectedSize === size
                              ? colors.foreground
                              : subscribed
                              ? "#22c55e"
                              : colors.border,
                          opacity: inStock ? 1 : 0.6,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              selectedSize === size
                                ? colors.background
                                : subscribed
                                ? "#22c55e"
                                : colors.foreground,
                          },
                        ]}
                      >
                        {size}
                      </Text>
                      {!inStock && (
                        <Feather
                          name={subscribed ? "check" : "bell"}
                          size={10}
                          color={subscribed ? "#22c55e" : colors.mutedForeground}
                          style={styles.sizeNotifyIcon}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {sizes.some((s) =>
                product.sizeStock ? (product.sizeStock[s] ?? 0) === 0 : false
              ) && (
                <Text style={[styles.sizeHint, { color: colors.mutedForeground }]}>
                  Нажмите на недоступный размер — подпишитесь или отпишитесь от уведомления
                </Text>
              )}
            </View>
          )}

          {/* ─── Description / Composition ──────────────────────────────── */}
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

      {/* ─── Add to cart footer ───────────────────────────────────────────── */}
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
              backgroundColor: added
                ? "#22c55e"
                : needSize
                ? colors.card
                : allOutOfStock
                ? colors.card
                : colors.foreground,
              opacity: pressed || adding ? 0.8 : 1,
              borderWidth: needSize || allOutOfStock ? 1 : 0,
              borderColor: allOutOfStock ? colors.border : "#ff3b30",
            },
          ]}
          onPress={handleAddToCart}
          disabled={adding || allOutOfStock}
        >
          {adding ? (
            <ActivityIndicator color={needSize ? colors.foreground : colors.background} />
          ) : (
            <Text
              style={[
                styles.addBtnText,
                {
                  color: added
                    ? "#fff"
                    : needSize
                    ? "#ff3b30"
                    : allOutOfStock
                    ? colors.mutedForeground
                    : colors.background,
                },
              ]}
            >
              {allOutOfStock
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

      {/* ─── Modal: stock notify (guest) ─────────────────────────────────── */}
      <Modal
        visible={!!stockModal}
        transparent
        animationType="slide"
        onRequestClose={() => setStockModal(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setStockModal(null)} />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIconBg, { backgroundColor: colors.card }]}>
                <Feather name="bell" size={22} color={colors.foreground} />
              </View>
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Уведомить о наличии
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Размер{" "}
              <Text style={{ fontWeight: "700", color: colors.foreground }}>
                {stockModal?.size}
              </Text>{" "}
              сейчас недоступен.{"\n"}Укажите email — напишем, как только появится.
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="your@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              value={stockEmail}
              onChangeText={setStockEmail}
            />
            <Pressable
              style={[
                styles.modalBtn,
                {
                  backgroundColor: stockEmail.includes("@") ? colors.foreground : colors.card,
                },
              ]}
              onPress={() => {
                if (!stockModal || !stockEmail.includes("@")) return;
                stockSubscribeMutation.mutate({
                  size: stockModal.size,
                  email: stockEmail.trim(),
                });
              }}
              disabled={!stockEmail.includes("@") || stockSubscribeMutation.isPending}
            >
              {stockSubscribeMutation.isPending ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text
                  style={[
                    styles.modalBtnText,
                    {
                      color: stockEmail.includes("@")
                        ? colors.background
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  Подписаться
                </Text>
              )}
            </Pressable>
            <Pressable onPress={() => setStockModal(null)} style={styles.modalCancel}>
              <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>
                Отмена
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Modal: price drop notify (guest) ───────────────────────────── */}
      <Modal
        visible={priceDropModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPriceDropModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setPriceDropModal(false)} />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIconBg, { backgroundColor: colors.card }]}>
                <Feather name="tag" size={22} color={colors.foreground} />
              </View>
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Следить за ценой
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Укажите email — сообщим, если цена на{"\n"}
              <Text style={{ fontWeight: "700", color: colors.foreground }}>
                {product.name}
              </Text>
              {"\n"}снизится.
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="your@email.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              value={priceDropEmail}
              onChangeText={setPriceDropEmail}
            />
            <Pressable
              style={[
                styles.modalBtn,
                {
                  backgroundColor: priceDropEmail.includes("@") ? colors.foreground : colors.card,
                },
              ]}
              onPress={() => {
                if (!priceDropEmail.includes("@")) return;
                priceDropSubscribeMutation.mutate(priceDropEmail.trim());
              }}
              disabled={!priceDropEmail.includes("@") || priceDropSubscribeMutation.isPending}
            >
              {priceDropSubscribeMutation.isPending ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text
                  style={[
                    styles.modalBtnText,
                    {
                      color: priceDropEmail.includes("@")
                        ? colors.background
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  Подписаться
                </Text>
              )}
            </Pressable>
            <Pressable onPress={() => setPriceDropModal(false)} style={styles.modalCancel}>
              <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>
                Отмена
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingRight: 12,
  },
  headerBackText: { fontSize: 16, fontWeight: "500" },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerIconBtn: { padding: 8 },
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
  productImage: { height: width * 1.35 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingVertical: 10,
  },
  dot: { height: 6, borderRadius: 3 },
  content: { padding: 20, gap: 12 },
  productName: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  productPrice: { fontSize: 24, fontWeight: "800" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 13, fontWeight: "500" },
  sku: { fontSize: 12 },
  dolyameBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  dolyameBars: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  dolyameBar: { width: 4, borderRadius: 2 },
  dolyameText: { fontSize: 13, fontWeight: "600" },
  section: { gap: 10, marginTop: 4 },
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
  variantRow: { flexDirection: "row", gap: 10, paddingVertical: 4 },
  variantThumb: {
    borderRadius: 10,
    overflow: "hidden",
    width: 72,
    height: 96,
    position: "relative",
  },
  variantImg: { width: "100%", height: "100%" },
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
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  optionText: { fontSize: 14, fontWeight: "500" },
  sizeNotifyIcon: { marginLeft: 2 },
  sizeHint: { fontSize: 11, marginTop: 2 },
  description: { fontSize: 14, lineHeight: 22 },
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
  addBtnText: { fontSize: 16, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    alignSelf: "center",
    marginBottom: 4,
  },
  modalIconRow: { alignItems: "center" },
  modalIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  modalInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginTop: 4,
  },
  modalBtn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  modalBtnText: { fontSize: 16, fontWeight: "700" },
  modalCancel: { alignItems: "center", paddingVertical: 8 },
  modalCancelText: { fontSize: 14 },
});
