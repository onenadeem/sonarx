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
const HIDE_OFFSET_Y = 80;
const PANEL_ANIMATION_DURATION_MS = 250;
const BASE_WAVE_HEIGHT = 4;
const WAVE_STEP = 7;
const MIN_WAVE_DELAY = 300;
const WAVE_DELAY_MODIFIER = 400;
const EMPTY_ATTACHMENT_OPACITY = 0;
const DOCUMENT_WIDTH = 100;
const DOCUMENT_NAME_FONT_SIZE = 10;
const DOCUMENT_NAME_MARGIN_TOP = 2;
const DOCUMENT_NAME_MAX_WIDTH = 80;
const DOCUMENT_SIZE_FONT_SIZE = 10;
const DOCUMENT_SIZE_MARGIN_TOP = 1;
const REMOVE_BTN_SIZE = 18;
const REMOVE_BTN_RADIUS = 9;
const REMOVE_BTN_BG = 'rgba(0,0,0,0.6)';
const mapAttachmentRenderer = (item, onRemove, type) => {
    if (type === 'image')
        return <ImageThumb key={item.id} item={item} onRemove={onRemove}/>;
    if (type === 'document')
        return <DocumentThumb key={item.id} item={item} onRemove={onRemove}/>;
    return <AudioThumb key={item.id} item={item} onRemove={onRemove}/>;
};
function AnimatedBar({ index, color }) {
    const height = useSharedValue(4);
    useEffect(() => {
        const baseDuration = MIN_WAVE_DELAY + (index * 80) % WAVE_DELAY_MODIFIER;
        const toHeight = BASE_WAVE_HEIGHT + ((index * WAVE_STEP) % 16);
        height.value = withRepeat(withSequence(withTiming(toHeight, { duration: baseDuration }), withTiming(BASE_WAVE_HEIGHT, { duration: baseDuration })), -1, false);
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
        translateY.value = withTiming(attachments.length > 0 ? EMPTY_ATTACHMENT_OPACITY : HIDE_OFFSET_Y, {
            duration: PANEL_ANIMATION_DURATION_MS,
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
        {attachments.map((item) => mapAttachmentRenderer(item, onRemove, item.type))}
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
        width: DOCUMENT_WIDTH,
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
        fontSize: DOCUMENT_NAME_FONT_SIZE,
        marginTop: DOCUMENT_NAME_MARGIN_TOP,
        maxWidth: DOCUMENT_NAME_MAX_WIDTH,
    },
    docSize: {
        fontSize: DOCUMENT_SIZE_FONT_SIZE,
        fontWeight: typography.fontWeight.regular,
        marginTop: DOCUMENT_SIZE_MARGIN_TOP,
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
        width: REMOVE_BTN_SIZE,
        height: REMOVE_BTN_SIZE,
        borderRadius: REMOVE_BTN_RADIUS,
        backgroundColor: REMOVE_BTN_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
