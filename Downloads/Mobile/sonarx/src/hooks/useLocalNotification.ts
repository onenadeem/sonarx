import { useCallback, useEffect, useState } from 'react'
import { router } from 'expo-router'
import Constants from 'expo-constants'

// expo-notifications remote push is removed from Expo Go SDK 53+.
// Accessing the module at all triggers a native crash via Hermes,
// so we guard with executionEnvironment before any require().
const isExpoGo = Constants.executionEnvironment === 'storeClient'

type NotificationsModule = typeof import('expo-notifications')

const Notifications: NotificationsModule | null = isExpoGo
  ? null
  : (require('expo-notifications') as NotificationsModule)

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

export async function registerForPushNotificationsAsync(): Promise<boolean> {
  try {
    const result = await Notifications?.requestPermissionsAsync()
    return result?.status === 'granted'
  } catch {
    return false
  }
}

export function useLocalNotification() {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)

  useEffect(() => {
    registerForPushNotificationsAsync().then(setIsPermissionGranted)

    let subscription: { remove: () => void } | undefined
    try {
      subscription = Notifications?.addNotificationResponseReceivedListener(
        (response) => {
          const url = response.notification.request.content.data?.url as
            | string
            | undefined
          if (url) {
            router.push(url as Parameters<typeof router.push>[0])
          }
        },
      )
    } catch {
      // Not supported in Expo Go (SDK 53+).
    }

    return () => subscription?.remove()
  }, [])

  const scheduleMessageNotification = useCallback(
    async (
      senderName: string,
      messagePreview: string,
      chatPeerId: string,
    ): Promise<void> => {
      try {
        await Notifications?.scheduleNotificationAsync({
          content: {
            title: senderName,
            body: messagePreview,
            data: { url: `/chat/${chatPeerId}` },
          },
          trigger: null,
        })
      } catch {
        // Not supported in Expo Go (SDK 53+).
      }
    },
    [],
  )

  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await Notifications?.cancelAllScheduledNotificationsAsync()
    } catch {
      // Not supported in Expo Go (SDK 53+).
    }
  }, [])

  return {
    scheduleMessageNotification,
    cancelAllNotifications,
    isPermissionGranted,
  }
}
