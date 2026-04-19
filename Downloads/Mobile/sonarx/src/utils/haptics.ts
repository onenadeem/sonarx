import { Platform, Vibration } from 'react-native'

export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export async function impactAsync(style: ImpactFeedbackStyle): Promise<void> {
  if (Platform.OS === 'android') {
    const durations: Record<ImpactFeedbackStyle, number> = {
      [ImpactFeedbackStyle.Light]: 10,
      [ImpactFeedbackStyle.Medium]: 20,
      [ImpactFeedbackStyle.Heavy]: 40,
    }
    Vibration.vibrate(durations[style])
  }
}

export async function selectionAsync(): Promise<void> {
  if (Platform.OS === 'android') {
    Vibration.vibrate(5)
  }
}

export async function notificationAsync(type: NotificationFeedbackType): Promise<void> {
  if (Platform.OS === 'android') {
    Vibration.vibrate(30)
  }
}
