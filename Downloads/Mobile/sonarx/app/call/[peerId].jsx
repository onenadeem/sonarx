import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '@/db/client';
import { typography, spacing } from '@/src/theme/tokens';
import Avatar from '@/src/components/ui/Avatar';
export default function CallScreen() {
    const { peerId, video } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [peer, setPeer] = useState(null);
    const isVideo = video === 'true';
    useEffect(() => {
        db.query.peers.findFirst({ where: (p, { eq }) => eq(p.id, peerId) })
            .then((p) => p && setPeer(p))
            .catch(console.error);
    }, [peerId]);
    const displayName = peer?.displayName ?? peerId ?? 'Unknown';
    return (<View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="light"/>

      <View style={styles.topSection}>
        <Avatar name={displayName} uri={peer?.avatarUri} size="xl"/>
        <Text style={[styles.name, { fontFamily: typography.fontFamily.semiBold }]}>
          {displayName}
        </Text>
        <Text style={[styles.status, { fontFamily: typography.fontFamily.regular }]}>
          {isVideo ? 'Video call' : 'Voice call'} · Not available in Expo Go
        </Text>
        <View style={styles.noticeBox}>
          <Text style={[styles.noticeText, { fontFamily: typography.fontFamily.regular }]}>
            Calls require a development build.{'\n'}Run: npx expo run:android
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable style={[styles.ctrlBtn, { backgroundColor: '#ef4444' }]} onPress={() => router.back()}>
          <Ionicons name="call" size={28} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }}/>
        </Pressable>
      </View>
    </View>);
}
const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.xxxl,
        backgroundColor: '#09090b',
    },
    topSection: {
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
    },
    name: {
        fontSize: 28,
        color: '#fafafa',
        letterSpacing: -0.5,
        marginTop: spacing.md,
    },
    status: {
        fontSize: 15,
        color: '#a1a1aa',
    },
    noticeBox: {
        marginTop: spacing.lg,
        backgroundColor: '#18181b',
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    noticeText: {
        fontSize: 13,
        color: '#71717a',
        textAlign: 'center',
        lineHeight: 20,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xl,
    },
    ctrlBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
