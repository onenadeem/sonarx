import { useCallback, useEffect, useMemo, useRef } from 'react';
import { sendTypingIndicator } from '@/lib/p2p/data-channel';
import { debounce } from '@/src/utils/debounce';
import { usePresenceStore } from '@/src/store/presenceStore';
export function useTypingIndicator(peerId) {
    const isTyping = usePresenceStore((state) => state.typingStatus[peerId] ?? false);
    const setTyping = usePresenceStore((state) => state.setTyping);
    const clearTimerRef = useRef(null);
    // Auto-clear after 3 seconds of no update
    useEffect(() => {
        if (!isTyping)
            return;
        if (clearTimerRef.current)
            clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(() => {
            setTyping(peerId, false);
        }, 3_000);
        return () => {
            if (clearTimerRef.current)
                clearTimeout(clearTimerRef.current);
        };
    }, [isTyping, peerId, setTyping]);
    return { isTyping };
}
export function useSendTypingIndicator(peerId) {
    const debouncedStop = useMemo(() => debounce(() => {
        sendTypingIndicator(peerId, false).catch(() => undefined);
    }, 2_000), [peerId]);
    const onTypingStart = useCallback(() => {
        sendTypingIndicator(peerId, true).catch(() => undefined);
        debouncedStop();
    }, [peerId, debouncedStop]);
    const onTypingStop = useCallback(() => {
        debouncedStop();
    }, [debouncedStop]);
    return { onTypingStart, onTypingStop };
}
