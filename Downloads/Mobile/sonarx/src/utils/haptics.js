import { Platform, Vibration } from 'react-native';
export var ImpactFeedbackStyle;
(function (ImpactFeedbackStyle) {
    ImpactFeedbackStyle["Light"] = "light";
    ImpactFeedbackStyle["Medium"] = "medium";
    ImpactFeedbackStyle["Heavy"] = "heavy";
})(ImpactFeedbackStyle || (ImpactFeedbackStyle = {}));
export var NotificationFeedbackType;
(function (NotificationFeedbackType) {
    NotificationFeedbackType["Success"] = "success";
    NotificationFeedbackType["Warning"] = "warning";
    NotificationFeedbackType["Error"] = "error";
})(NotificationFeedbackType || (NotificationFeedbackType = {}));
export async function impactAsync(style) {
    if (Platform.OS === 'android') {
        const durations = {
            [ImpactFeedbackStyle.Light]: 10,
            [ImpactFeedbackStyle.Medium]: 20,
            [ImpactFeedbackStyle.Heavy]: 40,
        };
        Vibration.vibrate(durations[style]);
    }
}
export async function selectionAsync() {
    if (Platform.OS === 'android') {
        Vibration.vibrate(5);
    }
}
export async function notificationAsync() {
    if (Platform.OS === 'android') {
        Vibration.vibrate(30);
    }
}
