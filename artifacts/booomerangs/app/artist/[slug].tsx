import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProductCard } from "@/components/ProductCard";
import { useColors } from "@/hooks/useColors";
import api from "@/lib/api";
import { Product } from "@/lib/types";

const SOCIAL_ICONS: Record<string, string> = {
  telegram: "send",
  vk: "users",
  youtube: "youtube",
  instagram: "instagram",
};

interface ArtistSettings {
  name?: string;
  role?: string;
  heroImage?: string;
  heroVideo?: string;
  heroBgType?: string;
  heroOpacity?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroVisible?: boolean;
  shortDescription?: string;
  aboutTitle?: string;
  aboutText?: string;
  aboutImages?: string[];
  aboutVisible?: boolean;
  galleryTitle?: string;
  galleryImages?: string[];
  galleryVisible?: boolean;
  productsTitle?: string;
  productsSubcategory?: string;
  productsCategory?: string;
  productsVisible?: boolean;
  quoteText?: string;
  quoteAuthor?: string;
  quoteVisible?: boolean;
  videoUrl?: string;
  videoTitle?: string;
  videoVisible?: boolean;
  socialTelegram?: string;
  socialVk?: string;
  socialYoutube?: string;
  socialInstagram?: string;
  socialOther?: string;
  socialOtherLabel?: string;
  socialsVisible?: boolean;
}

export default function ArtistScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [galleryIndex, setGalleryIndex] = useState(0);

  const { data: allArtistPages, isLoading: artistPagesLoading } = useQuery<Record<string, ArtistSettings>>({
    queryKey: ["artist_pages"],
    queryFn: async () => {
      const res = await api.get("/page-settings/artist_pages");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: homeSettings, isLoading: homeLoading } = useQuery<any>({
    queryKey: ["page-settings-home"],
    queryFn: async () => {
      const res = await api.get("/page-settings/home");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const settings: ArtistSettings = allArtistPages?.[slug!] || {};
  const homeArtist = (homeSettings?.artists?.items || []).find((a: any) => a.slug === slug);

  const artistName = settings.name || homeArtist?.name || slug;
  const artistRole = settings.role || homeArtist?.role || "";
  const heroImage = settings.heroImage || homeArtist?.image || "";
  const heroOpacity = Number(settings.heroOpacity || "0.5");

  const socials = [
    { key: "telegram", url: settings.socialTelegram, label: "Telegram" },
    { key: "vk", url: settings.socialVk, label: "VK" },
    { key: "youtube", url: settings.socialYoutube, label: "YouTube" },
    { key: "instagram", url: settings.socialInstagram, label: "Instagram" },
  ].filter((s) => s.url);
  if (settings.socialOther) {
    socials.push({ key: "other", url: settings.socialOther, label: settings.socialOtherLabel || "Ссылка" });
  }

  const category = settings.productsCategory || "merch";
  const subcategory = settings.productsSubcategory || "";

  const { data: productsData } = useQuery<{ products: Product[] }>({
    queryKey: ["artist-products", category, subcategory],
    queryFn: async () => {
      const params: Record<string, string> = { category, limit: "8" };
      if (subcategory) params.subcategory = subcategory;
      const res = await api.get("/products", { params });
      return res.data;
    },
    enabled: settings.productsVisible !== false && !!allArtistPages,
    staleTime: 5 * 60 * 1000,
  });

  const products = productsData?.products || [];
  const galleryImages = (settings.galleryImages || []).filter(Boolean);
  const aboutImages = (settings.aboutImages || []).filter(Boolean);

  const isLoading = artistPagesLoading || homeLoading;
  const cardWidth = Math.floor((width - 12 * 3) / 2);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: "#000000" }]}>
        <ActivityIndicator color="#ffffff" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        {settings.heroVisible !== false && (
          <View style={[styles.hero, { height: Math.round(width * 1.2) }]}>
            {heroImage ? (
              <Image
                source={{ uri: heroImage }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "#111111" }]} />
            )}
            <LinearGradient
              colors={["transparent", `rgba(0,0,0,${Math.min(heroOpacity + 0.3, 1)})`, "#000000"]}
              locations={[0, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />

            {/* Back button */}
            <Pressable
              style={[styles.backBtn, { top: insets.top + 8 }]}
              onPress={() => router.back()}
              hitSlop={12}
            >
              <Feather name="arrow-left" size={22} color="#ffffff" />
            </Pressable>

            <View style={styles.heroContent}>
              {artistRole ? (
                <Text style={styles.heroRole}>{artistRole.toUpperCase()}</Text>
              ) : null}
              <Text style={styles.heroName}>
                {settings.heroTitle || artistName}
              </Text>
              {(settings.heroSubtitle || settings.shortDescription) ? (
                <Text style={styles.heroSubtitle}>
                  {settings.heroSubtitle || settings.shortDescription}
                </Text>
              ) : null}

              {socials.length > 0 && settings.socialsVisible !== false && (
                <View style={styles.socialRow}>
                  {socials.map((s) => (
                    <Pressable
                      key={s.key}
                      style={styles.socialBtn}
                      onPress={() => s.url && Linking.openURL(s.url)}
                    >
                      <Feather
                        name={(SOCIAL_ICONS[s.key] || "link") as any}
                        size={18}
                        color="#ffffff"
                      />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── ABOUT ── */}
        {settings.aboutVisible !== false && settings.aboutText ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {settings.aboutTitle || "О коллаборации"}
            </Text>
            <Text style={styles.aboutText}>{settings.aboutText}</Text>

            {aboutImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.aboutImagesRow}
              >
                {aboutImages.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={[styles.aboutImage, { width: width * 0.55 }]}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}

        {/* ── QUOTE ── */}
        {settings.quoteVisible !== false && settings.quoteText ? (
          <View style={styles.quoteBlock}>
            <Text style={styles.quoteIcon}>"</Text>
            <Text style={styles.quoteText}>{settings.quoteText}</Text>
            {settings.quoteAuthor ? (
              <Text style={styles.quoteAuthor}>— {settings.quoteAuthor}</Text>
            ) : null}
          </View>
        ) : null}

        {/* ── GALLERY ── */}
        {settings.galleryVisible !== false && galleryImages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {settings.galleryTitle || "Галерея"}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryRow}
              snapToInterval={width * 0.7 + 12}
              decelerationRate="fast"
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / (width * 0.7 + 12)
                );
                setGalleryIndex(idx);
              }}
            >
              {galleryImages.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[styles.galleryImage, { width: width * 0.7, height: width * 0.9 }]}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
            {galleryImages.length > 1 && (
              <View style={styles.galleryDots}>
                {galleryImages.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: i === galleryIndex ? "#ffffff" : "#444444" },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* ── VIDEO ── */}
        {settings.videoVisible !== false && settings.videoUrl ? (
          <View style={styles.section}>
            {settings.videoTitle ? (
              <Text style={styles.sectionTitle}>{settings.videoTitle}</Text>
            ) : null}
            <Pressable
              style={styles.videoBtn}
              onPress={() => Linking.openURL(settings.videoUrl!)}
            >
              <View style={styles.videoPlayIcon}>
                <Feather name="play" size={28} color="#ffffff" />
              </View>
              <Text style={styles.videoBtnText}>Смотреть видео</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ── PRODUCTS ── */}
        {settings.productsVisible !== false && products.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {settings.productsTitle || "Коллекция"}
            </Text>
            <View style={styles.productsGrid}>
              {products.map((product) => (
                <View key={product.id} style={{ width: cardWidth }}>
                  <ProductCard product={product} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    position: "relative",
    justifyContent: "flex-end",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroRole: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
    marginBottom: 6,
  },
  heroName: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  socialRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  socialBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
  },
  aboutText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    lineHeight: 24,
  },
  aboutImagesRow: {
    gap: 10,
    paddingTop: 16,
  },
  aboutImage: {
    height: 280,
    borderRadius: 12,
  },
  quoteBlock: {
    marginHorizontal: 16,
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderLeftWidth: 3,
    borderLeftColor: "#ffffff",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
  },
  quoteIcon: {
    color: "#ffffff",
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 40,
    marginBottom: 6,
  },
  quoteText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 24,
  },
  quoteAuthor: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginTop: 10,
    fontWeight: "600",
  },
  galleryRow: {
    gap: 12,
    paddingRight: 16,
  },
  galleryImage: {
    borderRadius: 12,
  },
  galleryDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  videoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  videoPlayIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  videoBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
