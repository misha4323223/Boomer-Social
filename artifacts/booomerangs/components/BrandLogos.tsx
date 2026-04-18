import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

/* ─── CDEK ────────────────────────────────────────────────────── */
export function CdekLogo({ height = 24 }: { height?: number }) {
  return (
    <Image
      source={require("@/assets/cdek-logo.webp")}
      style={{ height, width: height * 2.5, resizeMode: "contain" }}
      contentFit="contain"
    />
  );
}

/* ─── YooKassa ────────────────────────────────────────────────── */
export function YookassaLogo({ height = 24 }: { height?: number }) {
  return (
    <Image
      source={require("@/assets/yookassa-logo.webp")}
      style={{ height, width: height * 4, resizeMode: "contain" }}
      contentFit="contain"
    />
  );
}

/* ─── T-Bank (Building2 Lucide icon, exact SVG paths from site) ─ */
export function TBankLogo() {
  const color = "#FFDD2D";
  const size = 24;
  return (
    <View style={styles.tbankRow}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        <Path d="M10 6h4" />
        <Path d="M10 10h4" />
        <Path d="M10 14h4" />
        <Path d="M10 18h4" />
      </Svg>
      <Text style={[styles.tbankText, { color }]}>T-Bank</Text>
    </View>
  );
}

/* ─── Долями badge (exact logic from site source) ─────────────── */
export function DolyamiBadge({ white = false }: { white?: boolean }) {
  const color = white ? "#fff" : "#1C1C1C";
  const heights = [0.45, 0.65, 0.82, 1.0];
  const size = 16;
  return (
    <View style={styles.badge}>
      <Svg width={size * 1.1} height={size} viewBox="0 0 22 16" fill="none">
        {heights.map((h, i) => (
          <Rect
            key={i}
            x={i * 5.5}
            y={16 * (1 - h)}
            width={3.5}
            height={16 * h}
            rx={1}
            fill={color}
          />
        ))}
      </Svg>
      <Text style={[styles.badgeLabel, { color }]}>ДОЛЯМИ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tbankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tbankText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#1C1C1C",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
