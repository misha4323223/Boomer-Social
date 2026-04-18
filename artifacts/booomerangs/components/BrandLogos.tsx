import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

export function CdekLogo() {
  return (
    <Svg width={56} height={24} viewBox="0 0 56 24">
      <Rect width="56" height="24" rx="5" fill="#00B140" />
      <SvgText
        x="28"
        y="17"
        fontSize="13"
        fontWeight="900"
        fill="white"
        textAnchor="middle"
        letterSpacing="1"
      >
        СДЭК
      </SvgText>
    </Svg>
  );
}

export function YookassaLogo() {
  return (
    <Svg width={78} height={24} viewBox="0 0 78 24">
      <Defs>
        <SvgGradient id="ykGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6B24F5" />
          <Stop offset="1" stopColor="#9B59FF" />
        </SvgGradient>
      </Defs>
      <Rect width="78" height="24" rx="5" fill="url(#ykGrad)" />
      <SvgText
        x="39"
        y="17"
        fontSize="11"
        fontWeight="800"
        fill="white"
        textAnchor="middle"
        letterSpacing="0.3"
      >
        ЮKassa
      </SvgText>
    </Svg>
  );
}

export function TBankLogo() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28">
      <Circle cx="14" cy="14" r="14" fill="#FFDD2D" />
      <SvgText
        x="14"
        y="20"
        fontSize="16"
        fontWeight="900"
        fill="#111111"
        textAnchor="middle"
      >
        Т
      </SvgText>
    </Svg>
  );
}

export function DolyamiBadge() {
  return (
    <View style={styles.badge}>
      <View style={styles.bars}>
        {([0.45, 0.65, 0.82, 1.0] as const).map((h, i) => (
          <View key={i} style={[styles.bar, { height: 8 * h }]} />
        ))}
      </View>
      <Text style={styles.label}>ДОЛЯМИ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#FFDD2D",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 1.5,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: "#FFDD2D",
  },
  label: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFDD2D",
    letterSpacing: 0.5,
  },
});
