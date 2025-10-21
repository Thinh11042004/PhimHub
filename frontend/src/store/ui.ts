import { create } from "zustand";

type AuthMode = "login" | "register";

type UIState = {
  authOpen: boolean;
  authMode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  setMode: (m: AuthMode) => void;
};

export const useUI = create<UIState>((set) => ({
  authOpen: false,
  authMode: "login",
  openAuth: (mode = "login") => set({ authOpen: true, authMode: mode }),
  closeAuth: () => set({ authOpen: false }),
  setMode: (m) => set({ authMode: m }),
}));
