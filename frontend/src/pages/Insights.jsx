import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  CalendarRange,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format } from "date-fns";

import api from "../api/axios.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  todayKey,
  addDaysToKey,
} from "../utils/dateHelpers.js";

const PIE_COLORS = [
  "#f59e0b",
  "#fb923c",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#14b8a6",
];

export default function Insights() {
  const { theme } = useTheme();
  const { user } = useAuth();

  const timezone =
    user?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const isDark = theme === "dark";

  const grid = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(15,15,27,0.08)";

  const tick = isDark ? "#8a8aa0" : "#6b6b78";

  const tooltipStyle = {
    background: isDark
      ? "rgba(20,20,36,0.95)"
      : "rgba(255,255,255,0.95)",
    border: `1px solid ${grid}`,
    borderRadius: 12,
    fontSize: 12,
    color: isDark ? "#ebebf5" : "#13131b",
  };

  const [habits, setHabits] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [statsByHabit, setStatsByHabit] = useState({});
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD REAL DATA
  // =========================
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const today = todayKey(timezone);

        const startDate = addDaysToKey(
          today,
          -13
        );

        const endDate = today;

        const [habitsRes, checkInsRes] =
          await Promise.all([
            api.get("/habits"),

            api.get("/habits/checkins", {
              params: {
                start: startDate,
                end: endDate,
              },
            }),
          ]);

        const habitList =
          habitsRes.data.habits || [];

        const checkInList =
          checkInsRes.data.checkIns || [];

        setHabits(habitList);
        setCheckIns(checkInList);

        const entries = await Promise.all(
          habitList.map(async (habit) => {
            try {
              const res = await api.get(
                `/habits/${habit._id}/stats`
              );

              return [
                habit._id,
                {
                  currentStreak:
                    res.data.currentStreak || 0,

                  longestStreak:
                    res.data.longestStreak || 0,
                },
              ];
            } catch {
              return [
                habit._id,
                {
                  currentStreak: 0,
                  longestStreak: 0,
                },
              ];
            }
          })
        );

        setStatsByHabit(
          Object.fromEntries(entries)
        );
      } catch (error) {
        console.error(
          "Failed to load insights:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [timezone]);

  // =========================
  // DATE RANGES
  // =========================

  const thisWeekDates = useMemo(() => {
    const today = todayKey(timezone);

    return Array.from(
      { length: 7 },
      (_, index) => {
        const key = addDaysToKey(
          today,
          -6 + index
        );

        const date = new Date(
          `${key}T00:00:00Z`
        );

        return {
          date,
          key,
          label: format(date, "EEE"),
        };
      }
    );
  }, [timezone]);

  const lastWeekDates = useMemo(() => {
    const today = todayKey(timezone);

    return Array.from(
      { length: 7 },
      (_, index) => {
        const key = addDaysToKey(
          today,
          -13 + index
        );

        const date = new Date(
          `${key}T00:00:00Z`
        );

        return {
          date,
          key,
          label: format(date, "EEE"),
        };
      }
    );
  }, [timezone]);

  const thisWeekKeys = useMemo(
    () =>
      new Set(
        thisWeekDates.map(
          (d) => d.key
        )
      ),
    [thisWeekDates]
  );

  // =========================
  // WEEK DATA
  // =========================

  const thisWeekLogs = useMemo(
    () =>
      checkIns.filter((c) =>
        thisWeekKeys.has(
          c.localDate
        )
      ),
    [checkIns, thisWeekKeys]
  );

  const lastWeekLogs = useMemo(
    () =>
      checkIns.filter(
        (c) =>
          !thisWeekKeys.has(
            c.localDate
          )
      ),
    [checkIns, thisWeekKeys]
  );

  const totalDone =
    thisWeekLogs.length;

  const totalLast =
    lastWeekLogs.length;

  const totalSlots =
    habits.length * 7;

  const completionRate =
    totalSlots
      ? Math.min(
          100,
          Math.round(
            (totalDone /
              totalSlots) *
              100
          )
        )
      : 0;

  const delta =
    totalDone - totalLast;

  const deltaPct = totalLast
    ? Math.round(
        ((totalDone -
          totalLast) /
          totalLast) *
          100
      )
    : totalDone > 0
    ? 100
    : 0;

  // =========================
  // DAILY CHART
  // =========================

  const dailyData =
    thisWeekDates.map(
      (day) => ({
        label: day.label,

        count:
          thisWeekLogs.filter(
            (c) =>
              c.localDate ===
              day.key
          ).length,
      })
    );

  // =========================
  // WEEK COMPARISON
  // =========================

  const compareData =
    thisWeekDates.map(
      (day, index) => {
        const thisCount =
          thisWeekLogs.filter(
            (c) =>
              c.localDate ===
              day.key
          ).length;

        const lastCount =
          lastWeekLogs.filter(
            (c) =>
              c.localDate ===
              lastWeekDates[index]
                .key
          ).length;

        return {
          label: day.label,
          "This week": thisCount,
          "Last week": lastCount,
        };
      }
    );

  const bestDay =
    [...dailyData].sort(
      (a, b) =>
        b.count - a.count
    )[0];

  // =========================
  // HABIT PERFORMANCE
  // =========================

  const perHabit = useMemo(() => {
    return habits
      .map((habit) => {
        const done =
          thisWeekLogs.filter(
            (c) =>
              String(c.habit) ===
              String(habit._id)
          ).length;

        const target =
          habit.targetDays || 7;

        return {
          habit,
          done,
          target,

          pct: Math.min(
            100,
            Math.round(
              (done /
                Math.max(
                  1,
                  target
                )) *
                100
            )
          ),
        };
      })
      .sort(
        (a, b) =>
          b.pct - a.pct
      );
  }, [habits, thisWeekLogs]);

  const topHabit =
    perHabit[0];

  // =========================
  // CATEGORY DATA
  // =========================

  const categoryData =
    useMemo(() => {
      const habitCategory = {};

      for (const habit of habits) {
        habitCategory[
          String(habit._id)
        ] = habit.category;
      }

      const counts = {};

      for (const checkIn of thisWeekLogs) {
        const category =
          habitCategory[
            String(
              checkIn.habit
            )
          ];

        if (!category) continue;

        counts[category] =
          (counts[category] || 0) +
          1;
      }

      return Object.entries(
        counts
      ).map(
        ([name, value]) => ({
          name,
          value,
        })
      );
    }, [habits, thisWeekLogs]);

  // =========================
  // STREAK BOARD
  // =========================

  const activeStreaks =
    habits.filter(
      (habit) =>
        (
          statsByHabit[
            habit._id
          ]?.currentStreak || 0
        ) > 0
    ).length;

  if (loading) {
    return <LoadingSpinner full />;
  }

  // =========================
  // DELTA PILL
  // =========================

  const DeltaPill = () => {
    const Icon =
      delta > 0
        ? TrendingUp
        : delta < 0
        ? TrendingDown
        : Minus;

    const color =
      delta > 0
        ? "text-emerald-500 bg-emerald-500/10"
        : delta < 0
        ? "text-rose-500 bg-rose-500/10"
        : "text-faint bg-[var(--chip-bg)]";

    const label =
      delta === 0
        ? "no change"
        : `${
            delta > 0
              ? "+"
              : ""
          }${delta} (${
            deltaPct > 0
              ? "+"
              : ""
          }${deltaPct}%)`;

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
      >
        <Icon size={12} />

        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Weekly insights
        </h1>

        <p className="text-sm text-muted mt-0.5 inline-flex items-center gap-2">
          <CalendarRange size={14} />

          {format(
            thisWeekDates[0].date,
            "MMM d"
          )}{" "}
          —{" "}
          {format(
            thisWeekDates[6].date,
            "MMM d, yyyy"
          )}
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Activity size={14} />
            Completions
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-2xl font-semibold">
              {totalDone}
            </div>

            <DeltaPill />
          </div>

          <div className="text-xs text-muted mt-0.5">
            vs last week
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <TrendingUp size={14} />
            Completion rate
          </div>

          <div className="text-2xl font-semibold mt-1">
            {completionRate}%
          </div>

          <div className="text-xs text-muted mt-0.5">
            {totalDone}/{totalSlots} slots
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <CalendarRange size={14} />
            Best day
          </div>

          <div className="text-2xl font-semibold mt-1">
            {bestDay?.count
              ? bestDay.label
              : "—"}
          </div>

          <div className="text-xs text-muted mt-0.5">
            {bestDay?.count
              ? `${bestDay.count} completion${
                  bestDay.count === 1
                    ? ""
                    : "s"
                }`
              : "no data"}
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Trophy size={14} />
            Top habit
          </div>

          <div className="mt-1 truncate flex items-center gap-1.5">
            {topHabit?.done ? (
              <>
                <span className="text-xl">
                  {topHabit.habit.icon}
                </span>

                <span className="font-medium truncate">
                  {topHabit.habit.name}
                </span>
              </>
            ) : (
              <span className="font-medium">
                —
              </span>
            )}
          </div>

          <div className="text-xs text-muted mt-0.5">
            {topHabit?.done
              ? `${topHabit.done}/${topHabit.target} this week`
              : "no completions"}
          </div>
        </div>

      </div>

      {/* CHARTS */}
      <div className="grid lg:grid-cols-2 gap-5">

        <div className="card p-5">
          <div className="text-sm font-medium mb-3">
            Completions by day
          </div>

          <div
            style={{
              width: "100%",
              height: 240,
            }}
          >
            <ResponsiveContainer>
              <BarChart data={dailyData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={grid}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 12,
                    fill: tick,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 12,
                    fill: tick,
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={
                    tooltipStyle
                  }
                />

                <Bar
                  dataKey="count"
                  fill="#f59e0b"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="text-sm font-medium mb-3">
            This week vs last week
          </div>

          <div
            style={{
              width: "100%",
              height: 240,
            }}
          >
            <ResponsiveContainer>
              <BarChart data={compareData}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={grid}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 12,
                    fill: tick,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 12,
                    fill: tick,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={
                    tooltipStyle
                  }
                />

                <Legend />

                <Bar
                  dataKey="Last week"
                  fill="#cbd5e1"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                />

                <Bar
                  dataKey="This week"
                  fill="#f59e0b"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* CATEGORY + HABIT PERFORMANCE */}
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">

        <div className="card p-5">
          <div className="text-sm font-medium mb-3">
            By category
          </div>

          {!categoryData.length ? (
            <div className="text-sm text-muted py-10 text-center">
              No completions yet this week.
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: 240,
              }}
            >
              <ResponsiveContainer>
                <PieChart>

                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {categoryData.map(
                      (_, index) => (
                        <Cell
                          key={index}
                          fill={
                            PIE_COLORS[
                              index %
                                PIE_COLORS.length
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    contentStyle={
                      tooltipStyle
                    }
                  />

                  <Legend />

                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5">

          <div className="flex items-center justify-between mb-3">

            <div className="text-sm font-medium">
              Habit performance
            </div>

            <div className="text-xs text-muted">
              vs target this week
            </div>

          </div>

          {!perHabit.length ? (
            <div className="text-sm text-muted py-10 text-center">
              No habits yet.
            </div>
          ) : (
            <div className="space-y-3">

              {perHabit.map(
                ({
                  habit,
                  done,
                  target,
                  pct,
                }) => (
                  <div
                    key={habit._id}
                  >

                    <div className="flex items-center justify-between text-sm mb-1">

                      <div className="flex items-center gap-2 min-w-0">

                        <span className="text-lg shrink-0">
                          {habit.icon}
                        </span>

                        <span className="truncate">
                          {habit.name}
                        </span>

                      </div>

                      <span className="text-muted text-xs">
                        {done}/{target} · {pct}%
                      </span>

                    </div>

                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{
                        background:
                          "var(--chip-bg)",
                      }}
                    >

                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background:
                            habit.color ||
                            "#6366f1",
                        }}
                      />

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>

      {/* STREAKS */}
      {habits.length > 0 && (
        <div className="card p-5">

          <div className="flex items-center justify-between mb-3">

            <div className="text-sm font-medium">
              Active streaks
            </div>

            <div className="text-xs text-muted">
              {activeStreaks} of{" "}
              {habits.length}
            </div>

          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">

            {habits.map((habit) => {
              const current =
                statsByHabit[
                  habit._id
                ]?.currentStreak || 0;

              return (
                <div
                  key={habit._id}
                  className="rounded-xl glass p-3 flex items-center gap-3"
                >

                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{
                      background: `${
                        habit.color ||
                        "#6366f1"
                      }26`,

                      color:
                        habit.color ||
                        "#6366f1",
                    }}
                  >
                    {habit.icon ||
                      "🎯"}
                  </span>

                  <div className="min-w-0 flex-1">

                    <div className="text-sm truncate">
                      {habit.name}
                    </div>

                    <div
                      className={`text-xs font-medium ${
                        current > 0
                          ? "text-orange-500"
                          : "text-faint"
                      }`}
                    >
                      🔥 {current} day
                      {current === 1
                        ? ""
                        : "s"}
                    </div>

                  </div>

                </div>
              );
            })}

          </div>

        </div>
      )}

    </div>
  );
}
