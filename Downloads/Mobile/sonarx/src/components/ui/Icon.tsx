import React from 'react'
import { type StyleProp, type TextStyle } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/theme/ThemeProvider'

interface IconProps {
  name: string
  size?: number
  color?: string
  style?: StyleProp<TextStyle>
}

export default function Icon({ name, size = 20, color, style }: IconProps) {
  const { colors } = useTheme()
  return (
    <Ionicons
      name={name as never}
      size={size}
      color={color ?? colors.textSecondary}
      style={style}
    />
  )
}
