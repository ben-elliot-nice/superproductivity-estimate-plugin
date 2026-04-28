import { Component, Show } from 'solid-js';
import type { Task } from '../types';
import { EstimateButtons } from './EstimateButtons';
import { StartTimePicker } from './StartTimePicker';
import { formatTime } from '../utils/formatTime';
import { formatScheduledDate, getScheduleTiming } from '../utils/schedulingUtils';

const STALE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;

const TIMING_COLORS: Record<string, string> = {
  today:       '#ffe0b2',
  tomorrow:    '#fff9c4',
  'this-week': '#c8e6c9',
  future:      '#bbdefb',
  overdue:     '#ffcdd2',
};

interface Props {
  task: Task;
  isSubtask: boolean;
  parentTitle?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEstimateUpdate: (newEstimate: number) => void;
  onScheduleUpdate: (timestamp: number) => Promise<void>;
  onScheduleClear: () => Promise<void>;
}

export const TaskRow: Component<Props> = (props) => {
  const isScheduled = () => !!props.task.dueWithTime;
  const timingColor = () => {
    if (!props.task.dueWithTime) return undefined;
    return TIMING_COLORS[getScheduleTiming(props.task.dueWithTime)];
  };

  const isStale = () =>
    (props.task.timeEstimate ?? 0) > 0 &&
    !!props.task.created &&
    Date.now() - props.task.created > STALE_THRESHOLD_MS;

  return (
    <div
      class="task-row"
      classList={{ 'task-row--scheduled': isScheduled() }}
      style={timingColor() ? { '--timing-color': timingColor()! } : undefined}
    >
      <div class={`task-row-main${props.isSubtask ? ' is-subtask' : ''}`}>
        <div
          class="task-title"
          tabIndex={0}
          role="button"
          aria-expanded={props.isExpanded}
          onClick={props.onToggleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              props.onToggleExpand();
            }
          }}
        >
          <div class="task-title-text">
            {props.task.title}
            <Show when={isStale()}>
              <span class="stale-dot" title="Estimate may be outdated (task created >2 weeks ago)" />
            </Show>
          </div>
          <Show when={props.isSubtask && props.parentTitle}>
            <div class="task-parent-label">↳ {props.parentTitle}</div>
          </Show>
        </div>
        <div class="task-meta" onClick={props.onToggleExpand}>
          <Show when={props.task.dueWithTime}>
            <span
              class="scheduled-badge"
              classList={{ [`badge--${getScheduleTiming(props.task.dueWithTime!)}`]: true }}
            >
              {formatScheduledDate(props.task.dueWithTime!)}
            </span>
          </Show>
          <span class="time-logged">{formatTime(props.task.timeSpent)}</span>
        </div>
        <EstimateButtons
          estimate={props.task.timeEstimate}
          onUpdate={props.onEstimateUpdate}
        />
      </div>
      <Show when={props.isExpanded}>
        <StartTimePicker
          dueWithTime={props.task.dueWithTime ?? null}
          onUpdate={props.onScheduleUpdate}
          onClear={props.onScheduleClear}
        />
      </Show>
    </div>
  );
};
