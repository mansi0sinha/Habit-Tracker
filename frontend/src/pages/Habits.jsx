import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Flame,
  Trophy,
  Sparkles,
} from "lucide-react";

import api from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import HabitForm from "../components/HabitForm.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { CATEGORIES } from "../utils/constants.js";

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [statsByHabit, setStatsByHabit] = useState({});
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  // =========================
  // LOAD HABITS + STATS
  // =========================
  const load = async () => {
    setLoading(true);

    try {
      const habitsRes = await api.get("/habits");

      const habitList = habitsRes.data.habits || [];

      setHabits(habitList);

      // Get streak stats for every habit
      const statsEntries = await Promise.all(
        habitList.map(async (habit) => {
          try {
            const res = await api.get(`/habits/${habit._id}/stats`);

            return [
              habit._id,
              {
                currentStreak: res.data.currentStreak || 0,
                longestStreak: res.data.longestStreak || 0,
              },
            ];
          } catch (error) {
            console.error(
              `Failed to load stats for ${habit.name}`,
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
        })
      );

      setStatsByHabit(Object.fromEntries(statsEntries));
    } catch (error) {
      console.error("Failed to load habits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // =========================
  // FILTER HABITS
  // =========================
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return habits.filter((habit) => {
      if (
        category !== "All" &&
        habit.category !== category
      ) {
        return false;
      }

      if (
        q &&
        !habit.name.toLowerCase().includes(q)
      ) {
        return false;
      }

      return true;
    });
  }, [habits, query, category]);

  // =========================
  // SAVE HABIT
  // =========================
  const save = async (data) => {
    setSubmitting(true);

    try {
      if (editing) {
        await api.put(`/habits/${editing._id}`, data);
      } else {
        await api.post("/habits", data);
      }

      // Reload from backend so frontend always
      // has exactly what MongoDB contains.
      await load();

      setFormOpen(false);
      setEditing(null);
    } catch (error) {
      console.error("Failed to save habit:", error);

      alert(
        error.response?.data?.message ||
          "Failed to save habit"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // DELETE HABIT
  // =========================
  const remove = async (habit) => {
    try {
      await api.delete(`/habits/${habit._id}`);

      setHabits((current) =>
        current.filter(
          (h) => h._id !== habit._id
        )
      );

      setStatsByHabit((current) => {
        const copy = { ...current };
        delete copy[habit._id];
        return copy;
      });

      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete habit:", error);

      alert(
        error.response?.data?.message ||
          "Failed to delete habit"
      );
    }
  };


  if (loading) {
    return <LoadingSpinner full />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* =========================
          HEADER
      ========================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            All habits
          </h1>

          <p className="text-sm text-muted mt-0.5">
            Manage every habit you've created.
          </p>
        </div>

        <div className="flex items-center gap-2">
         

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
      </div>

      {/* =========================
          SEARCH + FILTER
      ========================= */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
            />

            <input
              className="input pl-9"
              placeholder="Search habits..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
            />
          </div>

          <select
  className="input md:w-52"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
>
  <option
    value="All"
    className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
  >
    All categories
  </option>

  {CATEGORIES.map((c) => (
    <option
      key={c}
      className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
    >
      {c}
    </option>
  ))}
</select>
        </div>
      </div>

      {/* =========================
          EMPTY STATE
      ========================= */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-5xl mb-3">
            🎯
          </div>

          <div className="font-medium">
            {habits.length === 0
              ? "No habits yet"
              : "No habits match your filter"}
          </div>

          <div className="text-sm text-muted mt-1">
            {habits.length === 0
              ? "Start small — something you can do every day."
              : "Try clearing your search or category filter."}
          </div>

          {habits.length === 0 && (
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
          )}
        </div>
      ) : (
        /* =========================
           HABIT LIST
        ========================= */
        <div className="space-y-2">
          {filtered.map((habit) => {
            const stats =
              statsByHabit[habit._id] || {
                currentStreak: 0,
                longestStreak: 0,
              };

            return (
              <div
                key={habit._id}
                className="card p-4 flex items-center gap-4"
              >
                {/* ICON */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: `${
                      habit.color || "#6366f1"
                    }26`,
                    color:
                      habit.color || "#6366f1",
                  }}
                >
                  {habit.icon || "🎯"}
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium truncate">
                      {habit.name}
                    </div>

                    {habit.category && (
                      <span className="chip">
                        {habit.category}
                      </span>
                    )}

                    {habit.frequency && (
                      <span className="chip">
                        {habit.frequency}
                      </span>
                    )}
                  </div>

                  {habit.description && (
                    <div className="text-sm text-muted truncate mt-0.5">
                      {habit.description}
                    </div>
                  )}
                </div>

                {/* STATS */}
                <div className="hidden sm:flex items-center gap-4 text-sm">
                  <div
                    className="flex items-center gap-1"
                    title="Current streak"
                  >
                    <Flame
                      size={14}
                      className={
                        stats.currentStreak > 0
                          ? "text-orange-500"
                          : "text-faint"
                      }
                    />

                    <span className="font-medium">
                      {stats.currentStreak}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1"
                    title="Longest streak"
                  >
                    <Trophy
                      size={14}
                      className="text-amber-500"
                    />

                    <span className="font-medium">
                      {stats.longestStreak}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-1">
                  <button
                    className="btn-ghost p-2"
                    onClick={() => {
                      setEditing(habit);
                      setFormOpen(true);
                    }}
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="btn-ghost p-2 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
                    onClick={() =>
                      setDeleteTarget(habit)
                    }
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================
          CREATE / EDIT MODAL
      ========================= */}
      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={
          editing ? "Edit habit" : "New habit"
        }
      >
        <HabitForm
          initial={editing}
          submitting={submitting}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={save}
        />
      </Modal>

      {/* =========================
          DELETE MODAL
      ========================= */}
      <Modal
        open={!!deleteTarget}
        onClose={() =>
          setDeleteTarget(null)
        }
        title="Delete habit?"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-soft">
          This will permanently delete{" "}
          <b>{deleteTarget?.name}</b> and all
          its history. This can't be undone.
        </p>

        <div className="flex justify-end gap-2 mt-5">
          <button
            className="btn-secondary"
            onClick={() =>
              setDeleteTarget(null)
            }
          >
            Cancel
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-rose-500 to-red-600 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 shadow-lg shadow-rose-500/30 transition"
            onClick={() =>
              remove(deleteTarget)
            }
          >
            Delete
          </button>
        </div>
      </Modal>

     
    </div>
  );
}