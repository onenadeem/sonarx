import { Platform, Vibration } from "react-native";

export const ImpactFeedbackStyle = Object.freeze({
  Light: "light",
  Medium: "medium",
  Heavy: "heavy",
});

export const NotificationFeedbackType = Object.freeze({
  Success: "success",
  Warning: "warning",
  Error: "error",
});

const ANDROID_VIBRATION_MS = Object.freeze({
  [ImpactFeedbackStyle.Light]: 10,
  [ImpactFeedbackStyle.Medium]: 20,
  [ImpactFeedbackStyle.Heavy]: 40,
});

const vibrateOnAndroid = (durationMs) => {
  if (Platform.OS !== "android") {
    return;
  }
  if (typeof durationMs !== "number") {
    return;
  }
  Vibration.vibrate(durationMs);
};

export async function impactAsync(style) {
  vibrateOnAndroid(ANDROID_VIBRATION_MS[style]);
}
export async function selectionAsync() {
  vibrateOnAndroid(5);
}
export async function notificationAsync() {
  vibrateOnAndroid(30);
}
