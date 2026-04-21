import { create } from "zustand";

// ─── Store de sync ────────────────────────────────────────────────────────────
// Permite que el sync en background notifique al dashboard
// que debe recargarse cuando termina.
type SyncState = {
    lastSyncAt: number;
    notifySyncCompleted: () => void;
};

export const useSyncStore = create<SyncState>((set) => ({
    lastSyncAt: 0,
    notifySyncCompleted: () => set({ lastSyncAt: Date.now() }),
}));