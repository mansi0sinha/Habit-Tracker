import { useMemo } from "react";
import { format, parseISO } from "date-fns";

const levelColor = (count, max) => {
  if (!count) return "var(--heat-0)";

  const ratio = count / Math.max(1, max);

  if (ratio < 0.25) return "var(--heat-1)";
  if (ratio < 0.5) return "var(--heat-2)";
  if (ratio < 0.85) return "var(--heat-3)";

  return "var(--heat-4)";
};

export default function HeatmapChart({ data = [] }) {
  const { cols, max } = useMemo(() => {
    if (!data.length) {
      return {
        cols: [],
        max: 0,
      };
    }

    const max = Math.max(
      ...data.map((d) => d.count)
    );

    const cols = [];
    let col = [];

    data.forEach((d, i) => {
      // Use parseISO instead of new Date("YYYY-MM-DD")
      const dow = parseISO(d.date).getDay();

      // Convert Sunday-first (0) to Monday-first (0)
      const shifted = (dow + 6) % 7;

      if (i === 0) {
        for (let j = 0; j < shifted; j++) {
          col.push(null);
        }
      }

      col.push(d);

      if (shifted === 6) {
        cols.push(col);
        col = [];
      }
    });

    if (col.length) {
      while (col.length < 7) {
        col.push(null);
      }

      cols.push(col);
    }

    return {
      cols,
      max,
    };
  }, [data]);

  // Total number of completed check-ins
  const totalCount = useMemo(() => {
    return data.reduce(
      (sum, day) => sum + day.count,
      0
    );
  }, [data]);

  // Number of days where at least one habit was completed
  const activeDays = useMemo(() => {
    return data.filter(
      (day) => day.count > 0
    ).length;
  }, [data]);

  // Consistency based on how many of the
  // last 90 calendar days had at least one completion.
  const consistency = data.length
    ? Math.round(
        (activeDays / data.length) * 100
      )
    : 0;

  return (
    <div className="card p-5">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <div className="text-sm font-medium">
            Consistency
          </div>

          <div className="text-xs text-muted mt-0.5">
            Your activity over the last 90 days
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-semibold">
              {consistency}%
            </div>

            <div className="text-xs text-muted">
              consistency
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>Less</span>

            {[0, 0.2, 0.5, 0.8, 1].map(
              (ratio, i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{
                    background: levelColor(
                      ratio * (max || 1),
                      max || 1
                    ),
                  }}
                />
              )
            )}

            <span>More</span>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-xs text-muted">
        <span>
          <strong className="text-soft">
            {totalCount}
          </strong>{" "}
          completions
        </span>

        <span>
          <strong className="text-soft">
            {activeDays}
          </strong>{" "}
          active days
        </span>

        <span>
          <strong className="text-soft">
            {data.length}
          </strong>{" "}
          days tracked
        </span>
      </div>

      {/* HEATMAP */}
      {data.length === 0 ? (
        <div className="text-sm text-muted py-6 text-center">
          No activity yet. Start checking in to build
          your consistency.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {cols.map((col, ci) => (
              <div
                key={ci}
                className="flex flex-col gap-1"
              >
                {col.map((d, ri) =>
                  d ? (
                    <div
                      key={ri}
                      className="w-3.5 h-3.5 rounded-sm transition-colors"
                      style={{
                        background: levelColor(
                          d.count,
                          max
                        ),
                      }}
                      title={`${format(
                        parseISO(d.date),
                        "MMM d, yyyy"
                      )} — ${
                        d.count
                      } completion${
                        d.count === 1
                          ? ""
                          : "s"
                      }`}
                    />
                  ) : (
                    <div
                      key={ri}
                      className="w-3.5 h-3.5"
                    />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}