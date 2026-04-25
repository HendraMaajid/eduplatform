import { create } from "zustand";
import { UserRole } from "./types";
import { mockUsers } from "./mock-data";

interface AppState {
  // For development: mock role switching
  currentRole: UserRole;
  currentUserId: string;
  setCurrentRole: (role: UserRole) => void;

  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Language
  locale: "id" | "en";
  setLocale: (locale: "id" | "en") => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: "student",
  currentUserId: "u1",
  setCurrentRole: (role) => {
    const user = mockUsers.find((u) => u.role === role);
    set({ currentRole: role, currentUserId: user?.id || "u1" });
  },

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  locale: "id",
  setLocale: (locale) => set({ locale }),
}));
