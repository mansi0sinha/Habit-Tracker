import { useState } from "react";
import {
  Sparkles,
  Brain,
  Trophy,
  Target,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import api from "../api/axios.js";

function cleanText(text) {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/---/g, "")
    .replace(/###/g, "")
    .trim();
}

function extractSection(message, start, endMarkers = []) {
  const startIndex = message.indexOf(start);

  if (startIndex === -1) return "";

  let content = message.slice(startIndex + start.length);

  for (const marker of endMarkers) {
    const index = content.indexOf(marker);

    if (index !== -1) {
      content = content.slice(0, index);
    }
  }

  return cleanText(content);
}

export default function AICoach() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeHabits = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.post("/ai/coach");

      setMessage(res.data.message);
    } catch (error) {
      console.error("AI Coach error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to generate your AI analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  const overall = extractSection(
    message,
    "Overall Performance Summary",
    ["Strongest Habit"]
  );

  const strongest = extractSection(
    message,
    "Strongest Habit",
    ["Habit That Needs the Most Attention"]
  );

  const attention = extractSection(
    message,
    "Habit That Needs the Most Attention",
    ["Practical Suggestions", "Suggestions for Improvement"]
  );

  const suggestions = extractSection(
    message,
    "Practical Suggestions for Improvement",
    []
  ) || extractSection(
    message,
    "Suggestions for Improvement",
    []
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Sparkles size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              AI Habit Coach
            </h1>

            <p className="text-sm text-soft mt-1">
              Personalized insights based on your habit activity
            </p>
          </div>
        </div>

        {message && (
          <button
            onClick={analyzeHabits}
            disabled={loading}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        )}
      </div>

      {/* Initial state */}
      {!message && !loading && !error && (
        <div className="glass rounded-3xl p-10 text-center">

          <div className="mx-auto w-20 h-20 rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-300 flex items-center justify-center mb-6">
            <Brain size={36} />
          </div>

          <h2 className="text-xl font-semibold mb-2">
            Ready to analyze your habits?
          </h2>

          <p className="text-sm text-soft max-w-lg mx-auto mb-7">
            Your AI coach will analyze your habits and check-ins to give you
            personalized feedback, identify areas for improvement, and suggest
            practical ways to build better routines.
          </p>

          <button
            onClick={analyzeHabits}
            className="btn-primary inline-flex items-center gap-2 px-5 py-3"
          >
            <Sparkles size={17} />
            Analyze My Habits
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="glass rounded-3xl p-12 text-center">

          <div className="mx-auto w-12 h-12 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin mb-5" />

          <h2 className="text-lg font-semibold">
            Your AI coach is thinking...
          </h2>

          <p className="text-sm text-soft mt-2">
            Analyzing your habit activity
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass rounded-2xl p-5 border border-red-500/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {/* AI Results */}
      {message && !loading && (
        <div className="space-y-4">

          {/* Overall */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                📊
              </div>

              <div>
                <h2 className="font-semibold">
                  Overall Performance
                </h2>

                <p className="text-xs text-faint">
                  Your current habit activity
                </p>
              </div>
            </div>

            <p className="text-sm leading-7 text-soft">
              {overall}
            </p>
          </div>

          {/* Strongest */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-300 flex items-center justify-center">
                <Trophy size={20} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Strongest Habit
                </h2>

                <p className="text-xs text-faint">
                  Where you're doing well
                </p>
              </div>
            </div>

            <p className="text-sm leading-7 text-soft">
              {strongest}
            </p>
          </div>

          {/* Attention */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-300 flex items-center justify-center">
                <Target size={20} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Needs Attention
                </h2>

                <p className="text-xs text-faint">
                  An area worth focusing on
                </p>
              </div>
            </div>

            <p className="text-sm leading-7 text-soft">
              {attention}
            </p>
          </div>

          {/* Suggestions */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-600 dark:text-green-300 flex items-center justify-center">
                <Lightbulb size={20} />
              </div>

              <div>
                <h2 className="font-semibold">
                  Practical Suggestions
                </h2>

                <p className="text-xs text-faint">
                  Small actions you can take
                </p>
              </div>
            </div>

            <div className="text-sm leading-7 text-soft whitespace-pre-line">
              {suggestions}
            </div>
          </div>

          {/* Bottom encouragement */}
          <div className="rounded-2xl p-5 bg-linear-to-r from-brand-500/10 to-brand-700/5 ring-1 ring-brand-500/10">
            <div className="flex items-center gap-3">
              <Sparkles
                size={18}
                className="text-brand-600 dark:text-brand-300"
              />

              <p className="text-sm font-medium">
                Keep going — consistency is what turns small actions into
                lasting habits.
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}