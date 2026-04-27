import { Component, createEffect, createMemo, createSignal, For } from 'solid-js';
import { DayChip, getDayChips, getTimestamp, sameDay } from '../utils/schedulingUtils';

interface Props {
  dueWithTime: number | null;
  onUpdate: (timestamp: number) => void;
  onClear: () => void;
}

const TIME_PRESETS = [
  { label: 'Morning', hour: 9 },
  { label: 'Noon', hour: 12 },
  { label: 'Afternoon', hour: 15 },
  { label: 'Evening', hour: 20 },
] as const;

export const StartTimePicker: Component<Props> = (props) => {
  const chips: DayChip[] = getDayChips();

  const dateFromDueWithTime = createMemo(() => {
    if (!props.dueWithTime) return null;
    const d = new Date(props.dueWithTime);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  const [selectedDate, setSelectedDate] = createSignal<Date | null>(dateFromDueWithTime());

  // Sync selectedDate when dueWithTime changes from outside
  createEffect(() => {
    setSelectedDate(dateFromDueWithTime());
  });

  const handleTimeClick = (hour: number) => {
    const d = selectedDate();
    if (!d) return;
    props.onUpdate(getTimestamp(d, hour));
  };

  return (
    <div class="start-time-picker" onClick={(e) => e.stopPropagation()}>
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
        <button class="btn-clear" onClick={props.onClear}>
          Clear
        </button>
      </div>
    </div>
  );
};