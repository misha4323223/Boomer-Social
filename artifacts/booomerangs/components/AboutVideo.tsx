import { ResizeMode, Video } from "expo-av";
import React, { useRef } from "react";
import { StyleSheet } from "react-native";

const ABOUT_VIDEO_URL =
  "https://storage.yandexcloud.net/bmg/media/identity/cinematic_dark_urban_streetwear_video.mp4";

export function AboutVideo() {
  const videoRef = useRef(null);

  return (
    <Video
      ref={videoRef}
      source={{ uri: ABOUT_VIDEO_URL }}
      style={styles.video}
      resizeMode={ResizeMode.COVER}
      isLooping
      isMuted
      shouldPlay
      useNativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  video: { width: "100%", height: "100%" },
});
