import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput as RNTextInput, View, } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { borderRadius, spacing, typography } from '@/src/theme/tokens';
export default function MessageInput({ value, onChangeText, onSend, onAttachmentPress, onVoicePress, placeholder = 'Message', disabled = false, replyText, onCancelReply, }) {
    const { colors } = useTheme();
    const [focused, setFocused] = useState(false);
    const trimmedValue = value.trim();
    const canSend = trimmedValue.length > 0 && !disabled;
    const handleFocus = useCallback(() => setFocused(true), []);
    const handleBlur = useCallback(() => setFocused(false), []);
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
                backgroundColor: colors.inputBackground,
                borderTopColor: colors.border,
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

      {/* Input pill container */}
      <View style={[
            styles.pillContainer,
            {
                backgroundColor: colors.surface,
                borderColor: focused ? colors.accent : colors.border,
            },
        ]}>
        <Pressable onPress={onAttachmentPress} style={styles.iconButton} accessibilityLabel="Add attachments">
          <Ionicons name="add" size={22} color={colors.textSecondary}/>
        </Pressable>

        <RNTextInput value={value} onChangeText={onChangeText} onFocus={handleFocus} onBlur={handleBlur} style={[
            styles.input,
            {
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.regular,
            },
        ]} placeholder={placeholder} placeholderTextColor={colors.textSecondary} multiline numberOfLines={1} editable={!disabled}/>

        {/* Show mic when empty, send when has text */}
        {canSend ? (<Pressable onPress={handleSendPress} style={[
                styles.sendButton,
                { backgroundColor: colors.accent },
            ]} accessibilityLabel="Send message">
            <Ionicons name="arrow-up" size={18} color="#FFFFFF"/>
          </Pressable>) : (<Pressable onPress={onVoicePress} style={styles.iconButton} accessibilityLabel="Record voice message">
            <Ionicons name="mic-outline" size={22} color={colors.textSecondary}/>
          </Pressable>)}
      </View>
    </View>);
}
const styles = StyleSheet.create({
    wrapper: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
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
    // Claude-style pill container
    pillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 26,
        minHeight: 52,
        paddingHorizontal: spacing.sm,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        paddingHorizontal: spacing.sm,
        paddingVertical: 10,
        fontSize: 15,
    },
    // Circular orange send button (Claude-style)
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 2,
    },
});
