import { useCallback } from 'react'
import { Pressable, StyleSheet, Text, TextInput as RNTextInput, View, } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { borderRadius, spacing, typography } from '@/src/theme/tokens';
export default function MessageInput({ value, onChangeText, onSend, onAttachmentPress, placeholder = 'Message', disabled = false, replyText, onCancelReply, }) {
    const { colors } = useTheme();
    const trimmedValue = value.trim();
    const canSend = trimmedValue.length > 0 && !disabled;
    const handleSendPress = useCallback(() => {
        if (!canSend) {
            return;
        }
        onSend?.();
    }, [canSend, onSend]);
    const hasReply = Boolean(replyText);
    return (<View style={[
            styles.wrapper,
            {
                backgroundColor: 'transparent',
            },
        ]}>
      {/* Reply banner */}
      {hasReply ? (<View style={[
                styles.replyBar,
                {
                    backgroundColor: colors.surfaceMuted,
                    borderLeftColor: colors.accent,
                },
            ]}>
          <Text style={[
                styles.replyText,
                {
                    color: colors.textSecondary,
                    fontFamily: typography.fontFamily.regular,
                },
            ]} numberOfLines={1}>
            {replyText}
          </Text>
          <Pressable onPress={onCancelReply} style={styles.replyDismiss} accessibilityLabel="Cancel reply">
            <Ionicons name="close" size={16} color={colors.textSecondary}/>
          </Pressable>
        </View>) : null}

      <View style={styles.inputRow}>
        <Pressable onPress={onAttachmentPress} style={[styles.floatingPill, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        }]} accessibilityLabel="Add attachments">
          <Ionicons name="add" size={20} color={colors.textSecondary}/>
        </Pressable>

        <View style={[
            styles.pillContainer,
            {
                backgroundColor: colors.surface,
                borderColor: colors.border,
            },
        ]}>
          <RNTextInput value={value} onChangeText={onChangeText} style={[
                styles.input,
                {
                    color: colors.textPrimary,
                    fontFamily: typography.fontFamily.regular,
                },
            ]} placeholder={placeholder} placeholderTextColor={colors.textSecondary} multiline numberOfLines={1} editable={!disabled}/>
        </View>

        <Pressable onPress={handleSendPress} disabled={!canSend} style={[
                styles.actionPill,
                {
                    backgroundColor: canSend ? colors.primary : colors.surface,
                    borderColor: canSend ? colors.primary : colors.border,
                    opacity: canSend ? 1 : 0.55,
                },
            ]} accessibilityLabel="Send message">
          <Ionicons name="arrow-up" size={18} color={canSend ? colors.primaryForeground : colors.textSecondary}/>
        </Pressable>
      </View>
    </View>);
}
const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: 0,
    },
    replyBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 3,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.sm,
    },
    replyText: {
        ...typography.caption,
        flex: 1,
    },
    replyDismiss: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    pillContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 45,
        borderWidth: 1,
        borderRadius: 30,
        minHeight: 45,
        paddingHorizontal: spacing.sm,
        minWidth: 0,
    },
    floatingPill: {
        width: 45,
        height: 45,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22.5,
        borderWidth: 1,
    },
    input: {
        flex: 1,
        minWidth: 0,
        minHeight: 45,
        maxHeight: 120,
        paddingHorizontal: spacing.sm,
        paddingVertical: 8,
        textAlignVertical: 'center',
        fontSize: 15,
    },
    actionPill: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
});
