
import { format, subDays } from "date-fns";

// ========================================
// Get YYYY-MM-DD for a date in a timezone
// ========================================
export const toKey = (date, timezone) => {
  if (!timezone) {
    return format(date, "yyyy-MM-dd");
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

// ========================================
// Get today's date in user's timezone
// ========================================
export const todayKey = (timezone) => {
  return toKey(new Date(), timezone);
};

// ========================================
// Convert YYYY-MM-DD into parts
// ========================================
const parseKey = (key) => {
  const [year, month, day] = key.split("-").map(Number);

  return {
    year,
    month,
    day,
  };
};

// ========================================
// Add/subtract days from YYYY-MM-DD
// ========================================
export const addDaysToKey = (key, amount) => {
  const { year, month, day } = parseKey(key);

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().slice(0, 10);
};

// ========================================
// Last 7 days
// ========================================
export const last7Days = (timezone) => {
  const today = todayKey(timezone);

  return Array.from({ length: 7 }, (_, index) => {
    const key = addDaysToKey(today, index - 6);

    const { year, month, day } = parseKey(key);

    // UTC is intentional here because this Date is only
    // being used to generate display information.
    const date = new Date(Date.UTC(year, month - 1, day));

    return {
      key,
      label: format(date, "EEE"),
      short: format(date, "d"),
      date,
    };
  });
};

// ========================================
// Last 90 days
// ========================================
export const last90Days = (timezone) => {
  const today = todayKey(timezone);

  return Array.from({ length: 90 }, (_, index) =>
    addDaysToKey(today, index - 89)
  );
};

// ========================================
// Get Monday of the week containing key
// ========================================
const startOfWeekKey = (key) => {
  const { year, month, day } = parseKey(key);

  const date = new Date(Date.UTC(year, month - 1, day));

  const dayOfWeek = date.getUTCDay();

  // Monday = 1, Sunday = 0
  const difference = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  date.setUTCDate(date.getUTCDate() + difference);

  return date.toISOString().slice(0, 10);
};

// ========================================
// Get Monday-Sunday week
// ========================================
export const weekKeysForKey = (key) => {
  const monday = startOfWeekKey(key);

  return Array.from({ length: 7 }, (_, index) => {
    const currentKey = addDaysToKey(monday, index);

    const { year, month, day } = parseKey(currentKey);

    const date = new Date(Date.UTC(year, month - 1, day));

    return {
      key: currentKey,
      label: format(date, "EEE"),
      short: format(date, "d"),
      date,
    };
  });
};

// ========================================
// Current week
// ========================================
export const weekKeys = (timezone) => {
  return weekKeysForKey(todayKey(timezone));
};

// ========================================
// Week containing a JavaScript Date
// ========================================
export const weekKeysFor = (date, timezone) => {
  return weekKeysForKey(toKey(date, timezone));
};

// ========================================
// Pretty date
// ========================================
export const prettyDate = (date) => {
  if (date instanceof Date) {
    return format(date, "MMM d, yyyy");
  }

  const { year, month, day } = parseKey(date);

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return format(utcDate, "MMM d, yyyy");
};

// ========================================
// Calculate streaks from YYYY-MM-DD keys
// ========================================
//
// STRICT RULE:
//
// If today's date is not checked in,
// current streak = 0.
//
// Example:
//
// Sep 8 ✅
// Sep 9 ✅
// Sep 10 ✅
//
// current = 3
//
// Sep 8 ✅
// Sep 9 ✅
// Sep 10 ❌
//
// current = 0
// ========================================
export const streakFromKeys = (keys, timezone) => {
  if (!keys?.length) {
    return {
      current: 0,
      longest: 0,
    };
  }

  const uniqueKeys = [...new Set(keys)].sort();

  // -------------------------
  // Longest streak
  // -------------------------
  let longest = 1;
  let run = 1;

  for (let i = 1; i < uniqueKeys.length; i++) {
    const expectedNext = addDaysToKey(uniqueKeys[i - 1], 1);

    if (uniqueKeys[i] === expectedNext) {
      run += 1;
    } else {
      run = 1;
    }

    longest = Math.max(longest, run);
  }

  // -------------------------
  // Current streak
  // -------------------------
  const today = todayKey(timezone);

  // STRICT:
  // Today must be completed.
  if (!uniqueKeys.includes(today)) {
    return {
      current: 0,
      longest,
    };
  }

  let current = 1;
  let cursor = today;

  while (true) {
    const previous = addDaysToKey(cursor, -1);

    if (!uniqueKeys.includes(previous)) {
      break;
    }

    current += 1;
    cursor = previous;
  }

  return {
    current,
    longest,
  };
};

