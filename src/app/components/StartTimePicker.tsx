import { Component, createEffect, createMemo, createSignal, For, Show } from 'solid-js';
import { DayChip, getDayChips, getTimestamp, sameDay } from '../utils/schedulingUtils';

export type CascadeMode = 'cascade' | 'gap-close';

interface Props {
  dueWithTime: number | null;
  onUpdate: (timestamp: number, cascadeMode?: CascadeMode) => void;
  onClear: () => void;
  showCascadeToggle?: boolean;
}

const TIME_PRESETS = [
  { label: 'Morning', hour: 9 },
  { label: 'Noon', hour: 12 },
  { label: 'Afternoon', hour: 15 },
  { label: 'Evening', hour: 20 },
] as const;

export const StartTimePicker: Component<Props> = (props) => {
  const chips: DayChip[] = getDayChips();
  const [cascade, setCascade] = createSignal(true);

  const dateFromDueWithTime = createMemo(() => {
    if (!props.dueWithTime) return null;
    const d = new Date(props.dueWithTime);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  const [selectedDate, setSelectedDate] = createSignal<Date | null>(dateFromDueWithTime());

  createEffect(() => {
    setSelectedDate(dateFromDueWithTime());
  });

  const emit = (timestamp: number) => {
    props.onUpdate(
      timestamp,
      props.showCascadeToggle ? (cascade() ? 'cascade' : 'gap-close') : undefined,
    );
  };

  const handleTimeClick = (hour: number) => {
    const d = selectedDate();
    if (!d) return;
    emit(getTimestamp(d, hour));
  };

  return (
    <div class="start-time-picker" onClick={(e) => e.stopPropagation()}>
      <Show when={props.showCascadeToggle}>
        <label class="cascade-toggle">
          <input
            type="checkbox"
            checked={cascade()}
            onChange={(e) => setCascade(e.currentTarget.checked)}
          />
          Move subsequent tasks
        </label>
      </Show>
      <div class="picker-row">
        <For each={chips}>
          {(chip) => (
            <button
              class="chip"
              classList={{
                active: !!selectedDate() && sameDay(selectedDate()!, chip.date),
              }}
              onClick={() => setSelectedDate(chip.date)}
            >
              {chip.label}
            </button>
          )}
        </For>
      </div>
      <div class="picker-row">
        <For each={TIME_PRESETS}>
          {(preset) => (
            <button
              class="chip"
              classList={{
                active:
                  !!props.dueWithTime &&
                  new Date(props.dueWithTime).getHours() === preset.hour &&
                  !!selectedDate() &&
                  sameDay(selectedDate()!, new Date(props.dueWithTime)),
              }}
              disabled={!selectedDate()}
              onClick={() => handleTimeClick(preset.hour)}
            >
              {preset.label}
            </button>
          )}
        </For>
        <button class="chip btn-now" onClick={() => emit(Date.now())}>
          Now
        </button>
        <button class="btn-clear" onClick={props.onClear}>
          Clear
        </button>
      </div>
    </div>
  );
};
