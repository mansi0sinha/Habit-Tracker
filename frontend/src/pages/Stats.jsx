import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Trophy,
  Flame,
  TrendingDown,
} from "lucide-react";

import api from "../api/axios.js";
import HabitStatsCard from "../components/HabitStatsCard.jsx";
import WeeklyBarChart from "../components/WeeklyBarChart.jsx";
import MonthlyBarChart from "../components/MonthlyBarChart.jsx";
import CategoryPieChart from "../components/CategoryPieChart.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  todayKey,
  addDaysToKey,
} from "../utils/dateHelpers.js";

export default function Stats() {
  const { user } = useAuth();

  const timezone =
    user?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [habits, setHabits] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [statsByHabit, setStatsByHabit] =
    useState({});
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const today = todayKey(timezone);

        const startDate = addDaysToKey(
          today,
          -89
        );

        const endDate = today;

        const [
          habitsRes,
          checkInsRes,
        ] = await Promise.all([
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

        // =========================
        // LOAD STATS FOR EACH HABIT
        // =========================
        const entries =
          await Promise.all(
            habitList.map(
              async (habit) => {
                try {
                  const res =
                    await api.get(
                      `/habits/${habit._id}/stats`
                    );

                  return [
                    habit._id,
                    {
                      currentStreak:
                        res.data
                          .currentStreak ||
                        0,

                      longestStreak:
                        res.data
                          .longestStreak ||
                        0,
                    },
                  ];
                } catch (error) {
                  console.error(
                    `Failed to load stats for ${habit.name}:`,
                    error
                  );

                  return [
                    habit._id,
                    {
                      currentStreak: 0,
                      longestStreak: 0,
                    },
                  ];
                }
              }
            )
          );

        setStatsByHabit(
          Object.fromEntries(
            entries
          )
        );
      } catch (error) {
        console.error(
          "Failed to load statistics:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [timezone]);

  // =========================
  // LAST 30 DAYS
  // =========================
  const monthly = useMemo(() => {
    const today =
      todayKey(timezone);

    return Array.from(
      { length: 30 },
      (_, index) => {
        const key =
          addDaysToKey(
            today,
            -29 + index
          );

        const date = new Date(
          `${key}T00:00:00Z`
        );

        const count =
          checkIns.filter(
            (checkIn) =>
              checkIn.localDate ===
              key
          ).length;

        return {
          label: format(
            date,
            "MMM d"
          ),
          count,
        };
      }
    );
  }, [checkIns, timezone]);

  // =========================
  // LAST 7 DAYS
  // =========================
  const weekly = useMemo(() => {
    const today =
      todayKey(timezone);

    return Array.from(
      { length: 7 },
      (_, index) => {
        const key =
          addDaysToKey(
            today,
            -6 + index
          );

        const date = new Date(
          `${key}T00:00:00Z`
        );

        const count =
          checkIns.filter(
            (checkIn) =>
              checkIn.localDate ===
              key
          ).length;

        return {
          label: format(
            date,
            "EEE"
          ),
          count,
        };
      }
    );
  }, [checkIns, timezone]);

  // =========================
  // CATEGORY DATA
  // =========================
  const categoryData =
    useMemo(() => {
      const categories = {};

      for (const habit of habits) {
        categories[
          String(habit._id)
        ] = habit.category;
      }

      const counts = {};

      for (const checkIn of checkIns) {
        const category =
          categories[
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
    }, [habits, checkIns]);

  // =========================
  // PER-HABIT STATS
  // =========================
  const perHabit = useMemo(() => {
    return habits.map(
      (habit) => {
        const completions30d =
          checkIns.filter(
            (checkIn) =>
              String(
                checkIn.habit
              ) ===
              String(habit._id)
          ).length;

        const streak =
          statsByHabit[
            habit._id
          ] || {};

        return {
          habitId: habit._id,

          name: habit.name,

          icon:
            habit.icon || "🎯",

          color:
            habit.color ||
            "#6366f1",

          category:
            habit.category ||
            "Other",

          currentStreak:
            streak.currentStreak ||
            0,

          longestStreak:
            streak.longestStreak ||
            0,

          completions30d,
        };
      }
    );
  }, [
    habits,
    checkIns,
    statsByHabit,
  ]);

  // =========================
  // TOP HABITS BY CURRENT STREAK
  // =========================
  const sortedByStreak = [
    ...perHabit,
  ].sort(
    (a, b) =>
      b.currentStreak -
      a.currentStreak
  );

  const best =
    sortedByStreak[0];

  // =========================
  // TOP HABITS BY COMPLETIONS
  // =========================
  const sortedByComp = [
    ...perHabit,
  ].sort(
    (a, b) =>
      b.completions30d -
      a.completions30d
  );

  // =========================
  // LONGEST STREAK
  // =========================
  const longestLongest = [
    ...perHabit,
  ].sort(
    (a, b) =>
      b.longestStreak -
      a.longestStreak
  )[0];

  // =========================
  // HABIT NEEDING ATTENTION
  // =========================
  const worst = [
    ...perHabit,
  ]
    .filter(
      (habit) =>
        habit.completions30d < 30
    )
    .sort(
      (a, b) =>
        a.completions30d -
        b.completions30d
    )[0];

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return <LoadingSpinner full />;
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* =========================
          HEADER
      ========================= */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Statistics
        </h1>

        <p className="text-sm text-muted mt-0.5">
          Deep insights from your habit data.
        </p>
      </div>

      {/* =========================
          EMPTY STATE
      ========================= */}
      {perHabit.length === 0 ? (
        <div className="card p-10 text-center">

          <div className="text-5xl mb-3">
            📊
          </div>

          <div className="font-medium">
            No data yet
          </div>

          <div className="text-sm text-muted mt-1">
            Create a habit and check it off a
            few times to unlock statistics.
          </div>

        </div>
      ) : (
        <>
          {/* =========================
              SUMMARY CARDS
          ========================= */}
          <div className="grid md:grid-cols-3 gap-4">

            {/* BEST STREAK */}
            {best && (
              <div className="card p-5">

                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">

                  <Flame
                    size={14}
                    className="text-orange-500"
                  />

                  Best streak
                </div>

                <div className="mt-2 flex items-center gap-3">

                  <span className="text-3xl">
                    {best.icon}
                  </span>

                  <div>

                    <div className="font-semibold">
                      {best.name}
                    </div>

                    <div className="text-sm text-muted">
                      {best.currentStreak} day
                      {best.currentStreak === 1
                        ? ""
                        : "s"}{" "}
                      running
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* LONGEST EVER */}
            {longestLongest && (
              <div className="card p-5">

                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">

                  <Trophy
                    size={14}
                    className="text-amber-500"
                  />

                  Longest ever
                </div>

                <div className="mt-2 flex items-center gap-3">

                  <span className="text-3xl">
                    {longestLongest.icon}
                  </span>

                  <div>

                    <div className="font-semibold">
                      {longestLongest.name}
                    </div>

                    <div className="text-sm text-muted">
                      {longestLongest.longestStreak}{" "}
                      day record
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* NEEDS ATTENTION */}
            {worst && (
              <div className="card p-5">

                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">

                  <TrendingDown
                    size={14}
                    className="text-rose-500"
                  />

                  Needs attention
                </div>

                <div className="mt-2 flex items-center gap-3">

                  <span className="text-3xl">
                    {worst.icon}
                  </span>

                  <div>

                    <div className="font-semibold">
                      {worst.name}
                    </div>

                    <div className="text-sm text-muted">
                      {worst.completions30d}
                      /30 in the last 30 days
                    </div>

                  </div>

                </div>

              </div>
            )}

          </div>

          {/* =========================
              CHARTS
          ========================= */}
          <div className="grid lg:grid-cols-2 gap-5">

            <WeeklyBarChart
              data={weekly}
              title="Completions — last 7 days"
            />

            <MonthlyBarChart
              data={monthly}
            />

          </div>

          {/* =========================
              CATEGORY + TOP HABITS
          ========================= */}
          <div className="grid lg:grid-cols-2 gap-5">

            {/* CATEGORY PIE */}
            <CategoryPieChart
              data={categoryData}
            />

            {/* TOP HABITS */}
            <div className="card p-5">

              <div className="text-sm font-medium mb-3">
                Top habits by completion
                (30d)
              </div>

              <div className="space-y-3">

                {sortedByComp
                  .slice(0, 5)
                  .map((habit) => {

                    const pct =
                      Math.min(
                        100,
                        Math.round(
                          (habit.completions30d /
                            30) *
                            100
                        )
                      );

                    return (
                      <div
                        key={
                          habit.habitId
                        }
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
                            {habit.completions30d}
                            /30 · {pct}%
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
                                habit.color,
                            }}
                          />

                        </div>

                      </div>
                    );
                  })}

              </div>

            </div>
          </div>

          {/* =========================
              ALL HABITS
          ========================= */}
          <div className="space-y-2">

            <div className="text-sm font-medium">
              All habits
            </div>

            {perHabit.map(
              (stat) => (
                <HabitStatsCard
                  key={
                    stat.habitId
                  }
                  stat={stat}
                />
              )
            )}

          </div>
        </>
      )}

    </div>
  );
}
