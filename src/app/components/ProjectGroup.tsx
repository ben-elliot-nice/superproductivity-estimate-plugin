import { Component, createMemo, For, Show } from 'solid-js';
import type { Task } from '../types';
import { TaskRow } from './TaskRow';

interface FlatRow {
  task: Task;
  isSubtask: boolean;
  parentTitle: string | undefined;
}

interface Props {
  projectTitle: string;
  projectColor?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  tasks: Task[]; // top-level tasks only
  taskMap: Map<string, Task>;
  showDone: boolean;
  showTimeLogged: boolean;
  expandedTaskId: string | null;
  onToggleExpand: (taskId: string) => void;
  onEstimateUpdate: (taskId: string, newEstimate: number) => void;
  onScheduleUpdate: (taskId: string, timestamp: number) => Promise<void>;
  onScheduleClear: (taskId: string) => Promise<void>;
}

export const ProjectGroup: Component<Props> = (props) => {
  const flatRows = createMemo((): FlatRow[] =>
    props.tasks.flatMap((task) => {
      const subtasks = (task.subTaskIds ?? [])
        .map((id) => props.taskMap.get(id))
        .filter((t): t is Task => !!t && (props.showDone || !t.isDone));
      return [
        { task, isSubtask: false, parentTitle: undefined },
        ...subtasks.map((st) => ({ task: st, isSubtask: true, parentTitle: task.title })),
      ];
    }),
  );

  return (
    <div class="project-group">
      <div
        class="project-header"
        style={props.projectColor ? { '--project-color': props.projectColor } : undefined}
        onClick={props.onToggleCollapse}
      >
        <span class="project-collapse-icon">{props.isCollapsed ? '▶' : '▼'}</span>
        <span class="project-title">{props.projectTitle}</span>
        <span class="project-task-count">({props.tasks.length})</span>
      </div>
      <Show when={!props.isCollapsed}>
        <For each={flatRows()}>
          {(row) => (
            <TaskRow
              task={row.task}
              isSubtask={row.isSubtask}
              parentTitle={row.parentTitle}
              isExpanded={props.expandedTaskId === row.task.id}
              showTimeLogged={props.showTimeLogged}
              onToggleExpand={() => props.onToggleExpand(row.task.id)}
              onEstimateUpdate={(newEstimate) =>
                props.onEstimateUpdate(row.task.id, newEstimate)
              }
              onScheduleUpdate={(ts) => props.onScheduleUpdate(row.task.id, ts)}
              onScheduleClear={() => props.onScheduleClear(row.task.id)}
            />
          )}
        </For>
      </Show>
    </div>
  );
};
