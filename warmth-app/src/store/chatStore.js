import { create } from 'zustand';

// Lightweight state management for chat
const useChatStore = create((set, get) => ({
    // Messages
    messages: [],
    isLoading: false,
    isTyping: false,

    // Pagination
    hasMore: true,
    page: 1,

    // Theme
    theme: 'light',

    // Recap
    hasNewRecap: false,
    recapData: null,

    // Actions
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
    })),

    prependMessages: (messages) => set((state) => ({
        messages: [...messages, ...state.messages],
    })),

    updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
        ),
    })),

    setTyping: (isTyping) => set({ isTyping }),

    setLoading: (isLoading) => set({ isLoading }),

    loadMoreMessages: async () => {
        const { page, hasMore } = get();
        if (!hasMore) return;

        set({ isLoading: true });

        try {
            // TODO: Fetch older messages from API
            // const olderMessages = await api.getMessages(page + 1);
            // get().prependMessages(olderMessages);
            set({ page: page + 1 });
        } catch (error) {
            console.error('Failed to load more messages:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    setTheme: (theme) => set({ theme }),

    setRecapAvailable: (hasNewRecap, recapData = null) => set({
        hasNewRecap,
        recapData,
    }),

    clearRecapBadge: () => set({ hasNewRecap: false }),
}));

export default useChatStore;
