import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface CompactHeaderProps {
  title: string;
  onBack?: () => void;
}

export function CompactHeader({ title, onBack }: CompactHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.card, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Feather name="chevron-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.placeholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  placeholder: {
    width: 34,
  },
});
