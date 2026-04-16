import { Feather } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";

function BackButton() {
  const router = useRouter();
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={() => router.push("/(tabs)")}
      style={{ paddingHorizontal: 16, paddingVertical: 8 }}
    >
      <Feather name="arrow-left" size={22} color={colors.foreground} />
    </TouchableOpacity>
  );
}

function ChatFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => router.push("/chat")}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom: insets.bottom + 20,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather name="message-circle" size={24} color="#000000" />
    </Pressable>
  );
}

export default function TabLayout() {
  const { totalCount } = useCart();
  const isIOS = Platform.OS === "ios";

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: "#000000" },
          headerTintColor: "#ffffff",
          headerShadowVisible: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Каталог",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: "Корзина",
            headerShown: true,
            headerLeft: () => <BackButton />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Избранное",
            headerShown: true,
            headerLeft: () => <BackButton />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Профиль",
            headerShown: true,
            headerLeft: () => <BackButton />,
          }}
        />
      </Tabs>
      <ChatFab />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
