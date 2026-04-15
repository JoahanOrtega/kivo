import { create } from "zustand";

/**
 * Estado global mínimo de autenticación.
 * Por ahora solo controla si el usuario está autenticado para validar navegación.
 */
type AuthState = {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,

  setAuthenticated: (value: boolean) => {
    set({ isAuthenticated: value });
  },

  logout: () => {
    set({ isAuthenticated: false });
  },
}));