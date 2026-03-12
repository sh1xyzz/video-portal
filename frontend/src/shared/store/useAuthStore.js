// src/shared/store/useAuthStore.js
// Zustand стор: регистрация / логин / логаут / fetchMe

import { create } from "zustand";
import { persist } from "zustand/middleware";

const API = "http://localhost:8000";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      // ── Регистрация ────────────────────────────────────────────────────────
      register: async ({ name, email, password }) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Registration failed");

          set({ user: data.user, token: data.token, loading: false });
          return { ok: true };
        } catch (err) {
          set({ loading: false, error: err.message });
          return { ok: false, error: err.message };
        }
      },

      // ── Логин ──────────────────────────────────────────────────────────────
      login: async ({ email, password }) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Invalid credentials");

          set({ user: data.user, token: data.token, loading: false });
          return { ok: true };
        } catch (err) {
          set({ loading: false, error: err.message });
          return { ok: false, error: err.message };
        }
      },

      // ── Обновить профиль ───────────────────────────────────────────────────
      updateProfile: async (fields) => {
        const { token } = get();
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API}/auth/me`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(fields),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Update failed");

          set({ user: data, loading: false });
          return { ok: true };
        } catch (err) {
          set({ loading: false, error: err.message });
          return { ok: false, error: err.message };
        }
      },

      // ── Восстановить сессию при перезагрузке ───────────────────────────────
      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            set({ user: null, token: null });
            return;
          }
          const user = await res.json();
          set({ user });
        } catch {
          set({ user: null, token: null });
        }
      },

      // ── Логаут ─────────────────────────────────────────────────────────────
      logout: () => set({ user: null, token: null, error: null }),

      clearError: () => set({ error: null }),
    }),
    {
      name: "edustream-auth", // ключ в localStorage
      partialize: (state) => ({
        // сохраняем только token
        token: state.token,
        user: state.user,
      }),
    },
  ),
);

export default useAuthStore;
