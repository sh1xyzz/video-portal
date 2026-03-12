// src/shared/store/useCoinsStore.js
// EduCoins — баланс, транзакции, лидерборд, ежедневный вход

import { create } from "zustand";
import useAuthStore from "./useAuthStore";

const API = "http://localhost:8000";

const authHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const useCoinsStore = create((set, get) => ({
  balance: 0,
  totalEver: 0,
  currentStreak: 0,
  longestStreak: 0,
  transactions: [],
  leaderboard: [],
  loading: false,
  dailyClaimed: false, // уже получены монеты за сегодня

  // ── Загрузить баланс + серию ──────────────────────────────────────────────
  fetchBalance: async () => {
    try {
      const res = await fetch(`${API}/coins/me`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      set({
        balance: data.balance,
        totalEver: data.total_ever,
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
      });
    } catch {}
  },

  // ── История транзакций ────────────────────────────────────────────────────
  fetchTransactions: async () => {
    try {
      const res = await fetch(`${API}/coins/transactions`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      set({ transactions: data });
    } catch {}
  },

  // ── Лидерборд ─────────────────────────────────────────────────────────────
  fetchLeaderboard: async () => {
    try {
      const res = await fetch(`${API}/coins/leaderboard`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      set({ leaderboard: data });
    } catch {}
  },

  // ── Ежедневный вход ───────────────────────────────────────────────────────
  claimDailyLogin: async () => {
    try {
      const res = await fetch(`${API}/coins/daily-login`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();

      if (!data.already_claimed) {
        set((s) => ({
          balance: data.balance,
          currentStreak: data.streak,
          dailyClaimed: true,
        }));
      } else {
        set({ dailyClaimed: true });
      }
      return data;
    } catch {
      return null;
    }
  },

  // ── Загрузить всё сразу ───────────────────────────────────────────────────
  fetchAll: async () => {
    const {
      fetchBalance,
      fetchTransactions,
      fetchLeaderboard,
      claimDailyLogin,
    } = get();
    set({ loading: true });
    await Promise.all([
      fetchBalance(),
      fetchTransactions(),
      fetchLeaderboard(),
    ]);
    await claimDailyLogin();
    set({ loading: false });
  },

  reset: () =>
    set({
      balance: 0,
      totalEver: 0,
      currentStreak: 0,
      longestStreak: 0,
      transactions: [],
      leaderboard: [],
      dailyClaimed: false,
    }),
}));

export default useCoinsStore;
