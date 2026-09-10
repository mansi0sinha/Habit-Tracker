import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import api from "../api/axios.js";

import Modal from "../components/Modal.jsx";
import HabitForm from "../components/HabitForm.jsx";
import TodayHabitCard from "../components/TodayHabitCard.jsx";
import WeeklyGrid from "../components/WeeklyGrid.jsx";
import HeatmapChart from "../components/HeatmapChart.jsx";
import SummaryCards from "../components/SummaryCards.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

import { celebrate, celebrateBig } from "../utils/confetti.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();

  const [habits, setHabits] = useState([]);
  const [checkIns, setCheckIns] = useState([]);

  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  // ==========================================
  // LOAD HABITS + CHECK-INS
  // ==========================================
  const loadAll = async () => {
    setLoading(true);

    try {
      const [habitsRes, checkInsRes] = await Promise.all([
        api.get("/habits"),
        api.get("/habits/checkins"),
      ]);

      setHabits(habitsRes.data.habits || []);
      setCheckIns(checkInsRes.data.checkIns || []);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ==========================================
  // TODAY'S DATE
  // ==========================================
  const today = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone:
        user?.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }, [user]);

  // ==========================================
  // TODAY'S COMPLETED HABITS
  // ==========================================
  const completedToday = useMemo(() => {
    return new Set(
      checkIns
        .filter((checkIn) => checkIn.localDate === today)
        .map((checkIn) => String(checkIn.habit))
    );
  }, [checkIns, today]);

  // ==========================================
  // CHECK-INS GROUPED BY HABIT
  // ==========================================
  const checkInsByHabit = useMemo(() => {
    const result = {};

    for (const habit of habits) {
      result[String(habit._id)] = [];
    }

    for (const checkIn of checkIns) {
      const habitId = String(checkIn.habit);

      if (!result[habitId]) {
        result[habitId] = [];
      }

      result[habitId].push(checkIn.localDate);
    }

    for (const habitId of Object.keys(result)) {
      result[habitId] = [
        ...new Set(result[habitId]),
      ].sort();
    }

    return result;
  }, [habits, checkIns]);

  // ==========================================
  // CALCULATE STREAKS
  // ==========================================
  const calculateStreaks = (dates) => {
    if (!dates.length) {
      return {
        current: 0,
        longest: 0,
      };
    }

    const sortedDates = [
      ...new Set(dates),
    ].sort();

    // LONGEST STREAK
    let longest = 1;
    let currentRun = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const previous =
        new Date(
          `${sortedDates[i - 1]}T00:00:00`
        );

      const current =
        new Date(
          `${sortedDates[i]}T00:00:00`
        );

      const difference =
        (current - previous) /
        (1000 * 60 * 60 * 24);

      if (difference === 1) {
        currentRun++;

        longest = Math.max(
          longest,
          currentRun
        );
      } else {
        currentRun = 1;
      }
    }

    // CURRENT STREAK
    let current = 0;

    const dateSet = new Set(sortedDates);

    let cursor =
      new Date(`${today}T00:00:00`);

    while (true) {
      const key =
        cursor.toISOString().slice(0, 10);

      if (!dateSet.has(key)) {
        break;
      }

      current++;

      cursor.setDate(
        cursor.getDate() - 1
      );
    }

    return {
      current,
      longest,
    };
  };

  const streaksById = useMemo(() => {
    const result = {};

    for (const habit of habits) {
      result[habit._id] =
        calculateStreaks(
          checkInsByHabit[habit._id] || []
        );
    }

    return result;
  }, [
    habits,
    checkInsByHabit,
    today,
  ]);

  // ==========================================
  // TODAY PROGRESS
  // ==========================================
  const todayProgress = habits.length
    ? Math.round(
      (completedToday.size /
        habits.length) *
      100
    )
    : 0;

  // ==========================================
  // SUMMARY VALUES
  // ==========================================
  const activeStreaks =
    Object.values(streaksById).filter(
      (streak) =>
        streak.current > 0
    ).length;

  const bestStreak = Math.max(
    0,
    ...Object.values(
      streaksById
    ).map(
      (streak) =>
        streak.longest
    )
  );

  // ==========================================
  // WEEK DATES
  // ==========================================
  const weekDates = useMemo(() => {
    const dates = [];

    const current =
      new Date(`${today}T00:00:00`);

    const day =
      current.getDay();

    const difference =
      day === 0
        ? -6
        : 1 - day;

    current.setDate(
      current.getDate() +
      difference
    );

    for (let i = 0; i < 7; i++) {
      dates.push(
        current
          .toISOString()
          .slice(0, 10)
      );

      current.setDate(
        current.getDate() + 1
      );
    }

    return dates;
  }, [today]);

  // ==========================================
  // WEEKLY LOGS BY HABIT
  // ==========================================
  const weekLogsByHabit =
    useMemo(() => {
      const result = {};

      for (const habit of habits) {
        result[habit._id] = (
          checkInsByHabit[
          habit._id
          ] || []
        ).filter((date) =>
          weekDates.includes(date)
        );
      }

      return result;
    }, [
      habits,
      checkInsByHabit,
      weekDates,
    ]);

  const weekDone =
    Object.values(
      weekLogsByHabit
    ).reduce(
      (total, dates) =>
        total + dates.length,
      0
    );

  const weekTotal =
    habits.length * 7;

  const weekRate =
    weekTotal
      ? Math.round(
        (weekDone /
          weekTotal) *
        100
      )
      : 0;

  // ==========================================
  // 90-DAY HEATMAP
  // ==========================================

  const heatmap = useMemo(() => {
    const counts = {};

    for (const checkIn of checkIns) {
      const date = checkIn.localDate;
      counts[date] = (counts[date] || 0) + 1;
    }

    const result = [];

    const [year, month, day] = today.split("-").map(Number);

    const end = new Date(year, month - 1, day);
    const start = new Date(end);

    start.setDate(start.getDate() - 89);

    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");

      return `${y}-${m}-${d}`;
    };

    const cursor = new Date(start);

    while (cursor <= end) {
      const date = formatDate(cursor);

      result.push({
        date,
        count: counts[date] || 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [checkIns, today]);

  // ==========================================
  // CHECK-IN / UNCHECK
  // ==========================================
  const toggle = async (habit) => {
    const habitId =
      String(habit._id);

    const alreadyCompleted =
      completedToday.has(
        habitId
      );

    // Backend currently only supports
    // creating check-ins.
    // Unchecking will be added later.
    if (alreadyCompleted) {
      return;
    }

    try {
      const res =
        await api.post(
          `/habits/${habit._id}/checkin`,
          {
            date: today,
          }
        );

      const newCheckIn =
        res.data.checkIn;

      setCheckIns(
        (current) => [
          ...current,
          newCheckIn,
        ]
      );

      celebrate();

      if (
        completedToday.size + 1 ===
        habits.length &&
        habits.length > 0
      ) {
        setTimeout(() => {
          celebrateBig();
        }, 150);
      }
    } catch (error) {
      if (
        error.response?.status ===
        409
      ) {
        console.log(
          "Already checked in"
        );
      } else {
        console.error(
          "Failed to create check-in:",
          error
        );
      }
    }
  };

  // ==========================================
  // CREATE / EDIT HABIT
  // ==========================================
  const saveHabit = async (data) => {
    setSubmitting(true);

    try {
      if (editing) {
        // EDIT
        const res =
          await api.put(
            `/habits/${editing._id}`,
            data
          );

        const updatedHabit =
          res.data.habit;

        setHabits(
          (current) =>
            current.map(
              (habit) =>
                String(
                  habit._id
                ) ===
                  String(
                    editing._id
                  )
                  ? updatedHabit
                  : habit
            )
        );
      } else {
        // CREATE
        const res =
          await api.post(
            "/habits",
            data
          );

        const newHabit =
          res.data.habit;

        console.log(
          "NEW HABIT FROM BACKEND:",
          newHabit
        );

        setHabits(
          (current) => [
            ...current,
            newHabit,
          ]
        );

        setCheckIns(
          (current) =>
            current
        );
      }

      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      console.error(
        "Failed to save habit:",
        error
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // DELETE HABIT
  // ==========================================
  const deleteHabit = async (
    habit
  ) => {
    try {
      await api.delete(
        `/habits/${habit._id}`
      );

      setHabits(
        (current) =>
          current.filter(
            (h) =>
              String(h._id) !==
              String(
                habit._id
              )
          )
      );

      setCheckIns(
        (current) =>
          current.filter(
            (checkIn) =>
              String(
                checkIn.habit
              ) !==
              String(
                habit._id
              )
          )
      );

      setDeleteTarget(null);
    } catch (error) {
      console.error(
        "Failed to delete habit:",
        error
      );
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <LoadingSpinner full />
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="space-y-6 animate-fade-in">

      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Hey{" "}
            {user?.email
              ?.split("@")[0] ||
              "there"}{" "}
            👋
          </h1>

          <p className="text-sm text-muted mt-0.5">
            {new Date().toLocaleDateString(
              undefined,
              {
                weekday:
                  "long",
                month:
                  "long",
                day: "numeric",
              }
            )}
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={14} />
          New habit
        </button>
      </div>

      {/* SUMMARY */}
      <SummaryCards
        totalHabits={
          habits.length
        }
        activeStreaks={
          activeStreaks
        }
        bestStreak={
          bestStreak
        }
        weekRate={
          weekRate
        }
      />

      {/* TODAY'S HABITS */}
      <div className="card p-5">

        <div className="flex items-center justify-between mb-4">

          <div>
            <div className="text-sm font-medium">
              Today's habits
            </div>

            <div className="text-xs text-muted">
              {
                completedToday.size
              }{" "}
              of{" "}
              {
                habits.length
              }{" "}
              complete
            </div>
          </div>

          <div className="relative">

            <ProgressRing
              value={
                todayProgress
              }
              size={52}
              stroke={5}
            />

            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
              {
                todayProgress
              }%
            </div>

          </div>

        </div>

        {habits.length === 0 ? (

          <div className="text-center py-8">

            <div className="text-5xl mb-3">
              🎯
            </div>

            <div className="font-medium">
              Let's build your first habit
            </div>

            <div className="text-sm text-muted mt-1">
              Start small —
              something you can
              do in under 5
              minutes.
            </div>

            <button
              className="btn-primary mt-4"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={14} />
              Create habit
            </button>

          </div>

        ) : (

          <div className="space-y-2">

            {habits.map(
              (habit) => (
                <TodayHabitCard
                  key={
                    habit._id
                  }
                  habit={
                    habit
                  }
                  completed={completedToday.has(
                    String(
                      habit._id
                    )
                  )}
                  streak={
                    streaksById[
                      habit._id
                    ]?.current ||
                    0
                  }
                  onToggle={() =>
                    toggle(
                      habit
                    )
                  }
                  onEdit={() => {
                    setEditing(
                      habit
                    );
                    setFormOpen(
                      true
                    );
                  }}
                  onDelete={() =>
                    setDeleteTarget(
                      habit
                    )
                  }
                />
              )
            )}

          </div>

        )}

      </div>

      {/* WEEKLY GRID */}
      <WeeklyGrid
        habits={habits}
        logsByHabit={
          weekLogsByHabit
        }
      />

      {/* GITHUB STYLE HEATMAP */}
      <HeatmapChart
        data={heatmap}
      />

      {/* CREATE / EDIT MODAL */}
      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={
          editing
            ? "Edit habit"
            : "New habit"
        }
      >

        <HabitForm
          initial={editing}
          submitting={
            submitting
          }
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={
            saveHabit
          }
        />

      </Modal>

      {/* DELETE MODAL */}
      <Modal
        open={
          !!deleteTarget
        }
        onClose={() =>
          setDeleteTarget(
            null
          )
        }
        title="Delete habit?"
        maxWidth="max-w-sm"
      >

        <p className="text-sm text-soft">
          This will permanently
          delete{" "}
          <b>
            {
              deleteTarget?.name
            }
          </b>{" "}
          and all its
          history. This
          can't be undone.
        </p>

        <div className="flex justify-end gap-2 mt-5">

          <button
            className="btn-secondary"
            onClick={() =>
              setDeleteTarget(
                null
              )
            }
          >
            Cancel
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-rose-500 to-red-600 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 shadow-lg shadow-rose-500/30 transition"
            onClick={() =>
              deleteHabit(
                deleteTarget
              )
            }
          >
            Delete
          </button>

        </div>

      </Modal>

    </div>
  );
}
