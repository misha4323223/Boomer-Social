import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

const ABOUT_VIDEO_URL =
  "https://storage.yandexcloud.net/bmg/media/identity/cinematic_dark_urban_streetwear_video.mp4";

export function AboutVideo() {
  return (
    <Pressable
      style={styles.container}
      onPress={() => Linking.openURL(ABOUT_VIDEO_URL)}
    >
      <Image
        source={{ uri: "https://storage.yandexcloud.net/bmg/site/1774011270466_2560___1740.webp" }}
        style={StyleSheet.absoluteFill as any}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.5)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.playBtn}>
        <Feather name="play" size={28} color="#ffffff" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
});
