import { useCallback, useEffect, useMemo, useRef } from 'react';
import { sendTypingIndicator } from '@/lib/p2p/data-channel';
import { debounce } from '@/src/utils/debounce';
import { usePresenceStore } from '@/src/store/presenceStore';
const TYPING_VISIBLE_MS = 3_000;
const STOP_INDICATOR_DEBOUNCE_MS = 2_000;
const clearTimer = (timerRef) => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
};
export function useTypingIndicator(peerId) {
    const isTyping = usePresenceStore((state) => state.typingStatus[peerId] ?? false);
    const setTyping = usePresenceStore((state) => state.setTyping);
    const clearTimerRef = useRef(null);
    // Auto-clear after 3 seconds of no update
    useEffect(() => {
        if (!isTyping)
            return;
        clearTimer(clearTimerRef);
        clearTimerRef.current = setTimeout(() => {
            setTyping(peerId, false);
        }, TYPING_VISIBLE_MS);
        return () => {
            clearTimer(clearTimerRef);
        };
    }, [isTyping, peerId, setTyping]);
    return { isTyping };
}
export function useSendTypingIndicator(peerId) {
    const debouncedStop = useMemo(() => debounce(() => {
        sendTypingIndicator(peerId, false).catch(() => undefined);
    }, STOP_INDICATOR_DEBOUNCE_MS), [peerId]);
    const onTypingStart = useCallback(() => {
        sendTypingIndicator(peerId, true).catch(() => undefined);
        debouncedStop();
    }, [peerId, debouncedStop]);
    const onTypingStop = useCallback(() => {
        debouncedStop();
    }, [debouncedStop]);
    return { onTypingStart, onTypingStop };
}
