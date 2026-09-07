// ────────────────────────────────────────────────────────────────────────────
// MOCK API CLIENT — boilerplate only.
//
// Backed by in-memory mock data so every page renders with realistic content
// without any backend running.
//
// TODO (when integrating the real backend):
//   1. Replace this entire file with the real axios client below.
//   2. Delete utils/mockData.js.
//
//   import axios from "axios";
//
//   const api = axios.create({
//     baseURL: "http://localhost:8000/api",
//   });
//
//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("token");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });
//
//   api.interceptors.response.use(
//     (res) => res,
//     (err) => {
//       if (err.response?.status === 401) {
//         const path = window.location.pathname;
//         if (path !== "/login" && path !== "/register" && path !== "/") {
//           localStorage.removeItem("token");
//           localStorage.removeItem("user");
//           window.location.href = "/login";
//         }
//       }
//       return Promise.reject(err);
//     }
//   );
//
//   export default api;
// ────────────────────────────────────────────────────────────────────────────
import { format, subDays } from "date-fns";
import { mockUser, mockHabits, mockLogs, mockAI } from "../utils/mockData.js";

const state = {
  user: { ...mockUser },
  habits: mockHabits.map((h) => ({ ...h })),
  logs: mockLogs.map((l) => ({ ...l })),
};

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const todayKey = () => format(new Date(), "yyyy-MM-dd");

const mockStreak = (keys) => {
  if (!keys?.length) return { current: 0, longest: 0 };
  const set = new Set(keys);
  const today = todayKey();
  const yKey = format(subDays(new Date(), 1), "yyyy-MM-dd");
  let current = 0;
  let cursor = new Date();
  if (!set.has(today) && !set.has(yKey)) current = 0;
  else {
    if (!set.has(today)) cursor = subDays(cursor, 1);
    while (set.has(format(cursor, "yyyy-MM-dd"))) {
      current += 1;
      cursor = subDays(cursor, 1);
    }
  }
  const sorted = [...keys].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const k of sorted) {
    if (prev) {
      const diff = Math.round(
        (new Date(k) - new Date(prev)) / (1000 * 60 * 60 * 24)
      );
      run = diff === 1 ? run + 1 : 1;
    } else run = 1;
    if (run > longest) longest = run;
    prev = k;
  }
  return { current, longest };
};

const route = async (method, url, data, params) => {
  // ─── Auth ─────────────────────────────────────────────────────────────
  if (method === "GET" && url === "/auth/me") return { user: state.user };
  if (method === "POST" && url === "/auth/login")
    return { user: state.user, token: "mock-token" };
  if (method === "POST" && url === "/auth/register") {
    state.user = {
      ...state.user,
      name: data.name,
      email: data.email,
      avatar: data.name.charAt(0).toUpperCase(),
    };
    return { user: state.user, token: "mock-token" };
  }
  if (method === "PUT" && url === "/auth/profile") {
    if (data.name !== undefined) {
      state.user.name = data.name;
      state.user.avatar = data.name.charAt(0).toUpperCase();
    }
    if (data.morningMotivation !== undefined)
      state.user.morningMotivation = data.morningMotivation;
    return { user: state.user };
  }

  // ─── Habits ──────────────────────────────────────────────────────────
  if (method === "GET" && url === "/habits") {
    const includeArchived = params?.includeArchived === "true";
    return state.habits
      .filter((h) => includeArchived || !h.isArchived)
      .sort(
        (a, b) =>
          a.order - b.order || a.createdAt.localeCompare(b.createdAt)
      );
  }
  if (method === "POST" && url === "/habits") {
    const newHabit = {
      _id: `h_${Date.now()}`,
      userId: state.user._id,
      name: data.name,
      description: data.description || "",
      category: data.category || "Other",
      frequency: data.frequency || "daily",
      targetDays: data.targetDays || 7,
      color: data.color || "#6366f1",
      icon: data.icon || "🎯",
      isArchived: false,
      order: state.habits.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.habits.push(newHabit);
    return newHabit;
  }
  if (
    method === "PUT" &&
    url.startsWith("/habits/") &&
    url.endsWith("/archive")
  ) {
    const id = url.split("/")[2];
    const h = state.habits.find((x) => x._id === id);
    if (h) h.isArchived = !h.isArchived;
    return h;
  }
  if (method === "PUT" && url.startsWith("/habits/")) {
    const id = url.split("/")[2];
    const h = state.habits.find((x) => x._id === id);
    if (h) Object.assign(h, data, { updatedAt: new Date().toISOString() });
    return h;
  }
  if (method === "DELETE" && url.startsWith("/habits/")) {
    const id = url.split("/")[2];
    state.habits = state.habits.filter((x) => x._id !== id);
    state.logs = state.logs.filter((x) => x.habitId !== id);
    return { message: "Deleted" };
  }

  // ─── Logs ───────────────────────────────────────────────────────────
  if (method === "POST" && url === "/logs") {
    const completedDate = data.date || todayKey();
    const exists = state.logs.find(
      (l) => l.habitId === data.habitId && l.completedDate === completedDate
    );
    if (exists) return exists;
    const log = {
      _id: `l_${data.habitId}_${completedDate}`,
      userId: state.user._id,
      habitId: data.habitId,
      completedDate,
    };
    state.logs.push(log);
    return log;
  }
  if (method === "DELETE" && url === "/logs") {
    const completedDate = data.date || todayKey();
    state.logs = state.logs.filter(
      (l) => !(l.habitId === data.habitId && l.completedDate === completedDate)
    );
    return { message: "Unmarked" };
  }
  if (method === "GET" && url === "/logs/today") {
    const today = todayKey();
    return state.logs.filter((l) => l.completedDate === today);
  }
  if (method === "GET" && url === "/logs/range") {
    const { start, end } = params || {};
    return state.logs.filter(
      (l) => l.completedDate >= start && l.completedDate <= end
    );
  }
  if (method === "GET" && url === "/logs/heatmap") {
    const days = [];
    const end = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = subDays(end, i);
      const key = format(d, "yyyy-MM-dd");
      const count = state.logs.filter((l) => l.completedDate === key).length;
      days.push({ date: key, count });
    }
    return days;
  }
  if (method === "GET" && url === "/logs/stats") {
    const days30 = [];
    const end = new Date();
    for (let i = 29; i >= 0; i--)
      days30.push(format(subDays(end, i), "yyyy-MM-dd"));
    const perHabit = state.habits
      .filter((h) => !h.isArchived)
      .map((h) => {
        const hLogs = state.logs.filter(
          (l) =>
            l.habitId === h._id &&
            l.completedDate >= days30[0] &&
            l.completedDate <= days30[days30.length - 1]
        );
        const keys = hLogs.map((l) => l.completedDate).sort().reverse();
        const { current, longest } = mockStreak(keys);
        return {
          habitId: h._id,
          name: h.name,
          icon: h.icon,
          color: h.color,
          category: h.category,
          completions30d: hLogs.length,
          currentStreak: current,
          longestStreak: longest,
        };
      });
    return { perHabit, days: days30 };
  }
  if (method === "GET" && url.startsWith("/logs/stats/")) {
    const id = url.split("/")[3];
    const h = state.habits.find((x) => x._id === id);
    if (!h) return { message: "not found" };
    const hLogs = state.logs
      .filter((l) => l.habitId === id)
      .sort((a, b) => b.completedDate.localeCompare(a.completedDate));
    const keys = hLogs.map((l) => l.completedDate);
    const { current, longest } = mockStreak(keys);
    return {
      habit: h,
      totalCompletions: hLogs.length,
      currentStreak: current,
      longestStreak: longest,
      completionRate: 75,
      monthly: {},
    };
  }

  // ─── AI ─────────────────────────────────────────────────────────────
  if (method === "POST" && url === "/ai/weekly-report")
    return { content: mockAI.weeklyReport };
  if (method === "POST" && url === "/ai/suggest-habits")
    return { suggestions: mockAI.suggestions };
  if (method === "POST" && url === "/ai/recovery-plan")
    return { content: mockAI.recovery };
  if (method === "POST" && url === "/ai/chat") {
    const q = data?.question || "";
    const matched = Object.entries(mockAI.chat).find(([k]) =>
      q.toLowerCase().includes(k.toLowerCase().slice(0, 25))
    );
    return {
      content:
        matched?.[1] ||
        `Looking at your last 30 days of habit data — that's an interesting question. *(This is a mock response — wire up the real /api/ai/chat endpoint to get personalised answers from Gemini.)*`,
    };
  }
  if (method === "GET" && url === "/ai/morning")
    return { content: mockAI.morning };

  console.warn("[mock api] unhandled route:", method, url);
  return null;
};

const api = {
  get: async (url, opts = {}) => {
    await delay();
    return { data: await route("GET", url, null, opts.params) };
  },
  post: async (url, data) => {
    await delay();
    return { data: await route("POST", url, data) };
  },
  put: async (url, data) => {
    await delay();
    return { data: await route("PUT", url, data) };
  },
  delete: async (url, opts = {}) => {
    await delay();
    return { data: await route("DELETE", url, opts?.data) };
  },
};

export default api;
