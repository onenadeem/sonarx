import { useEffect } from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useSharedValue, withTiming, withRepeat, withSequence, useAnimatedStyle, } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { borderRadius, spacing, typography } from '@/src/theme/tokens';
import { formatFileSize, formatDuration } from '@/src/utils/formatTime';
import AnimatedPressable from '@/src/components/ui/Pressable';
const THUMB_SIZE = 60;
const BAR_COUNT = 8;
function AnimatedBar({ index, color }) {
    const height = useSharedValue(4);
    useEffect(() => {
        const baseDuration = 300 + (index * 80) % 400;
        height.value = withRepeat(withSequence(withTiming(4 + ((index * 7) % 16), { duration: baseDuration }), withTiming(4, { duration: baseDuration })), -1, false);
    }, [index]);
    const animStyle = useAnimatedStyle(() => ({
        height: height.value,
    }));
    return (<Animated.View style={[styles.waveBar, { backgroundColor: color }, animStyle]}/>);
}
function WaveformBars() {
    const { colors } = useTheme();
    return (<View style={styles.waveform}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (<AnimatedBar key={i} index={i} color={colors.accent}/>))}
    </View>);
}
function RemoveButton({ onPress }) {
    return (<AnimatedPressable onPress={onPress} haptic style={styles.removeBtn} accessibilityLabel="Remove attachment">
      <View style={styles.removeBtnInner}>
        <Ionicons name="close" size={12} color="#ffffff"/>
      </View>
    </AnimatedPressable>);
}
function ImageThumb({ item, onRemove, }) {
    return (<View style={styles.thumbWrapper}>
      <Image source={{ uri: item.uri }} style={styles.thumb}/>
      <RemoveButton onPress={() => onRemove(item.id)}/>
    </View>);
}
function DocumentThumb({ item, onRemove, }) {
    const { colors } = useTheme();
    return (<View style={[
            styles.docWrapper,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        ]}>
      <Ionicons name="document-outline" size={24} color={colors.accent}/>
      <Text style={[
            styles.docName,
            { color: colors.textPrimary, fontFamily: typography.fontFamily.medium },
        ]} numberOfLines={1}>
        {item.name ?? 'Document'}
      </Text>
      {item.size !== undefined && (<Text style={[
                styles.docSize,
                { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
            ]}>
          {formatFileSize(item.size)}
        </Text>)}
      <RemoveButton onPress={() => onRemove(item.id)}/>
    </View>);
}
function AudioThumb({ item, onRemove, }) {
    const { colors } = useTheme();
    return (<View style={[
            styles.audioWrapper,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        ]}>
      <WaveformBars />
      {item.duration !== undefined && (<Text style={[
                styles.duration,
                { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
            ]}>
          {formatDuration(item.duration)}
        </Text>)}
      <RemoveButton onPress={() => onRemove(item.id)}/>
    </View>);
}
export default function AttachmentPreview({ attachments, onRemove, }) {
    const { colors } = useTheme();
    const translateY = useSharedValue(80);
    useEffect(() => {
        translateY.value = withTiming(attachments.length > 0 ? 0 : 80, {
            duration: 250,
        });
    }, [attachments.length]);
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    if (attachments.length === 0)
        return null;
    return (<Animated.View style={[
            styles.container,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
            animStyle,
        ]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {attachments.map((item) => {
            if (item.type === 'image') {
                return <ImageThumb key={item.id} item={item} onRemove={onRemove}/>;
            }
            if (item.type === 'document') {
                return <DocumentThumb key={item.id} item={item} onRemove={onRemove}/>;
            }
            return <AudioThumb key={item.id} item={item} onRemove={onRemove}/>;
        })}
      </ScrollView>
    </Animated.View>);
}
const styles = StyleSheet.create({
    container: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingVertical: spacing.xs,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        gap: spacing.xs,
        alignItems: 'flex-end',
    },
    thumbWrapper: {
        position: 'relative',
    },
    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: borderRadius.md,
    },
    docWrapper: {
        width: 100,
        height: THUMB_SIZE,
        borderRadius: borderRadius.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xxs,
        alignItems: 'flex-start',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    docName: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        marginTop: 2,
        maxWidth: 80,
    },
    docSize: {
        fontSize: 10,
        fontWeight: typography.fontWeight.regular,
        marginTop: 1,
    },
    audioWrapper: {
        width: 120,
        height: THUMB_SIZE,
        borderRadius: borderRadius.md,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing.xs,
        position: 'relative',
    },
    waveform: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        flex: 1,
    },
    waveBar: {
        width: 3,
        borderRadius: 2,
        minHeight: 4,
    },
    duration: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.regular,
    },
    removeBtn: {
        position: 'absolute',
        top: -4,
        right: -4,
    },
    removeBtnInner: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
