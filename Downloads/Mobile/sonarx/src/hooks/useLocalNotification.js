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

const withNotificationApi = async (handler) => {
    if (!Notifications) {
        return undefined;
    }
    try {
        return await handler();
    }
    catch {
        return undefined;
    }
};
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
    return withNotificationApi(async () => {
        const result = await Notifications.requestPermissionsAsync();
        return result.status === 'granted';
    }) ?? false;
}
export function useLocalNotification() {
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);
    useEffect(() => {
        registerForPushNotificationsAsync().then(setIsPermissionGranted);
        let subscription;
        withNotificationApi(async () => {
            subscription = Notifications.addNotificationResponseReceivedListener((response) => {
                const url = response.notification.request.content.data?.url;
                if (url) {
                    router.push(url);
                }
            });
        });
        return () => subscription?.remove();
    }, []);
    const scheduleMessageNotification = useCallback(async (senderName, messagePreview, chatPeerId) => {
        return withNotificationApi(async () => {
            await Notifications?.scheduleNotificationAsync({
                content: {
                    title: senderName,
                    body: messagePreview,
                    data: { url: `/chat/${chatPeerId}` },
                },
                trigger: null,
            });
        });
    }, []);
    const cancelAllNotifications = useCallback(async () => {
        return withNotificationApi(async () => {
            await Notifications.cancelAllScheduledNotificationsAsync();
        });
    }, []);
    return {
        scheduleMessageNotification,
        cancelAllNotifications,
        isPermissionGranted,
    };
}
