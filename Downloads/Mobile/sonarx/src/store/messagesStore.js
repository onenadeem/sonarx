import { create } from 'zustand';
// ─── Store ────────────────────────────────────────────────────────────────────
const sortChatsByLastMessage = (chats) => [...chats].sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
const updateMessagesByChatId = (state, chatId, updater) => {
    const messages = state.messagesByChatId[chatId];
    if (!messages) {
        return state;
    }
    return {
        messagesByChatId: {
            ...state.messagesByChatId,
            [chatId]: updater(messages),
        },
    };
};
export const useMessagesStore = create()((set) => ({
    // ── ChatState ──────────────────────────────────────────────────────────────
    messagesByChatId: {},
    setMessages: (chatId, messages) => set((state) => ({
        messagesByChatId: { ...state.messagesByChatId, [chatId]: messages },
    })),
    addMessage: (chatId, message) => set((state) => {
        const existing = state.messagesByChatId[chatId] ?? [];
        return updateMessagesByChatId(state, chatId, () => [message, ...existing]);
    }),
    updateMessageStatus: (chatId, messageId, status, timestamp) => set((state) => updateMessagesByChatId(state, chatId, (msgs) => msgs.map((m) => m.id === messageId
        ? {
            ...m,
            status,
            readAt: status === 'read'
                ? (timestamp ?? Date.now())
                : m.readAt,
        }
        : m))),
    deleteMessage: (chatId, messageId) => set((state) => updateMessagesByChatId(state, chatId, (msgs) => msgs.map((m) => m.id === messageId ? { ...m, isDeleted: 1, content: '' } : m))),
    clearChat: (chatId) => set((state) => {
        const next = { ...state.messagesByChatId };
        delete next[chatId];
        return { messagesByChatId: next };
    }),
    // ── ChatsListState ─────────────────────────────────────────────────────────
    chats: [],
    unreadCounts: {},
    setChats: (chats) => set({
        chats: sortChatsByLastMessage(chats),
    }),
    addOrUpdateChat: (chat) => set((state) => {
        const idx = state.chats.findIndex((c) => c.id === chat.id);
        const updated = idx >= 0
            ? [
                ...state.chats.slice(0, idx),
                chat,
                ...state.chats.slice(idx + 1),
            ]
            : [chat, ...state.chats];
        return {
            chats: sortChatsByLastMessage(updated),
        };
    }),
    updateUnreadCount: (chatId, count) => set((state) => ({
        unreadCounts: { ...state.unreadCounts, [chatId]: count },
    })),
    incrementUnreadCount: (chatId) => set((state) => ({
        unreadCounts: {
            ...state.unreadCounts,
            [chatId]: (state.unreadCounts[chatId] ?? 0) + 1,
        },
    })),
    resetUnreadCount: (chatId) => set((state) => ({
        unreadCounts: { ...state.unreadCounts, [chatId]: 0 },
    })),
}));
