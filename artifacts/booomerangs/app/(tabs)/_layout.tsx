import { Feather } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

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
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Главная" }} />
        <Tabs.Screen name="catalog" options={{ title: "Каталог" }} />
        <Tabs.Screen name="cart" options={{ title: "Корзина" }} />
        <Tabs.Screen name="favorites" options={{ title: "Избранное" }} />
        <Tabs.Screen name="profile" options={{ title: "Профиль" }} />
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
