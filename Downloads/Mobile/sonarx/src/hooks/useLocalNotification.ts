import { useCallback, useEffect, useState } from 'react'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotificationsAsync(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export function useLocalNotification() {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)

  useEffect(() => {
    registerForPushNotificationsAsync().then(setIsPermissionGranted)

    // Handle tap on notification → navigate to chat
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined
        if (url) {
          router.push(url as Parameters<typeof router.push>[0])
        }
      },
    )

    return () => subscription.remove()
  }, [])

  const scheduleMessageNotification = useCallback(
    async (
      senderName: string,
      messagePreview: string,
      chatPeerId: string,
    ): Promise<void> => {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: senderName,
          body: messagePreview,
          data: { url: `/chat/${chatPeerId}` },
        },
        trigger: null,
      })
    },
    [],
  )

  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }, [])

  return {
    scheduleMessageNotification,
    cancelAllNotifications,
    isPermissionGranted,
  }
}
