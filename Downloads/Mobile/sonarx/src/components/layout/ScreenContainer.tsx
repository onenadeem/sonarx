import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/src/theme/ThemeProvider'

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ScreenContainer] Error boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}

interface ScreenContainerProps {
  children: ReactNode
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
  style?: StyleProp<ViewStyle>
  scrollable?: boolean
}

export default function ScreenContainer({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  scrollable = false,
}: ScreenContainerProps) {
  const { colors } = useTheme()

  const inner = scrollable ? (
    <ScrollView
      style={[styles.fill, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, { backgroundColor: colors.background }, style]}>
      {children}
    </View>
  )

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ErrorBoundary>{inner}</ErrorBoundary>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
})
