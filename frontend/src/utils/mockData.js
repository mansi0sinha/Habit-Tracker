// ────────────────────────────────────────────────────────────────────────────
// Mock data for the UI boilerplate.
// Replace api/axios.js with a real axios client and delete this file when
// you wire up the backend.
// ────────────────────────────────────────────────────────────────────────────
import { format, subDays } from "date-fns";

const todayKey = () => format(new Date(), "yyyy-MM-dd");

export const mockUser = {
  _id: "u_alex",
  name: "Alex Rivera",
  email: "alex@example.com",
  avatar: "A",
  morningMotivation: true,
};

// In-memory habits — created/edited/deleted in the mock api so the UI feels live
let nextHabitId = 1;
const habit = (overrides) => ({
  _id: `h_${nextHabitId++}`,
  userId: mockUser._id,
  description: "",
  frequency: "daily",
  targetDays: 7,
  isArchived: false,
  order: nextHabitId,
  createdAt: subDays(new Date(), 89).toISOString(),
  updatedAt: subDays(new Date(), 89).toISOString(),
  ...overrides,
});

export const mockHabits = [
  habit({
    name: "Drink 2L of water",
    description: "Stay hydrated throughout the day.",
    category: "Health",
    color: "#0ea5e9",
    icon: "💧",
    order: 0,
    _streakProb: 0.95,
  }),
  habit({
    name: "Morning run",
    description: "30-minute run before breakfast.",
    category: "Fitness",
    targetDays: 5,
    color: "#ef4444",
    icon: "🏃",
    order: 1,
    _streakProb: 0.7,
    _pattern: "weekdays",
    _brokeAt: 20,
  }),
  habit({
    name: "Read 20 minutes",
    description: "Fiction or non-fiction, no phone.",
    category: "Learning",
    color: "#6366f1",
    icon: "📚",
    order: 2,
    _streakProb: 0.82,
  }),
  habit({
    name: "Meditate",
    description: "10 minutes of breath-focused meditation.",
    category: "Mindfulness",
    color: "#8b5cf6",
    icon: "🧘",
    order: 3,
    _streakProb: 0.6,
  }),
  habit({
    name: "Journal",
    description: "Write 3 things I'm grateful for.",
    category: "Mindfulness",
    targetDays: 5,
    color: "#ec4899",
    icon: "✍️",
    order: 4,
    _streakProb: 0.75,
    _pattern: "dropoff",
  }),
  habit({
    name: "Strength training",
    description: "Push/pull/legs split.",
    category: "Fitness",
    frequency: "weekly",
    targetDays: 3,
    color: "#f59e0b",
    icon: "💪",
    order: 5,
    _streakProb: 0.55,
    _pattern: "weekdays",
  }),
  habit({
    name: "Side project — 1hr",
    description: "Ship something small every day.",
    category: "Productivity",
    targetDays: 6,
    color: "#14b8a6",
    icon: "🎯",
    order: 6,
    _streakProb: 0.78,
  }),
];

// Generate deterministic-ish logs over the last 90 days
const buildLogs = () => {
  const logs = [];
  const today = new Date();
  for (const h of mockHabits) {
    for (let i = 0; i < 90; i++) {
      const d = subDays(today, i);
      const dow = d.getDay();
      const key = format(d, "yyyy-MM-dd");
      let p = h._streakProb;
      if (h._pattern === "weekdays" && (dow === 0 || dow === 6)) p *= 0.35;
      if (h._pattern === "dropoff" && i < 14) p *= 0.25;
      if (h._brokeAt && i >= h._brokeAt - 2 && i <= h._brokeAt + 2) continue;

      const seed = Math.sin(i * 9301 + h.name.length * 49297) * 233280;
      const rnd = seed - Math.floor(seed);
      if (rnd < p) {
        logs.push({
          _id: `l_${h._id}_${key}`,
          userId: mockUser._id,
          habitId: h._id,
          completedDate: key,
        });
      }
    }
  }
  // Make sure first 4 habits are checked off today for an interesting Today view
  const today_ = todayKey();
  for (let i = 0; i < 4; i++) {
    const h = mockHabits[i];
    if (!logs.some((l) => l.habitId === h._id && l.completedDate === today_)) {
      logs.push({
        _id: `l_${h._id}_${today_}`,
        userId: mockUser._id,
        habitId: h._id,
        completedDate: today_,
      });
    }
  }
  return logs;
};

export const mockLogs = buildLogs();

// ─── AI sample responses ──────────────────────────────────────────────────
export const mockAI = {
  weeklyReport: `Big week for hydration — you hit **Drink 2L of water** every single day, which is a real anchor habit forming.

Your **morning runs** slipped to 3/5 on weekdays — you're strongest Mon–Wed and tend to lose momentum mid-week. Reading and side-project work both held steady around 5/7 days.

One pattern worth noting: weekend completions across the board dropped about 30%. That's normal, but if you want to keep the streaks alive, try setting one tiny weekend version of each habit (a 5-minute walk instead of a full run, for example).

Overall this was a strong week. The fact that water is now automatic frees up willpower to focus on the trickier ones. Proud of you — keep going.`,
  recovery: `You had a great run with **Morning run** — 14 days at one point. Broken streaks are part of the journey, not the end of it.

**Day 1:** No pressure. Lace up your shoes and do a 10-minute walk-jog. The goal isn't pace, it's just showing up.

**Day 2:** 20 minutes at an easy pace. Pick a route you actually like.

**Day 3:** Back to your usual 30-minute run. By now the inertia has flipped.

Most streaks don't break because of motivation — they break because of friction. Try laying out your shoes the night before. Small setup, big payoff.`,
  morning: `Good morning, Alex! You're sitting on a **12-day water streak** — keep that going, it's the easiest win of your day. 💧 One small nudge: your **journal** habit needs a few minutes today to keep momentum. You've got this.`,
  chat: {
    default:
      "Hi — ask me anything about your habit data. I have your last 30 days loaded as context.",
    "Which day of the week am I most consistent?":
      "Looking at the past 30 days, **Monday** is your strongest day — averaging 5.2 completions per Monday. **Sunday** is the weakest at 2.8. The dip starts on Friday and bottoms out on Sunday.",
    "What is my best performing category?":
      "**Health** is your top category with 52 completions in the last 30 days, driven mostly by *Drink 2L water*. **Mindfulness** is the weakest at 28 completions — *Journal* in particular has slipped recently.",
    "Why do I keep failing my exercise habit?":
      "Your **Morning run** habit is at 19/30 in the last 30 days. The pattern is clear: weekdays are 80% strong, weekends drop to 35%. The breaks tend to start on Saturday and don't recover until Monday. A weekend-friendly alternative (like a short walk) might keep the streak alive.",
  },
  suggestions: [
    {
      name: "5-minute morning stretch",
      description: "Loosen up before the day starts.",
      frequency: "daily",
      category: "Health",
      icon: "🧘",
      reason:
        "Pairs naturally with your existing morning habits and takes almost no willpower.",
    },
    {
      name: "No screens for the first 30 minutes",
      description: "Start the morning offline.",
      frequency: "daily",
      category: "Mindfulness",
      icon: "😴",
      reason:
        "Helps your meditation habit stick and reduces decision fatigue early in the day.",
    },
    {
      name: "Weekly long walk",
      description: "60–90 minutes outdoors on Sunday.",
      frequency: "weekly",
      category: "Fitness",
      icon: "🚶",
      reason:
        "Gives you a low-friction movement habit on weekends when your run consistency drops.",
    },
  ],
};
