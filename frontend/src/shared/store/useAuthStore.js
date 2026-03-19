// src/shared/store/useAuthStore.js

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

      // ── Auth ───────────────────────────────────────────────────────────────

      register: async ({ name, email, password, role = "student" }) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }), // ✅ role передаётся
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

      logout: () => set({ user: null, token: null, error: null }),
      clearError: () => set({ error: null }),

      // ── Role helpers ───────────────────────────────────────────────────────

      getRole: () => get().user?.role ?? null,

      isAdmin: () => get().user?.role === "admin",

      isTeacher: () => ["teacher", "admin"].includes(get().user?.role),

      isAssistant: () =>
        ["assistant", "teacher", "admin"].includes(get().user?.role),

      isStudent: () => !!get().user,

      canEditCourse: (course) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === "admin") return true;
        if (user.role === "teacher") return course?.ownerId === user.id;
        return false;
      },
    }),
    {
      name: "edustream-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);

export default useAuthStore;
