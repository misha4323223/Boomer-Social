import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Text as SvgText } from "react-native-svg";
import React, { useRef, useState, useEffect } from "react";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  Animated,
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

import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";
import { Category, Product } from "@/lib/types";

const HERO_IMAGE =
  "https://storage.yandexcloud.net/bmg/site/1774013492827_1080___1920_1774013001765.webp";

const ARTISTS = [
  {
    name: "Молодость внутри",
    role: "Российский музыкальный проект",
    image:
      "https://storage.yandexcloud.net/bmg/site/1776262370869_1772387062458_ma9KLUtnPnyXq4i1DwjZGY73haCdfJ7PWeiuidqQ9K1uLXTpItP7XztxTDZO7Dye_QPZtWWdvb64tbh9AUJvnZjc_thumb.webp",
    slug: "molodostvnutri",
  },
  {
    name: "ДРАГНИ",
    role: "Музыкант / Рок-артист",
    image:
      "https://storage.yandexcloud.net/bmg/products/import_files_66_66e697c8df2611f0976200155dfb0049_f4eb0c7edf2711f0976200155dfb0049_thumb.webp?v=1769981452453",
    slug: "dragni",
  },
  {
    name: "МультFильмы",
    role: "Брит-поп / Поп-рок",
    image:
      "https://storage.yandexcloud.net/bmg/products/import_files_f4_f457bfdeba4a11f08e6f00155daa8342_91de0b8cba4b11f08e6f00155daa8342_thumb.webp?v=1769982964183",
    slug: "multfilmy",
  },
  {
    name: "ГУДТАЙМС",
    role: "Ска-панк группа",
    image:
      "https://storage.yandexcloud.net/bmg/products/import_files_ac_ac81a76c948c11f0808100155d46f61a_e26ef028948c11f0808100155d46f61a_thumb.webp?v=1769980812532",
    slug: "goodtimes",
  },
  {
    name: "ДИКАЯ МЯТА",
    role: "Музыкальный фестиваль",
    image:
      "https://storage.yandexcloud.net/bmg/products/import_files_8f_8f9864b63bb711f0925a00155d46f61a_e8f700ec3bcd11f0925a00155d46f61a_thumb.webp?v=1769981814146",
    slug: "dikaya-myata",
  },
  {
    name: "BOOOMERANGS × ТУЛЬСКИЕ ДИЗАЙНЕРЫ",
    role: "Коллаборация",
    image:
      "https://storage.yandexcloud.net/bmg/site/1776262413983_1772387940947_import_files_30_30dea81a874611f084a300155d46f61a_2c7d4c00875911f084a300155d46f61a_thumb.webp",
    slug: "artist-1772387909100",
  },
];

const MARQUEE_ITEMS = [
  "БЕСПЛАТНАЯ ДОСТАВКА ОТ 5 000 ₽",
  "✦",
  "БЕСПЛАТНАЯ ДОСТАВКА ОТ 5 000 ₽",
  "✦",
  "БЕСПЛАТНАЯ ДОСТАВКА ОТ 5 000 ₽",
  "✦",
  "БЕСПЛАТНАЯ ДОСТАВКА ОТ 5 000 ₽",
  "✦",
];

function MarqueeBanner() {
  const translateX = useRef(new Animated.Value(0)).current;
  const halfWidth = useRef(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const startAnim = (width: number) => {
    if (animRef.current) animRef.current.stop();
    translateX.setValue(0);
    animRef.current = Animated.loop(
      Animated.timing(translateX, {
        toValue: -width,
        duration: Math.round(width * 22),
        useNativeDriver: true,
      })
    );
    animRef.current.start();
  };

  const onHalfLayout = (e: any) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== halfWidth.current) {
      halfWidth.current = w;
      startAnim(w);
    }
  };

  useEffect(() => {
    return () => { animRef.current?.stop(); };
  }, []);

  return (
    <View style={marqueeStyles.wrapper}>
      <View style={marqueeStyles.stripe}>
        <Animated.View style={[marqueeStyles.row, { transform: [{ translateX }] }]}>
          <View style={marqueeStyles.row} onLayout={onHalfLayout}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={marqueeStyles.chunk}>
                {MARQUEE_ITEMS.map((item, j) => (
                  <Text
                    key={j}
                    style={item === "✦" ? marqueeStyles.separator : marqueeStyles.label}
                  >
                    {item}
                  </Text>
                ))}
              </View>
            ))}
          </View>
          <View style={marqueeStyles.row} aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={marqueeStyles.chunk}>
                {MARQUEE_ITEMS.map((item, j) => (
                  <Text
                    key={j}
                    style={item === "✦" ? marqueeStyles.separator : marqueeStyles.label}
                  >
                    {item}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const marqueeStyles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  stripe: {
    paddingVertical: 11,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  chunk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingRight: 14,
  },
  label: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  separator: {
    color: "#c8ff00",
    fontSize: 10,
    fontWeight: "900",
  },
});

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


export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { totalCount } = useCart();
  const { favorites } = useFavorites();
  const favCount = favorites.length;

  const [searchVisible, setSearchVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  const drawerAnim = useRef(new Animated.Value(width)).current;
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (text.trim().length > 1) {
      searchTimeout.current = setTimeout(() => {
        setSearchVisible(false);
        setSearch("");
        router.push({ pathname: "/(tabs)/catalog", params: { search: text.trim() } } as any);
      }, 600);
    }
  };

  const handleSearchSubmit = () => {
    if (search.trim().length > 0) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      const q = search.trim();
      setSearchVisible(false);
      setSearch("");
      router.push({ pathname: "/(tabs)/catalog", params: { search: q } } as any);
    }
  };

  const { data: categoriesRaw } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return parseCategoriesResponse(res.data?.categories ?? res.data);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: newArrivals, isLoading: newArrivalsLoading } = useQuery<Product[]>({
    queryKey: ["new-arrivals-home"],
    queryFn: async () => {
      const res = await api.get("/products", { params: { isNew: true, limit: 16 } });
      const products: Product[] = res.data?.products ?? res.data ?? [];
      return products.slice(0, 16);
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories: Category[] = categoriesRaw ?? [];
  const cardWidth = Math.floor((width - 12 * 3) / 2);
  const artistCardWidth = Math.min(Math.floor(width * 0.48), 200);
  const artistCardHeight = Math.round(artistCardWidth * 1.4);

  const handleSubscribe = async () => {
    if (!email.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Ошибка", "Введите корректный email");
      return;
    }
    setSubscribeLoading(true);
    try {
      await api.post("/newsletter/subscribe", { email: email.trim(), source: "mobile" });
      setSubscribeSuccess(true);
      setEmail("");
    } catch {
      Alert.alert("Ошибка", "Не удалось подписаться. Попробуйте позже.");
    } finally {
      setSubscribeLoading(false);
    }
  };

  const heroHeight = Math.round(width * (1920 / 1080));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── NAVBAR ── */}
      <View style={[styles.navbarWrap, { paddingTop: insets.top + 4 }]}>
        <View style={styles.navbarOuter}>
          <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.navbarInner}>
            <TouchableOpacity style={styles.navLogoRow} activeOpacity={0.7}>
              <Svg width={58} height={32}>
                <SvgText
                  stroke="#ffffff"
                  strokeWidth={1.2}
                  fill="transparent"
                  fontFamily="PermanentMarker_400Regular"
                  fontSize={22}
                  x={2}
                  y={24}
                  letterSpacing={1}
                >
                  BMG
                </SvgText>
              </Svg>
              <Svg width={82} height={32}>
                <SvgText
                  stroke="#000000"
                  strokeWidth={1.2}
                  fill="#ffffff"
                  fontFamily="PermanentMarker_400Regular"
                  fontSize={22}
                  x={2}
                  y={24}
                  letterSpacing={1}
                >
                  BRAND
                </SvgText>
              </Svg>
            </TouchableOpacity>

            <View style={styles.navIcons}>
              <TouchableOpacity onPress={() => setSearchVisible((v) => !v)} style={styles.navIconBtn}>
                <Feather name={searchVisible ? "x" : "search"} size={21} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(tabs)/favorites")} style={styles.navIconBtn}>
                <Feather name="heart" size={21} color="#ffffff" />
                {favCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{favCount > 9 ? "9+" : favCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(tabs)/cart")} style={styles.navIconBtn}>
                <Feather name="shopping-bag" size={21} color="#ffffff" />
                {totalCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{totalCount > 9 ? "9+" : totalCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} style={styles.navIconBtn}>
                <Feather name="user" size={21} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={openDrawer} style={styles.navIconBtn}>
                <Feather name="menu" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {searchVisible && (
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.card, borderColor: "rgba(255,255,255,0.18)" },
            ]}
          >
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              autoFocus
              style={[styles.searchInput, { color: colors.foreground, backgroundColor: "transparent" }]}
              placeholder="Поиск товаров..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              underlineColorAndroid="transparent"
              selectionColor="#c8ff00"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* ── MAIN SCROLL ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 0 }}
      >
        {/* HERO */}
        <View style={{ width, height: heroHeight, position: "relative" }}>
          <Image
            source={{ uri: HERO_IMAGE }}
            style={{ position: "absolute", width, height: heroHeight }}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={0}
          />
          <View style={StyleSheet.absoluteFill as any}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }} />
          </View>
          <Pressable
            style={({ pressed }) => [styles.heroBtn, pressed && { opacity: 0.75 }]}
            onPress={() => router.push("/artist/molodostvnutri" as any)}
          >
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.heroBtnContent}>
              <Text style={styles.heroBtnText}>Молодость внутри</Text>
              <Feather name="arrow-right" size={13} color="#ffffff" />
            </View>
          </Pressable>
        </View>

        {/* ── БЕГУЩАЯ СТРОКА ── */}
        <MarqueeBanner />

        {/* ── НОВИНКИ ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Новинки</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/catalog" as any)}>
              <Text style={[styles.sectionLink, { color: colors.mutedForeground }]}>
                Все товары →
              </Text>
            </TouchableOpacity>
          </View>

          {newArrivalsLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.foreground} size="large" />
            </View>
          ) : !newArrivals || newArrivals.length === 0 ? (
            <View style={styles.loader}>
              <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>
                Загрузка новинок...
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
              {Array.from({ length: Math.ceil(newArrivals.length / 2) }, (_, rowIdx) => (
                <View
                  key={rowIdx}
                  style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}
                >
                  {newArrivals.slice(rowIdx * 2, rowIdx * 2 + 2).map((item) => (
                    <View key={item.id} style={{ width: cardWidth }}>
                      <ProductCard product={item} />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── АРТИСТЫ (горизонтальная карусель) ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Артисты и фестивали
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            Коллаборации
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.artistsRow}
          >
            {ARTISTS.map((artist) => (
              <Pressable
                key={artist.slug}
                style={({ pressed }) => [
                  styles.artistCard,
                  { opacity: pressed ? 0.85 : 1, width: artistCardWidth, height: artistCardHeight },
                ]}
                onPress={() => router.push(`/artist/${artist.slug}` as any)}
              >
                <Image
                  source={{ uri: artist.image }}
                  style={styles.artistImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.82)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.artistInfo}>
                  <Text style={styles.artistRole}>{artist.role}</Text>
                  <Text style={styles.artistName}>{artist.name}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── ПОДПИСКА НА EMAIL ── */}
        <View
          style={[
            styles.subscribeSection,
            { backgroundColor: colors.card },
          ]}
        >
          <Feather name="mail" size={28} color={colors.foreground} style={{ marginBottom: 12 }} />
          <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: "center" }]}>
            Будьте в курсе
          </Text>
          <Text style={[styles.subscribeSubtitle, { color: colors.mutedForeground }]}>
            Подпишитесь на новости, новинки и эксклюзивные предложения
          </Text>

          {subscribeSuccess ? (
            <View style={styles.subscribeSuccess}>
              <Feather name="check-circle" size={22} color="#4CAF50" />
              <Text style={[styles.subscribeSuccessText, { color: colors.foreground }]}>
                Вы подписались! Спасибо.
              </Text>
            </View>
          ) : (
            <View style={styles.subscribeRow}>
              <TextInput
                style={[
                  styles.subscribeInput,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Ваш email"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.subscribeBtn, subscribeLoading && { opacity: 0.7 }]}
                onPress={handleSubscribe}
                disabled={subscribeLoading}
              >
                {subscribeLoading ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Feather name="arrow-right" size={20} color="#000000" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── ПОДВАЛ ── */}
        <Footer />

      </ScrollView>

      {/* ── FILTER DRAWER ── */}
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
            <Text style={[styles.drawerTitle, { color: colors.foreground }]}>Каталог</Text>
            <TouchableOpacity onPress={closeDrawer}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <TouchableOpacity
              style={[styles.drawerItem, { borderBottomColor: colors.border }]}
              onPress={() => { closeDrawer(); router.push("/(tabs)/catalog" as any); }}
            >
              <Text style={[styles.drawerItemText, { color: colors.foreground, fontWeight: "700" }]}>
                Все товары
              </Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            {categories.map((cat) => {
              const key = (cat.slug ?? String(cat.id)) as string;
              const isExpanded = expandedCat === key;
              return (
                <View key={key}>
                  <TouchableOpacity
                    style={[styles.drawerItem, { borderBottomColor: colors.border }]}
                    onPress={() => setExpandedCat(isExpanded ? null : key)}
                  >
                    <Text style={[styles.drawerItemText, { color: colors.mutedForeground, fontWeight: "500" }]}>
                      {cat.name}
                    </Text>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.mutedForeground}
                    />
                  </TouchableOpacity>

                  {isExpanded &&
                    cat.subcategories?.map((sub) => (
                      <TouchableOpacity
                        key={sub.slug}
                        style={[styles.drawerSubItem, { borderBottomColor: colors.border }]}
                        onPress={() => {
                          closeDrawer();
                          router.push({
                            pathname: "/(tabs)/catalog",
                            params: { category: key, subcategory: sub.name },
                          } as any);
                        }}
                      >
                        <View style={[styles.subDot, { backgroundColor: colors.border }]} />
                        <Text style={[styles.drawerSubText, { color: colors.mutedForeground }]}>
                          {sub.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              );
            })}

            <View style={[styles.drawerDivider, { borderTopColor: colors.border }]} />
            <TouchableOpacity
              style={[styles.drawerItem, { borderBottomColor: colors.border }]}
              onPress={() => { closeDrawer(); router.push("/gift-cards" as any); }}
            >
              <Feather name="gift" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <Text style={[styles.drawerItemText, { color: colors.mutedForeground, fontWeight: "400" }]}>
                Подарочные сертификаты
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawerItem, { borderBottomColor: colors.border }]}
              onPress={() => { closeDrawer(); router.push("/(tabs)/profile" as any); }}
            >
              <Feather name="user" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <Text style={[styles.drawerItemText, { color: colors.mutedForeground, fontWeight: "400" }]}>
                Профиль
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawerItem, { borderBottomColor: colors.border }]}
              onPress={() => { closeDrawer(); router.push("/chat" as any); }}
            >
              <Feather name="message-circle" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <Text style={[styles.drawerItemText, { color: colors.mutedForeground, fontWeight: "400" }]}>
                Поддержка
              </Text>
            </TouchableOpacity>
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
    paddingLeft: 6,
    paddingRight: 4,
    paddingVertical: 3,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  navLogoRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  navIcons: { flexDirection: "row", alignItems: "center" },
  navIconBtn: { padding: 5, position: "relative" },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#000000" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },

  heroBtn: {
    position: "absolute",
    bottom: 140,
    alignSelf: "center",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroBtnText: { fontSize: 13, fontWeight: "600", color: "#ffffff", letterSpacing: 0.4 },

  section: { paddingTop: 28, paddingBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.4 },
  sectionLink: { fontSize: 13 },
  sectionSubtitle: { fontSize: 13, paddingHorizontal: 16, marginBottom: 14 },
  loader: { padding: 32, alignItems: "center" },

  /* Артисты — горизонтальная карусель */
  artistsRow: {
    paddingHorizontal: 12,
    gap: 12,
    paddingBottom: 8,
  },
  artistCard: {
    width: 200,
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  artistImage: { width: "100%", height: "100%" },
  artistInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  artistRole: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  artistName: { fontSize: 16, fontWeight: "700", color: "#ffffff" },

  /* О бренде — видео */
  videoBlock: {
    marginHorizontal: 12,
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 9 / 16,
    marginBottom: 20,
  },
  videoView: { width: "100%", height: "100%" },
  aboutText: { paddingHorizontal: 16, gap: 10 },
  aboutTitle: { fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  aboutBody: { fontSize: 14, lineHeight: 22 },
  aboutQuote: { fontSize: 16, fontWeight: "600", fontStyle: "italic", lineHeight: 24, marginTop: 8 },

  /* Подписка */
  subscribeSection: {
    marginHorizontal: 12,
    marginTop: 20,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  subscribeSubtitle: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 8 },
  subscribeRow: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%" },
  subscribeInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  subscribeBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  subscribeSuccess: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  subscribeSuccessText: { fontSize: 15, fontWeight: "600" },

  /* Drawer */
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
  drawerDivider: { borderTopWidth: StyleSheet.hairlineWidth, marginVertical: 8, marginHorizontal: 16 },
});
