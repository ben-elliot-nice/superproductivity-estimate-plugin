import { describe, expect, test } from 'vitest';
import { formatTime } from '../src/app/utils/formatTime';

describe('formatTime', () => {
  test('returns — for zero', () => {
    expect(formatTime(0)).toBe('—');
  });

  test('returns — for negative', () => {
    expect(formatTime(-1000)).toBe('—');
  });

  test('returns minutes only when under an hour', () => {
    expect(formatTime(30 * 60 * 1000)).toBe('30m');
  });

  test('returns hours only when no remaining minutes', () => {
    expect(formatTime(2 * 60 * 60 * 1000)).toBe('2h');
  });

  test('returns hours and minutes', () => {
    expect(formatTime(90 * 60 * 1000)).toBe('1h 30m');
  });

  test('rounds sub-minute amounts up', () => {
    expect(formatTime(45 * 1000)).toBe('1m');
  });

  test('returns — when sub-minute rounds to zero', () => {
    expect(formatTime(20 * 1000)).toBe('—');
  });
});
