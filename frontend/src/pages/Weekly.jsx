import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import {
  format,
  addWeeks,
  isSameWeek,
} from "date-fns";

import api from "../api/axios.js";
import WeeklyGrid from "../components/WeeklyGrid.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { weekKeysFor } from "../utils/dateHelpers.js";

const getLocalDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export default function Weekly() {
  const [cursor, setCursor] = useState(new Date());
  const [habits, setHabits] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = useMemo(
    () => weekKeysFor(cursor),
    [cursor]
  );

  const isCurrentWeek = isSameWeek(
    cursor,
    new Date(),
    { weekStartsOn: 1 }
  );

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const start = days[0].key;
        const end = days[days.length - 1].key;

        const [habitsRes, checkInsRes] =
          await Promise.all([
            api.get("/habits"),

            api.get("/habits/checkins", {
              params: {
                start,
                end,
              },
            }),
          ]);

        const habitList =
          habitsRes.data.habits || [];

        const checkInList =
          checkInsRes.data.checkIns || [];

        setHabits(habitList);
        setCheckIns(checkInList);
       
      } catch (error) {
        console.error(
          "Failed to load weekly data:",
          error
        );

        setHabits([]);
        setCheckIns([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [days]);

  // =========================
  // CHECK-INS BY HABIT
  // =========================
  const logsByHabit = useMemo(() => {
    const out = {};

    for (const checkIn of checkIns) {
      const habitId = String(
        checkIn.habit
      );

      if (!out[habitId]) {
        out[habitId] = [];
      }

      out[habitId].push(
        checkIn.localDate
      );
    }

    return out;
  }, [checkIns]);

  // =========================
  // WEEK SUMMARY
  // =========================
  const totalSlots =
    habits.length * 7;

  const totalDone =
    checkIns.length;

  const weekRate = totalSlots
    ? Math.round(
      (totalDone / totalSlots) * 100
    )
    : 0;

  // =========================
  // DAY TOTALS
  // =========================
  const dayTotals = days.map((day) => ({
    ...day,

    count: checkIns.filter(
      (checkIn) =>
        checkIn.localDate === day.key
    ).length,
  }));

  const bestDay = [
    ...dayTotals,
  ].sort(
    (a, b) => b.count - a.count
  )[0];

  // =========================
  // PER-HABIT COMPLETIONS
  // =========================
  const perHabitDone = habits
    .map((habit) => ({
      habit,

      count: (
        logsByHabit[
        String(habit._id)
        ] || []
      ).length,
    }))
    .sort(
      (a, b) =>
        b.count - a.count
    );

  const topHabit =
    perHabitDone[0];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Weekly overview
          </h1>

          <p className="text-sm text-muted mt-0.5">
            See every habit across all 7 days at a glance.
          </p>
        </div>

        {/* WEEK NAVIGATION */}
        <div className="flex items-center gap-2">

          <button
            className="btn-secondary px-3"
            onClick={() =>
              setCursor((date) =>
                addWeeks(date, -1)
              )
            }
            aria-label="Previous week"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass text-sm font-medium">
            <CalendarDays
              size={14}
              className="text-muted"
            />

            {format(
              days[0].date,
              "MMM d"
            )}{" "}
            —{" "}
            {format(
              days[6].date,
              "MMM d, yyyy"
            )}
          </div>

          <button
            className="btn-secondary px-3"
            onClick={() =>
              setCursor((date) =>
                addWeeks(date, 1)
              )
            }
            disabled={isCurrentWeek}
            aria-label="Next week"
          >
            <ChevronRight size={16} />
          </button>

          {!isCurrentWeek && (
            <button
              className="btn-ghost"
              onClick={() =>
                setCursor(new Date())
              }
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* =========================
          LOADING
      ========================= */}
      {loading ? (
        <LoadingSpinner full />
      ) : (
        <>
          {/* =========================
              SUMMARY CARDS
          ========================= */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* WEEK RATE */}
            <div className="card p-4">
              <div className="text-xs text-muted font-medium">
                Week rate
              </div>

              <div className="text-2xl font-semibold mt-1">
                {weekRate}%
              </div>

              <div className="text-xs text-muted mt-0.5">
                {totalDone} of {totalSlots}
              </div>
            </div>

            {/* TOTAL COMPLETIONS */}
            <div className="card p-4">
              <div className="text-xs text-muted font-medium">
                Total completions
              </div>

              <div className="text-2xl font-semibold mt-1">
                {totalDone}
              </div>

              <div className="text-xs text-muted mt-0.5">
                this week
              </div>
            </div>

            {/* BEST DAY */}
            <div className="card p-4">
              <div className="text-xs text-muted font-medium">
                Best day
              </div>

              <div className="text-2xl font-semibold mt-1">
                {bestDay?.count
                  ? bestDay.label
                  : "—"}
              </div>

              <div className="text-xs text-muted mt-0.5">
                {bestDay?.count
                  ? `${bestDay.count} habits done`
                  : "no data"}
              </div>
            </div>

            {/* TOP HABIT */}
            <div className="card p-4">
              <div className="text-xs text-muted font-medium">
                Top habit
              </div>

              <div className="text-2xl font-semibold mt-1 truncate">

                {topHabit?.count ? (
                  <>
                    <span className="mr-1">
                      {topHabit.habit.icon ||
                        "🎯"}
                    </span>

                    <span className="text-base font-medium align-middle">
                      {topHabit.habit.name}
                    </span>
                  </>
                ) : (
                  "—"
                )}

              </div>

              <div className="text-xs text-muted mt-0.5">
                {topHabit?.count
                  ? `${topHabit.count}/7 days`
                  : "no data"}
              </div>
            </div>

          </div>

          {/* =========================
              NO HABITS
          ========================= */}
          {habits.length === 0 ? (
            <div className="card p-10 text-center">

              <div className="text-5xl mb-3">
                📅
              </div>

              <div className="font-medium">
                No habits yet
              </div>

              <div className="text-sm text-muted mt-1">
                Create a habit to start filling in your weekly grid.
              </div>

            </div>
          ) : (
            /* =========================
               WEEKLY GRID
            ========================= */
            <WeeklyGrid
              habits={habits}
              logsByHabit={logsByHabit}
              days={days}
            />
          )}
        </>
      )}
    </div>
  );
}