import { Component, createEffect, createMemo, createSignal, For, Show } from 'solid-js';
import { DayChip, getDayChips, sameDay } from '../utils/schedulingUtils';

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

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_ABBR = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseTimeInput(raw: string): { h: number; m: number } | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;
  if (s === 'noon' || s === 'midday') return { h: 12, m: 0 };
  if (s === 'midnight') return { h: 0, m: 0 };

  // Accept: 5pm, 5:30pm, 5.30pm, 530pm, 17:00, 17.00, 9am, 9, 930am
  const m = s.match(/^(\d{1,2})[.:]?(\d{2})?\s*(am|pm)?$/);
  if (!m) return null;

  let h = parseInt(m[1]);
  const mins = m[2] ? parseInt(m[2]) : 0;
  const ap = m[3];

  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || mins > 59) return null;

  return { h, m: mins };
}

export const StartTimePicker: Component<Props> = (props) => {
  const chips: DayChip[] = getDayChips();
  const [cascade, setCascade] = createSignal(true);
  const [showCalendar, setShowCalendar] = createSignal(false);
  const [timeInput, setTimeInput] = createSignal('');
  const [calendarView, setCalendarView] = createSignal(new Date());

  const dateFromDueWithTime = createMemo(() => {
    if (!props.dueWithTime) return null;
    const d = new Date(props.dueWithTime);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });

  const [selectedDate, setSelectedDate] = createSignal<Date | null>(dateFromDueWithTime());

  createEffect(() => setSelectedDate(dateFromDueWithTime()));

  // Sync time input display with current dueWithTime
  createEffect(() => {
    if (props.dueWithTime) {
      const d = new Date(props.dueWithTime);
      setTimeInput(
        `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
      );
    } else {
      setTimeInput('');
    }
  });

  const emit = (ts: number) =>
    props.onUpdate(ts, props.showCascadeToggle ? (cascade() ? 'cascade' : 'gap-close') : undefined);

  const commitTime = (d: Date | null, h: number, m = 0) => {
    if (!d) return;
    emit(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0).getTime());
  };

  const handleTimeInputCommit = () => {
    const parsed = parseTimeInput(timeInput());
    if (parsed) commitTime(selectedDate(), parsed.h, parsed.m);
  };

  // ── Calendar ────────────────────────────────────────────────────────────
  const calendarGrid = createMemo(() => {
    const y = calendarView().getFullYear();
    const mo = calendarView().getMonth();
    const firstDay = new Date(y, mo, 1).getDay();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return { cells, y, mo };
  });

  const shiftMonth = (delta: number) => {
    const d = calendarView();
    setCalendarView(new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const pickCalendarDay = (day: number) => {
    const { y, mo } = calendarGrid();
    const date = new Date(y, mo, day);
    setSelectedDate(date);
    setCalendarView(date);
    setShowCalendar(false);
  };

  const todayMidnight = new Date(
    new Date().getFullYear(), new Date().getMonth(), new Date().getDate(),
  );

  const calendarLabel = () => {
    const d = selectedDate();
    if (!d) return '📅 Date';
    return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
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

      {/* ── Date row (right-justified) ───────────────────────────────── */}
      <div class="picker-row picker-row--right">
        <For each={chips}>
          {(chip) => (
            <button
              class="chip"
              classList={{ active: !!selectedDate() && sameDay(selectedDate()!, chip.date) }}
              onClick={() => { setSelectedDate(chip.date); setShowCalendar(false); }}
            >
              {chip.label}
            </button>
          )}
        </For>
        <div class="calendar-wrap">
          <button
            class="chip chip--calendar"
            classList={{ active: showCalendar() }}
            onClick={() => { setCalendarView(selectedDate() ?? new Date()); setShowCalendar((v) => !v); }}
          >
            {calendarLabel()}
          </button>
          <Show when={showCalendar()}>
            <div class="calendar-backdrop" onClick={() => setShowCalendar(false)} />
            <div class="calendar-overlay" onClick={(e) => e.stopPropagation()}>
              <div class="calendar-nav">
                <button onClick={() => shiftMonth(-1)}>‹</button>
                <span>{MONTHS[calendarGrid().mo]} {calendarGrid().y}</span>
                <button onClick={() => shiftMonth(1)}>›</button>
              </div>
              <div class="calendar-days-header">
                <For each={DAY_ABBR}>{(d) => <span>{d}</span>}</For>
              </div>
              <div class="calendar-grid">
                <For each={calendarGrid().cells}>
                  {(day) => (
                    <button
                      class="calendar-day"
                      classList={{
                        empty: day === null,
                        today: !!day && sameDay(new Date(calendarGrid().y, calendarGrid().mo, day!), todayMidnight),
                        selected: !!day && !!selectedDate() && sameDay(new Date(calendarGrid().y, calendarGrid().mo, day!), selectedDate()!),
                      }}
                      disabled={day === null}
                      onClick={() => { if (day !== null) pickCalendarDay(day); }}
                    >
                      {day ?? ''}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* ── Time row (Clear left, rest right) ───────────────────────────── */}
      <div class="picker-row picker-row--time">
        <button class="btn-clear" onClick={props.onClear}>Clear</button>
        <div class="picker-time-right">
          <button class="chip btn-now" onClick={() => emit(Date.now())}>Now</button>
          <For each={TIME_PRESETS}>
            {(preset) => (
              <button
                class="chip"
                classList={{
                  active:
                    !!props.dueWithTime &&
                    new Date(props.dueWithTime).getHours() === preset.hour &&
                    new Date(props.dueWithTime).getMinutes() === 0 &&
                    !!selectedDate() &&
                    sameDay(selectedDate()!, new Date(props.dueWithTime)),
                }}
                disabled={!selectedDate()}
                onClick={() => commitTime(selectedDate(), preset.hour)}
              >
                {preset.label}
              </button>
            )}
          </For>
          <input
            class="time-input"
            type="text"
            placeholder="e.g. 5pm"
            value={timeInput()}
            onInput={(e) => setTimeInput(e.currentTarget.value)}
            onBlur={handleTimeInputCommit}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleTimeInputCommit(); } }}
          />
        </div>
      </div>
    </div>
  );
};
