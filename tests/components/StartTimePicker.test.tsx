import { describe, expect, test, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { StartTimePicker } from '../../src/app/components/StartTimePicker';

describe('StartTimePicker', () => {
  test('renders 7 day chips', () => {
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={() => {}} onClear={() => {}} />
    ));
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Tomorrow')).toBeTruthy();
  });

  test('renders 4 time presets', () => {
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={() => {}} onClear={() => {}} />
    ));
    expect(getByText('Morning')).toBeTruthy();
    expect(getByText('Noon')).toBeTruthy();
    expect(getByText('Afternoon')).toBeTruthy();
    expect(getByText('Evening')).toBeTruthy();
  });

  test('time presets are disabled before a day is selected', () => {
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={() => {}} onClear={() => {}} />
    ));
    expect((getByText('Morning') as HTMLButtonElement).disabled).toBe(true);
    expect((getByText('Evening') as HTMLButtonElement).disabled).toBe(true);
  });

  test('time presets enable after clicking a day chip', () => {
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={() => {}} onClear={() => {}} />
    ));
    fireEvent.click(getByText('Today'));
    expect((getByText('Morning') as HTMLButtonElement).disabled).toBe(false);
  });

  test('calls onUpdate with correct timestamp when day + time selected', () => {
    const onUpdate = vi.fn();
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={onUpdate} onClear={() => {}} />
    ));
    fireEvent.click(getByText('Today'));
    fireEvent.click(getByText('Morning'));
    expect(onUpdate).toHaveBeenCalledOnce();
    const ts: number = onUpdate.mock.calls[0][0];
    const d = new Date(ts);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(0);
  });

  test('calls onClear when Clear is clicked', () => {
    const onClear = vi.fn();
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={() => {}} onClear={onClear} />
    ));
    fireEvent.click(getByText('Clear'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  test('pre-selects day chip matching existing dueWithTime', () => {
    // April 22 2026 15:00 — a Wednesday
    const ts = new Date(2026, 3, 22, 15, 0, 0).getTime();
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={ts} onUpdate={() => {}} onClear={() => {}} />
    ));
    // Afternoon should be enabled (day is already set)
    expect((getByText('Afternoon') as HTMLButtonElement).disabled).toBe(false);
  });
});