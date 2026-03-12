// src/shared/store/useThemeStore.js
// Управление темой: dark / light
// Сохраняет выбор в localStorage, применяет data-theme на <html>

import { create } from "zustand";
import { persist } from "zustand/middleware";

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "dark", // "dark" | "light"

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggle: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        applyTheme(next);
        set({ theme: next });
      },

      // Вызвать при монтировании App — восстанавливает тему из localStorage
      init: () => {
        applyTheme(get().theme);
      },
    }),
    {
      name: "edustream-theme",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

export default useThemeStore;
