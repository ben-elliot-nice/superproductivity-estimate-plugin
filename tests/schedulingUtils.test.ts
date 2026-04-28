import { describe, expect, test } from 'vitest';
import {
  getDayChips,
  getTimestamp,
  formatScheduledDate,
  sameDay,
} from '../src/app/utils/schedulingUtils';

describe('getDayChips', () => {
  test('returns 7 chips', () => {
    expect(getDayChips()).toHaveLength(7);
  });

  test('first chip is Today', () => {
    expect(getDayChips()[0].label).toBe('Today');
  });

  test('second chip is Tomorrow', () => {
    expect(getDayChips()[1].label).toBe('Tomorrow');
  });

  test('remaining chips are day names', () => {
    const chips = getDayChips();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 2; i < 7; i++) {
      expect(dayNames).toContain(chips[i].label);
    }
  });

  test('chip dates are consecutive from today', () => {
    const chips = getDayChips();
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      expect(chips[i].date.getDate()).toBe(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + i).getDate()
      );
    }
  });
});

describe('getTimestamp', () => {
  test('returns correct unix ms for given date and hour', () => {
    const date = new Date(2026, 3, 22); // April 22 2026
    const ts = getTimestamp(date, 9);
    const result = new Date(ts);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(22);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  test('handles midnight (hour 0)', () => {
    const date = new Date(2026, 3, 22);
    const ts = getTimestamp(date, 0);
    expect(new Date(ts).getHours()).toBe(0);
  });
});

describe('formatScheduledDate', () => {
  test('formats Wednesday afternoon', () => {
    // April 22 2026 is a Wednesday
    const ts = new Date(2026, 3, 22, 15, 0, 0).getTime();
    expect(formatScheduledDate(ts)).toBe('Wed 15:00');
  });

  test('pads single-digit hours', () => {
    const ts = new Date(2026, 3, 22, 9, 0, 0).getTime();
    expect(formatScheduledDate(ts)).toBe('Wed 09:00');
  });
});

describe('sameDay', () => {
  test('returns true for same date', () => {
    const a = new Date(2026, 3, 22, 9, 0, 0);
    const b = new Date(2026, 3, 22, 15, 0, 0);
    expect(sameDay(a, b)).toBe(true);
  });

  test('returns false for different dates', () => {
    const a = new Date(2026, 3, 22);
    const b = new Date(2026, 3, 23);
    expect(sameDay(a, b)).toBe(false);
  });

  test('returns false for same day different month', () => {
    const a = new Date(2026, 3, 22);
    const b = new Date(2026, 4, 22);
    expect(sameDay(a, b)).toBe(false);
  });
});
