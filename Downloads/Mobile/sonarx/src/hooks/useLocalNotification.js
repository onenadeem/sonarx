import { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
import Constants from 'expo-constants';
// expo-notifications remote push is removed from Expo Go SDK 53+.
// Accessing the module at all triggers a native crash via Hermes,
// so we guard with executionEnvironment before any require().
const isExpoGo = Constants.executionEnvironment === 'storeClient';
const Notifications = isExpoGo
    ? null
    : require('expo-notifications');
if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}
export async function registerForPushNotificationsAsync() {
    try {
        const result = await Notifications?.requestPermissionsAsync();
        return result?.status === 'granted';
    }
    catch {
        return false;
    }
}
export function useLocalNotification() {
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);
    useEffect(() => {
        registerForPushNotificationsAsync().then(setIsPermissionGranted);
        let subscription;
        try {
            subscription = Notifications?.addNotificationResponseReceivedListener((response) => {
                const url = response.notification.request.content.data?.url;
                if (url) {
                    router.push(url);
                }
            });
        }
        catch {
            // Not supported in Expo Go (SDK 53+).
        }
        return () => subscription?.remove();
    }, []);
    const scheduleMessageNotification = useCallback(async (senderName, messagePreview, chatPeerId) => {
        try {
            await Notifications?.scheduleNotificationAsync({
                content: {
                    title: senderName,
                    body: messagePreview,
                    data: { url: `/chat/${chatPeerId}` },
                },
                trigger: null,
            });
        }
        catch {
            // Not supported in Expo Go (SDK 53+).
        }
    }, []);
    const cancelAllNotifications = useCallback(async () => {
        try {
            await Notifications?.cancelAllScheduledNotificationsAsync();
        }
        catch {
            // Not supported in Expo Go (SDK 53+).
        }
    }, []);
    return {
        scheduleMessageNotification,
        cancelAllNotifications,
        isPermissionGranted,
    };
}
