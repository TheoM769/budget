import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { colors } from "../utils/theme.js";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function toDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toStr(d) {
  return (
    `${d.getFullYear()}-` +
    `${String(d.getMonth() + 1).padStart(2, "0")}-` +
    `${String(d.getDate()).padStart(2, "0")}`
  );
}

function addDays(str, n) {
  const d = toDate(str);
  d.setDate(d.getDate() + n);
  return toStr(d);
}

function shortLabel(str) {
  if (!str) return "?";
  const d = toDate(str);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/** Build a 6-week (42-cell) grid for the given year/month. Returns YYYY-MM-DD strings. */
function buildGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sun
  return Array.from({ length: 42 }, (_, i) =>
    toStr(new Date(year, month, 1 - firstDow + i))
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Props:
 *   minDate / maxDate  – "YYYY-MM-DD" | null  (transaction date bounds)
 *   initialFrom / initialTo  – current filter values (or null)
 *   onConfirm(from, to) – called with the confirmed date range strings
 *   onClose()           – called on Esc (no change)
 *   focused             – when false, captures no keyboard input; border dims
 */
export default function DateRangePicker({
  minDate,
  maxDate,
  initialFrom,
  initialTo,
  onConfirm,
  onClose,
  focused = true,
}) {
  const anchor =
    (initialFrom && (!minDate || initialFrom >= minDate) ? initialFrom : null) ||
    maxDate ||
    toStr(new Date());

  const anchorDate = toDate(anchor);

  const [viewYear, setViewYear] = useState(anchorDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(anchorDate.getMonth());
  const [cursor, setCursor] = useState(anchor);
  // "start" = picking the first endpoint; "end" = picking the second
  const [step, setStep] = useState("start");
  const [rangeFrom, setRangeFrom] = useState(initialFrom || null);
  const [rangeTo, setRangeTo] = useState(initialTo || null);

  const isBlocked = (str) =>
    (minDate != null && str < minDate) || (maxDate != null && str > maxDate);

  /** True when `str` falls strictly between the two endpoints. */
  const inRange = (str) => {
    const from = rangeFrom;
    const to = step === "end" ? cursor : rangeTo; // live-preview while step=end
    if (!from || !to) return false;
    const [a, b] = from <= to ? [from, to] : [to, from];
    return str > a && str < b;
  };

  const isEndpoint = (str) => {
    if (str === rangeFrom) return true;
    if (step === "end" && str === cursor) return true; // preview second endpoint
    if (step !== "end" && str === rangeTo) return true;
    return false;
  };

  const moveCursor = (delta) => {
    const next = addDays(cursor, delta);
    if (minDate && next < minDate) return;
    if (maxDate && next > maxDate) return;
    setCursor(next);
    const d = toDate(next);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goToMonth = (year, month) => {
    setViewYear(year);
    setViewMonth(month);
    // Keep same day-of-month, clamped to the new month length and to valid bounds
    const day = toDate(cursor).getDate();
    const maxDay = new Date(year, month + 1, 0).getDate();
    let next = toStr(new Date(year, month, Math.min(day, maxDay)));
    if (minDate && next < minDate) next = minDate;
    if (maxDate && next > maxDate) next = maxDate;
    setCursor(next);
  };

  useInput((ch, key) => {
    if (key.escape) {
      onClose && onClose();
      return;
    }

    if (key.return) {
      if (isBlocked(cursor)) return;
      if (step === "start") {
        setRangeFrom(cursor);
        setRangeTo(null);
        setStep("end");
      } else {
        let from = rangeFrom;
        let to = cursor;
        if (from > to) [from, to] = [to, from];
        onConfirm(from, to);
      }
      return;
    }

    if (key.leftArrow) { moveCursor(-1); return; }
    if (key.rightArrow) { moveCursor(1); return; }
    if (key.upArrow) { moveCursor(-7); return; }
    if (key.downArrow) { moveCursor(7); return; }

    if (ch === "[") {
      let m = viewMonth - 1, y = viewYear;
      if (m < 0) { m = 11; y--; }
      goToMonth(y, m);
      return;
    }
    if (ch === "]") {
      let m = viewMonth + 1, y = viewYear;
      if (m > 11) { m = 0; y++; }
      goToMonth(y, m);
      return;
    }

    // Quick-select the entire visible month
    if (ch === "m") {
      let from = toStr(new Date(viewYear, viewMonth, 1));
      let to = toStr(new Date(viewYear, viewMonth + 1, 0));
      if (minDate && from < minDate) from = minDate;
      if (maxDate && to > maxDate) to = maxDate;
      if (from <= to) onConfirm(from, to);
      return;
    }

    // Reset selection back to start
    if (ch === "r") {
      setRangeFrom(null);
      setRangeTo(null);
      setStep("start");
      return;
    }
  }, { isActive: focused });

  const grid = buildGrid(viewYear, viewMonth);
  const DOW = ["S", "M", "T", "W", "T", "F", "S"];

  // Header label: shows selected range (or month name while no selection)
  let headerLabel;
  if (step === "end" && rangeFrom) {
    const [a, b] = rangeFrom <= cursor ? [rangeFrom, cursor] : [cursor, rangeFrom];
    headerLabel = `${shortLabel(a)} - ${shortLabel(b)}`;
  } else if (rangeFrom && rangeTo) {
    const [a, b] = rangeFrom <= rangeTo ? [rangeFrom, rangeTo] : [rangeTo, rangeFrom];
    headerLabel = `${shortLabel(a)} - ${shortLabel(b)}`;
  } else {
    headerLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
  }

  const RANGE_BG = "#4a3000";
  const ENDPOINT_BG = colors.warning;
  const CURSOR_BG = colors.primary;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? colors.primary : colors.textMuted}
      paddingX={1}
      width={32}
    >
      {/* Title */}
      <Text bold color={focused ? colors.primary : colors.textMuted}>
        Period
      </Text>

      {/* Month nav + range label */}
      <Box justifyContent="space-between">
        <Text bold color={colors.textMuted}>
          {"<<<"}
        </Text>
        <Text color={colors.text}>{headerLabel}</Text>
        <Text bold color={colors.textMuted}>
          {">>>"}
        </Text>
      </Box>

      {/* Month/year subtitle while picking the second endpoint */}
      {step === "end" && (
        <Box justifyContent="center">
          <Text color={colors.textMuted}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
        </Box>
      )}

      {/* Day-of-week headers */}
      <Box marginTop={1}>
        {DOW.map((d, i) => (
          <Box key={i} width={4} justifyContent="center">
            <Text color={colors.textMuted}>{d}</Text>
          </Box>
        ))}
      </Box>

      {/* Calendar grid (6 rows × 7 days) */}
      {[0, 1, 2, 3, 4, 5].map((week) => (
        <Box key={week}>
          {grid.slice(week * 7, week * 7 + 7).map((dateStr, col) => {
            const d = toDate(dateStr);
            const isCurMonth = d.getMonth() === viewMonth;
            const blocked = isBlocked(dateStr);
            const isCursor = dateStr === cursor;
            const endpoint = isEndpoint(dateStr);
            const inRng = inRange(dateStr);

            let textColor, bg, strike, dim;

            if (blocked) {
              textColor = "#3d3d3d";
              strike = true;
              dim = true;
            } else if (isCursor && focused) {
              textColor = "#ffffff";
              bg = CURSOR_BG;
            } else if (endpoint) {
              textColor = "#ffffff";
              bg = ENDPOINT_BG;
            } else if (inRng) {
              textColor = colors.warning;
              bg = RANGE_BG;
            } else if (!isCurMonth) {
              textColor = "#484848";
            } else {
              textColor = colors.text;
            }

            return (
              <Box key={col} width={4} justifyContent="center">
                <Text
                  color={textColor}
                  backgroundColor={bg}
                  strikethrough={strike}
                  dimColor={dim}
                >
                  {String(d.getDate()).padStart(2)}
                </Text>
              </Box>
            );
          })}
        </Box>
      ))}

      {/* Footer */}
      <Box justifyContent="space-between" marginTop={1}>
        <Text color={colors.textMuted}>{"←"}</Text>
        <Text color={colors.textMuted}>
          {focused
            ? step === "start"
              ? "↵ pick start · m:month"
              : "↵ pick end · r:reset"
            : "d: focus"}
        </Text>
        <Text color={colors.textMuted}>{"→"}</Text>
      </Box>
      <Box justifyContent="center">
        <Text color={colors.textMuted}>[ ] months · esc:done</Text>
      </Box>
    </Box>
  );
}
