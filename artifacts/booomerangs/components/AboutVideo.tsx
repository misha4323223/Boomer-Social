import { ResizeMode, Video } from "expo-av";
import React, { useRef } from "react";
import { StyleSheet } from "react-native";

const ABOUT_VIDEO_URL =
  "https://storage.yandexcloud.net/bmg/site/video/1770825356904_document_5215639509227572296.mp4";

export function AboutVideo() {
  const videoRef = useRef(null);

  return (
    <Video
      ref={videoRef}
      source={{ uri: ABOUT_VIDEO_URL }}
      style={styles.video}
      resizeMode={ResizeMode.CONTAIN}
      isLooping
      isMuted
      shouldPlay
      useNativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  video: { width: "100%", height: "100%", transform: [{ scale: 0.75 }] },
});
