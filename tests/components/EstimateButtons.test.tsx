import { describe, expect, test, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { EstimateButtons } from '../../src/app/components/EstimateButtons';

const MIN = 60_000;

describe('EstimateButtons', () => {
  test('displays current estimate', () => {
    const { getByText } = render(() => (
      <EstimateButtons estimate={30 * MIN} onUpdate={() => {}} />
    ));
    expect(getByText('30m')).toBeTruthy();
  });

  test('displays — when estimate is 0', () => {
    const { getByText } = render(() => (
      <EstimateButtons estimate={0} onUpdate={() => {}} />
    ));
    expect(getByText('—')).toBeTruthy();
  });

  test('calls onUpdate with incremented value on +15m click', () => {
    const onUpdate = vi.fn();
    const { getByText } = render(() => (
      <EstimateButtons estimate={30 * MIN} onUpdate={onUpdate} />
    ));
    fireEvent.click(getByText('+15m'));
    expect(onUpdate).toHaveBeenCalledWith(45 * MIN);
  });

  test('calls onUpdate with decremented value on −15m click', () => {
    const onUpdate = vi.fn();
    const { getByText } = render(() => (
      <EstimateButtons estimate={30 * MIN} onUpdate={onUpdate} />
    ));
    fireEvent.click(getByText('−15m'));
    expect(onUpdate).toHaveBeenCalledWith(15 * MIN);
  });

  test('floors at 0 when decrement exceeds current estimate', () => {
    const onUpdate = vi.fn();
    const { getByText } = render(() => (
      <EstimateButtons estimate={5 * MIN} onUpdate={onUpdate} />
    ));
    fireEvent.click(getByText('−30m'));
    expect(onUpdate).toHaveBeenCalledWith(0);
  });

  test('minus buttons are disabled when estimate is 0', () => {
    const { getByText } = render(() => (
      <EstimateButtons estimate={0} onUpdate={() => {}} />
    ));
    expect((getByText('−5m') as HTMLButtonElement).disabled).toBe(true);
    expect((getByText('−15m') as HTMLButtonElement).disabled).toBe(true);
    expect((getByText('−5h') as HTMLButtonElement).disabled).toBe(true);
  });

  test('plus buttons are never disabled', () => {
    const { getByText } = render(() => (
      <EstimateButtons estimate={0} onUpdate={() => {}} />
    ));
    expect((getByText('+5m') as HTMLButtonElement).disabled).toBe(false);
  });

  test('does not call onUpdate when disabled button is clicked', () => {
    const onUpdate = vi.fn();
    const { getByText } = render(() => (
      <EstimateButtons estimate={0} onUpdate={onUpdate} />
    ));
    fireEvent.click(getByText('−5m'));
    expect(onUpdate).not.toHaveBeenCalled();
  });
});