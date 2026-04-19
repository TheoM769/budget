import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../utils/theme.js';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export default function DateRangePicker({
  focused,
  startDate,
  endDate,
  minDate,
  maxDate,
  onSelect,
  onClose,
}) {
  const [viewDate, setViewDate] = useState(() => endDate || startDate || new Date());
  const [cursor, setCursor] = useState(() => endDate || startDate || new Date());
  const [step, setStep] = useState(0); // 0=pick start, 1=pick end
  const [tempStart, setTempStart] = useState(startDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString('default', { month: 'short', year: 'numeric' });
  const totalDays = daysInMonth(year, month);
  const firstDow = new Date(year, month, 1).getDay();

  const cells = useMemo(() => {
    const grid = [];
    // Leading blanks
    for (let i = 0; i < firstDow; i++) grid.push(null);
    for (let d = 1; d <= totalDays; d++) grid.push(new Date(year, month, d));
    // Trailing blanks to fill 42
    while (grid.length < 42) grid.push(null);
    return grid;
  }, [year, month, firstDow, totalDays]);

  useInput((input, key) => {
    if (!focused) return;

    if (key.leftArrow) setCursor((c) => addDays(c, -1));
    if (key.rightArrow) setCursor((c) => addDays(c, 1));
    if (key.upArrow) setCursor((c) => addDays(c, -7));
    if (key.downArrow) setCursor((c) => addDays(c, 7));

    if (input === '[') {
      setViewDate(new Date(year, month - 1, 1));
      setCursor(new Date(year, month - 1, 1));
    }
    if (input === ']') {
      setViewDate(new Date(year, month + 1, 1));
      setCursor(new Date(year, month + 1, 1));
    }

    if (input === 'm') {
      const s = new Date(year, month, 1);
      const e = new Date(year, month, totalDays);
      onSelect(s, e);
    }

    if (input === 'r') {
      setStep(0);
      setTempStart(null);
      onSelect(null, null);
    }

    if (key.return) {
      if (step === 0) {
        setTempStart(cursor);
        setStep(1);
      } else {
        const s = tempStart < cursor ? tempStart : cursor;
        const e = tempStart < cursor ? cursor : tempStart;
        onSelect(s, e);
        setStep(0);
      }
    }

    if (key.escape) {
      onClose();
    }
  });

  const cursorKey = dateKey(cursor);
  const startKey = tempStart ? dateKey(tempStart) : startDate ? dateKey(startDate) : null;
  const endKey = endDate ? dateKey(endDate) : null;

  const isInRange = (d) => {
    if (!d) return false;
    if (step === 1 && tempStart) {
      const a = tempStart < cursor ? tempStart : cursor;
      const b = tempStart < cursor ? cursor : tempStart;
      return d >= a && d <= b;
    }
    if (startDate && endDate) {
      return d >= startDate && d <= endDate;
    }
    return false;
  };

  const isBlocked = (d) => {
    if (!d) return false;
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? theme.primary : theme.textMuted}
      paddingX={1}
      width={26}
    >
      <Box justifyContent="center">
        <Text bold color={theme.text}>
          {'<<<  '}{monthName}{'  >>>'}
        </Text>
      </Box>

      {/* Day headers */}
      <Box>
        {DAYS.map((d, i) => (
          <Box key={i} width={3} justifyContent="center">
            <Text color={theme.textMuted}>{d}</Text>
          </Box>
        ))}
      </Box>

      {/* Calendar grid */}
      {Array.from({ length: 6 }, (_, week) => (
        <Box key={week}>
          {cells.slice(week * 7, week * 7 + 7).map((cell, i) => {
            if (!cell) {
              return <Box key={i} width={3}><Text> </Text></Box>;
            }
            const dk = dateKey(cell);
            const isCursor = dk === cursorKey;
            const isEndpoint = dk === startKey || dk === endKey;
            const inRange = isInRange(cell);
            const blocked = isBlocked(cell);

            let color = theme.text;
            let bgColor;
            let bold = false;

            if (isCursor) bgColor = theme.primary;
            if (isEndpoint) { bgColor = theme.warning; bold = true; }
            if (inRange && !isCursor && !isEndpoint) { color = theme.warning; }
            if (blocked) color = theme.textMuted;

            const day = String(cell.getDate()).padStart(2, ' ');

            return (
              <Box key={i} width={3} justifyContent="center">
                <Text
                  color={color}
                  backgroundColor={bgColor}
                  bold={bold}
                  strikethrough={blocked}
                >
                  {day}
                </Text>
              </Box>
            );
          })}
        </Box>
      ))}

      {/* Hints */}
      <Text color={theme.textMuted}>
        {'← ↵:pick  r:reset  →'}
      </Text>
      <Text color={theme.textMuted}>
        {'  []:month  esc:done'}
      </Text>
    </Box>
  );
}
