import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs, useRouter } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "@/context/CartContext";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  const { totalCount } = useCart();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon>
          <Feather name="grid" size={24} color="#ffffff" />
        </Icon>
        <Label>Каталог</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cart">
        <Icon>
          <Feather name="shopping-cart" size={24} color="#ffffff" />
        </Icon>
        <Label>Корзина</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="favorites">
        <Icon>
          <Feather name="heart" size={24} color="#ffffff" />
        </Icon>
        <Label>Избранное</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon>
          <Feather name="user" size={24} color="#ffffff" />
        </Icon>
        <Label>Профиль</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const { totalCount } = useCart();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#666666",
        headerShown: true,
        headerStyle: { backgroundColor: "#000000" },
        headerTintColor: "#ffffff",
        headerShadowVisible: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#000000",
          borderTopWidth: 1,
          borderTopColor: "#222222",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000000" }]} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Каталог",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather name="grid" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Корзина",
          tabBarBadge: totalCount > 0 ? totalCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#ffffff",
            color: "#000000",
            fontSize: 10,
            fontWeight: "700",
          },
          tabBarIcon: ({ color }) => (
            <Feather name="shopping-cart" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Избранное",
          tabBarIcon: ({ color }) => (
            <Feather name="heart" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color }) => (
            <Feather name="user" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
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
          bottom: insets.bottom + 90,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather name="message-circle" size={24} color="#000000" />
    </Pressable>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return (
      <View style={{ flex: 1 }}>
        <NativeTabLayout />
        <ChatFab />
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <ClassicTabLayout />
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
