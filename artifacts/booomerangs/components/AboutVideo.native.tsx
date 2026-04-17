import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import { StyleSheet } from "react-native";

const ABOUT_VIDEO_URL =
  "https://storage.yandexcloud.net/bmg/media/identity/cinematic_dark_urban_streetwear_video.mp4";

export function AboutVideo() {
  const player = useVideoPlayer(ABOUT_VIDEO_URL, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

const styles = StyleSheet.create({
  video: { width: "100%", height: "100%" },
});
