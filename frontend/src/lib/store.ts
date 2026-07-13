import { create } from "zustand";
import type { Locale } from "./types";

interface AppState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useAppStore = create<AppState>((set) => ({
  locale: "id",
  setLocale: (locale) => set({ locale }),
}));
