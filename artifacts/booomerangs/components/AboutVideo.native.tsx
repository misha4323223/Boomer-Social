import { ResizeMode, Video } from "expo-av";
import React, { useRef } from "react";
import { StyleSheet, View } from "react-native";

const ABOUT_VIDEO_URL =
  "https://storage.yandexcloud.net/bmg/site/video/1770825356904_document_5215639509227572296.mp4";

export function AboutVideo() {
  const videoRef = useRef(null);

  return (
    <View style={styles.wrapper}>
      <Video
        ref={videoRef}
        source={{ uri: ABOUT_VIDEO_URL }}
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: 25 }] }]}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted
        shouldPlay
        useNativeControls={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
});
