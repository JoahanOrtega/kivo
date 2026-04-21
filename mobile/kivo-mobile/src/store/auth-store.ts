import { create } from "zustand";

import * as api from "@/services/api";
import { clearSession, getSession, saveSession } from "@/services/secure-session";
import type { AuthSession, AuthUser } from "@/types/auth";
import { bootstrapCatalogs } from "@/features/sync/bootstrap.service";

type AuthState = {
    isAuthenticated: boolean;
    isHydrated: boolean;
    session: AuthSession | null;
    hydrateSession: () => Promise<void>;
    login: (payload: { email: string; password: string }) => Promise<void>;
    register: (payload: { email: string; password: string; fullName: string }) => Promise<void>;
    logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    isHydrated: false,
    session: null,

    // ─── Hidratación ──────────────────────────────────────────────────────────
    // Carga la sesión persistida al iniciar la app.
    // Si existe un token válido, el usuario queda autenticado sin re-login.
    hydrateSession: async () => {
        try {
            const storedSession = await getSession();
            set({
                session: storedSession,
                isAuthenticated: Boolean(storedSession),
                isHydrated: true,
            });
        } catch (error) {
            console.error("Error hydrating session:", error);
            set({
                session: null,
                isAuthenticated: false,
                isHydrated: true,
            });
        }
    },

    // ─── Login real contra el backend ─────────────────────────────────────────
    // Reemplaza el mock anterior. Llama a POST /auth/login y persiste
    // el token JWT en SecureStore para sesiones futuras.
    login: async ({ email, password }) => {
        const response = await api.login({
            email: email.trim().toLowerCase(),
            password,
        });

        const user: AuthUser = {
            id: response.user.id,
            name: response.user.full_name,
            email: response.user.email,
        };

        const session: AuthSession = {
            accessToken: response.access_token,
            refreshToken: response.refresh_token,
            user,
        };

        await saveSession(session);

        set({
            session,
            isAuthenticated: true,
        });

        // ── Sincronizar catálogos del backend hacia SQLite ──────────────────────
        // Se ejecuta en background después del login — no bloquea la navegación.
        // Actualiza los UUIDs locales con los reales del servidor.
        await bootstrapCatalogs(response.user.id);
        // Notifica al dashboard que los datos están listos
        import("@/store/sync-store").then(({ useSyncStore }) => {
            useSyncStore.getState().notifySyncCompleted();
        });
    },

    // ─── Register real contra el backend ─────────────────────────────────────
    // Llama a POST /auth/register y deja al usuario logueado inmediatamente.
    register: async ({ email, password, fullName }: {
        email: string;
        password: string;
        fullName: string;
    }) => {
        const response = await api.register({
            email: email.trim().toLowerCase(),
            password,
            full_name: fullName,
        });

        const user: AuthUser = {
            id: response.user.id,
            name: response.user.full_name,
            email: response.user.email,
        };

        const session: AuthSession = {
            accessToken: response.access_token,
            refreshToken: response.refresh_token, // ← ya no es string vacío
            user,
        };

        await saveSession(session);

        set({
            session,
            isAuthenticated: true,
        });
        await bootstrapCatalogs(response.user.id);
        // Notifica al dashboard que los datos están listos
        import("@/store/sync-store").then(({ useSyncStore }) => {
            useSyncStore.getState().notifySyncCompleted();
        });
    },

    // ─── Logout ───────────────────────────────────────────────────────────────
    logout: async () => {
        await clearSession();
        set({
            session: null,
            isAuthenticated: false,
        });
    },
}));