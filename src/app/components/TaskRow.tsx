import { Component, Show } from 'solid-js';
import type { Task } from '../types';
import { EstimateButtons } from './EstimateButtons';
import { StartTimePicker } from './StartTimePicker';
import { formatTime } from '../utils/formatTime';
import { formatScheduledDate } from '../utils/schedulingUtils';

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
  return (
    <div class="task-row">
      <div class={`task-row-main${props.isSubtask ? ' is-subtask' : ''}`}>
        <div class="task-title" onClick={props.onToggleExpand}>
          <div class="task-title-text">{props.task.title}</div>
          <Show when={props.isSubtask && props.parentTitle}>
            <div class="task-parent-label">↳ {props.parentTitle}</div>
          </Show>
        </div>
        <div class="task-meta" onClick={props.onToggleExpand}>
          <Show when={props.task.dueWithTime}>
            <span class="scheduled-badge">
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