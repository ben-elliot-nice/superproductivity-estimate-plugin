import { createMemo, createSignal, For, onMount, Show } from 'solid-js';
import type { PluginAPI as PluginAPIType, Project } from '@super-productivity/plugin-api';
import type { Task } from './types';
import { ProjectGroup } from './components/ProjectGroup';
import type { CascadeMode } from './components/StartTimePicker';
import type { ProjectSortKey } from './components/FilterBar';
import { FilterBar, FilterState, DEFAULT_FILTER } from './components/FilterBar';
import { Modal } from './components/Modal';
import { formatTime } from './utils/formatTime';
import { distributeSubtaskTimes, hasScheduledSubtasks } from './utils/schedulingUtils';
import './App.css';

declare const PluginAPI: PluginAPIType;

interface GroupedProject {
  projectId: string | null;
  title: string;
  tasks: Task[];
  projectColor?: string;
}

type ModalConfig = {
  message: string;
  resolve: (confirmed: boolean) => void;
};

function App() {
  const [tasks, setTasks] = createSignal<Task[]>([]);
  const [projects, setProjects] = createSignal<Project[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showDone, setShowDone] = createSignal(false);
  const [showTimeLogged, setShowTimeLogged] = createSignal(false);
  const [expandedTaskId, setExpandedTaskId] = createSignal<string | null>(null);
  const [filter, setFilter] = createSignal<FilterState>(DEFAULT_FILTER);
  const [modalConfig, setModalConfig] = createSignal<ModalConfig | null>(null);
  const [collapsedProjects, setCollapsedProjects] = createSignal<Set<string | null>>(new Set());

  const handleToggleCollapse = (projectId: string | null) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const taskMap = createMemo(() => new Map(tasks().map((t) => [t.id, t])));

  const confirmAction = (message: string): Promise<boolean> =>
    new Promise((resolve) => {
      setModalConfig({
        message,
        resolve: (confirmed) => {
          setModalConfig(null);
          resolve(confirmed);
        },
      });
    });

  const projectLatest = (tasks: Task[], map: Map<string, Task>): number => {
    let latest = 0;
    for (const t of tasks) {
      const ts = t.updated ?? t.created ?? 0;
      if (ts > latest) latest = ts;
      for (const subId of t.subTaskIds ?? []) {
        const sub = map.get(subId);
        if (sub) {
          const subTs = sub.updated ?? sub.created ?? 0;
          if (subTs > latest) latest = subTs;
        }
      }
    }
    return latest;
  };

  const grouped = createMemo((): GroupedProject[] => {
    const map = taskMap();
    const topLevelAll = tasks().filter((t) => !t.parentId || !map.has(t.parentId));
    const topLevel = showDone() ? topLevelAll : topLevelAll.filter((t) => !t.isDone);

    const byProject = new Map<string | null, Task[]>();
    topLevel.forEach((t) => {
      const key = t.projectId;
      if (!byProject.has(key)) byProject.set(key, []);
      byProject.get(key)!.push(t);
    });

    const result: GroupedProject[] = [];

    if (byProject.has(null)) {
      result.push({ projectId: null, title: 'Inbox', tasks: byProject.get(null)! });
    }

    const projectSort: ProjectSortKey = filter().projectSort;

    const sortedProjects = projects().filter((p) => byProject.has(p.id));
    if (projectSort === 'default') {
      sortedProjects.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      sortedProjects.sort((a, b) => {
        const aTs = projectLatest(byProject.get(a.id)!, map);
        const bTs = projectLatest(byProject.get(b.id)!, map);
        return projectSort === 'recently-updated' ? bTs - aTs : aTs - bTs;
      });
    }

    sortedProjects.forEach((p) =>
      result.push({
        projectId: p.id,
        title: p.title,
        tasks: byProject.get(p.id)!,
        projectColor: (p as any).theme?.primary as string | undefined,
      }),
    );

    return result;
  });

  const filteredGrouped = createMemo(() => {
    const f = filter();
    const map = taskMap();
    const q = f.text.trim().toLowerCase();

    return grouped().flatMap((group) => {
      let groupTasks = group.tasks;

      // Text search: project title match shows all tasks; otherwise filter by task/subtask title
      if (q) {
        if (!group.title.toLowerCase().includes(q)) {
          groupTasks = groupTasks.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              (t.subTaskIds ?? []).some((id) => map.get(id)?.title.toLowerCase().includes(q)),
          );
          if (!groupTasks.length) return [];
        }
      }

      // Cycle filters
      if (f.scheduleFilter === 'scheduled') groupTasks = groupTasks.filter((t) => !!t.dueWithTime);
      if (f.scheduleFilter === 'unscheduled') groupTasks = groupTasks.filter((t) => !t.dueWithTime);
      if (f.estimateFilter === 'estimated') groupTasks = groupTasks.filter((t) => (t.timeEstimate ?? 0) > 0);
      if (f.estimateFilter === 'unestimated') groupTasks = groupTasks.filter((t) => !(t.timeEstimate ?? 0));

      if (!groupTasks.length) return [];

      // Sort
      if (f.sort !== 'default') {
        groupTasks = [...groupTasks];
        if (f.sort === 'estimate-asc')
          groupTasks.sort((a, b) => (a.timeEstimate ?? 0) - (b.timeEstimate ?? 0));
        else if (f.sort === 'estimate-desc')
          groupTasks.sort((a, b) => (b.timeEstimate ?? 0) - (a.timeEstimate ?? 0));
        else if (f.sort === 'scheduled-asc')
          groupTasks.sort((a, b) => (a.dueWithTime ?? Infinity) - (b.dueWithTime ?? Infinity));
        else if (f.sort === 'scheduled-desc')
          groupTasks.sort((a, b) => (b.dueWithTime ?? -Infinity) - (a.dueWithTime ?? -Infinity));
      }

      return [{ ...group, tasks: groupTasks }];
    });
  });

  const totalSummary = createMemo(() => {
    const map = taskMap();
    let totalMs = 0;
    let count = 0;
    for (const group of filteredGrouped()) {
      for (const task of group.tasks) {
        totalMs += task.timeEstimate ?? 0;
        count++;
        for (const subId of task.subTaskIds ?? []) {
          const sub = map.get(subId);
          if (sub && (showDone() || !sub.isDone)) {
            totalMs += sub.timeEstimate ?? 0;
            count++;
          }
        }
      }
    }
    return { totalMs, count };
  });

  const fetchData = async () => {
    const [fetchedTasks, fetchedProjects] = await Promise.all([
      PluginAPI.getTasks() as Promise<Task[]>,
      PluginAPI.getAllProjects(),
    ]);
    setTasks(fetchedTasks);
    setProjects(fetchedProjects as Project[]);
  };

  onMount(async () => {
    try {
      await fetchData();
    } finally {
      setLoading(false);
    }

    window.addEventListener('message', (e: MessageEvent) => {
      if (e.data?.type === 'tasksUpdated') fetchData();
    });
  });

  const handleEstimateUpdate = async (taskId: string, newEstimate: number) => {
    const prev = tasks().find((t) => t.id === taskId)?.timeEstimate ?? 0;
    const savedScroll = window.scrollY;
    setTasks((all) =>
      all.map((t) => (t.id === taskId ? { ...t, timeEstimate: newEstimate } : t)),
    );
    requestAnimationFrame(() => window.scrollTo({ top: savedScroll, behavior: 'instant' }));
    try {
      await PluginAPI.updateTask(taskId, { timeEstimate: newEstimate });
    } catch {
      setTasks((all) => all.map((t) => (t.id === taskId ? { ...t, timeEstimate: prev } : t)));
      (PluginAPI as any).showSnack({ msg: 'Failed to update estimate', type: 'ERROR' });
    }
  };

  const handleScheduleUpdate = async (
    taskId: string,
    timestamp: number,
    cascadeMode?: 'cascade' | 'gap-close',
  ) => {
    const savedScroll = window.scrollY;
    // Capture original state before any mutations
    const originalTask = tasks().find((t) => t.id === taskId);
    const originalDueWithTime = originalTask?.dueWithTime;

    try {
      await PluginAPI.updateTask(taskId, { dueWithTime: timestamp } as any);
      setTasks((all) =>
        all.map((t) => (t.id === taskId ? { ...t, dueWithTime: timestamp } : t)),
      );
      requestAnimationFrame(() => window.scrollTo({ top: savedScroll, behavior: 'instant' }));

      const subtaskIds = originalTask?.subTaskIds ?? [];

      if (subtaskIds.length > 0) {
        // ── Parent task: propagate to subtasks (existing behaviour) ──────────
        const subtasks = subtaskIds
          .map((id) => taskMap().get(id))
          .filter((t): t is Task => !!t && !t.isDone);

        if (hasScheduledSubtasks(subtasks)) {
          const count = subtasks.filter((t) => !!t.dueWithTime).length;
          const confirmed = await confirmAction(
            `${count} subtask${count !== 1 ? 's' : ''} already ${count !== 1 ? 'have' : 'has'} a scheduled time. Overwrite?`,
          );
          if (!confirmed) {
            setExpandedTaskId(null);
            return;
          }
        }

        const updates = distributeSubtaskTimes(subtasks, timestamp);
        await Promise.all(
          updates.map((u) =>
            PluginAPI.updateTask(u.id, { dueWithTime: u.dueWithTime } as any),
          ),
        );
        setTasks((all) =>
          all.map((t) => {
            const upd = updates.find((u) => u.id === t.id);
            return upd ? { ...t, dueWithTime: upd.dueWithTime } : t;
          }),
        );
      } else if (cascadeMode && originalTask?.parentId) {
        // ── Subtask: cascade or gap-close mode ───────────────────────────────
        const parent = taskMap().get(originalTask.parentId);
        if (parent) {
          const allSiblingIds = parent.subTaskIds ?? [];
          const selectedIdx = allSiblingIds.indexOf(taskId);
          const subsequent = allSiblingIds
            .slice(selectedIdx + 1)
            .map((id) => taskMap().get(id))
            .filter((t): t is Task => !!t && !t.isDone);

          let updates: { id: string; time: number }[] = [];

          if (cascadeMode === 'cascade') {
            // Move all subsequent subtasks sequentially from the new time
            let cursor = timestamp + (originalTask.timeEstimate ?? 0);
            for (const sub of subsequent) {
              updates.push({ id: sub.id, time: cursor });
              cursor += sub.timeEstimate ?? 0;
            }
          } else {
            // Gap-close: repack only already-scheduled subsequent subtasks
            // starting from where the selected task used to begin
            const gapStart = originalDueWithTime ?? timestamp;
            let cursor = gapStart;
            for (const sub of subsequent.filter((t) => !!t.dueWithTime)) {
              updates.push({ id: sub.id, time: cursor });
              cursor += sub.timeEstimate ?? 0;
            }
          }

          await Promise.all(
            updates.map((u) =>
              PluginAPI.updateTask(u.id, { dueWithTime: u.time } as any),
            ),
          );
          setTasks((all) =>
            all.map((t) => {
              const u = updates.find((u) => u.id === t.id);
              return u ? { ...t, dueWithTime: u.time } : t;
            }),
          );
        }
      }

      setExpandedTaskId(null);
    } catch {
      (PluginAPI as any).showSnack({ msg: 'Failed to update schedule', type: 'ERROR' });
    }
  };

  const handleScheduleClear = async (taskId: string, cascadeMode?: CascadeMode) => {
    const savedScroll = window.scrollY;
    try {
      if (cascadeMode === 'cascade') {
        // Subtask context: clear subsequent sibling subtasks
        const parentTask = tasks().find((t) => (t.subTaskIds ?? []).includes(taskId));
        if (parentTask) {
          const stIdx = (parentTask.subTaskIds ?? []).indexOf(taskId);
          const subsequentSubs = (parentTask.subTaskIds ?? [])
            .slice(stIdx + 1)
            .map((id) => taskMap().get(id))
            .filter((t): t is Task => !!t && !!t.dueWithTime && !t.isDone);
          if (subsequentSubs.length > 0) {
            await Promise.all(
              subsequentSubs.map((s) =>
                PluginAPI.updateTask(s.id, { dueWithTime: null } as any),
              ),
            );
            setTasks((all) =>
              all.map((t) =>
                subsequentSubs.some((s) => s.id === t.id) ? { ...t, dueWithTime: null } : t,
              ),
            );
          }
        }
      } else {
        // Parent task context: clear all scheduled subtasks (with confirmation if any exist)
        const task = tasks().find((t) => t.id === taskId);
        const scheduledSubs = (task?.subTaskIds ?? [])
          .map((id) => taskMap().get(id))
          .filter((t): t is Task => !!t && !!t.dueWithTime && !t.isDone);
        if (scheduledSubs.length > 0) {
          const n = scheduledSubs.length;
          const confirmed = await confirmAction(
            `Clear schedule for this task and ${n} subtask${n !== 1 ? 's' : ''}?`,
          );
          if (!confirmed) return;
          await Promise.all(
            scheduledSubs.map((s) =>
              PluginAPI.updateTask(s.id, { dueWithTime: null } as any),
            ),
          );
          setTasks((all) =>
            all.map((t) =>
              scheduledSubs.some((s) => s.id === t.id) ? { ...t, dueWithTime: null } : t,
            ),
          );
        }
      }

      await PluginAPI.updateTask(taskId, { dueWithTime: null } as any);
      setTasks((all) =>
        all.map((t) => (t.id === taskId ? { ...t, dueWithTime: null } : t)),
      );
      requestAnimationFrame(() => window.scrollTo({ top: savedScroll, behavior: 'instant' }));
      setExpandedTaskId(null);
    } catch {
      (PluginAPI as any).showSnack({ msg: 'Failed to clear schedule', type: 'ERROR' });
    }
  };

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const summary = () => totalSummary();

  return (
    <div class="app">
      <div class="app-sticky-top">
        <header class="app-header">
          <h1>Estimates &amp; Schedule</h1>
          <div class="header-toggles">
            <label class="header-toggle">
              <input
                type="checkbox"
                checked={showDone()}
                onChange={(e) => setShowDone(e.currentTarget.checked)}
              />
              Show done
            </label>
            <label class="header-toggle">
              <input
                type="checkbox"
                checked={showTimeLogged()}
                onChange={(e) => setShowTimeLogged(e.currentTarget.checked)}
              />
              Show time logged
            </label>
          </div>
        </header>
        <FilterBar filter={filter()} onChange={setFilter} />
      </div>
      <div class="app-content">
        <Show when={loading()}>
          <div class="loading">Loading tasks…</div>
        </Show>
        <Show when={!loading()}>
          <For each={filteredGrouped()}>
            {(group) => (
              <ProjectGroup
                projectTitle={group.title}
                projectColor={group.projectColor}
                isCollapsed={collapsedProjects().has(group.projectId)}
                onToggleCollapse={() => handleToggleCollapse(group.projectId)}
                tasks={group.tasks}
                taskMap={taskMap()}
                showDone={showDone()}
                showTimeLogged={showTimeLogged()}
                expandedTaskId={expandedTaskId()}
                onToggleExpand={handleToggleExpand}
                onEstimateUpdate={handleEstimateUpdate}
                onScheduleUpdate={handleScheduleUpdate}
                onScheduleClear={handleScheduleClear}
              />
            )}
          </For>
          <Show when={filteredGrouped().length === 0}>
            <div class="no-results">No tasks match the current filter.</div>
          </Show>
          <div class="summary-footer">
            <span>{summary().count} task{summary().count !== 1 ? 's' : ''}</span>
            <span>
              {summary().totalMs > 0 ? formatTime(summary().totalMs) + ' estimated' : 'no estimates'}
            </span>
          </div>
        </Show>
      </div>
      <Show when={modalConfig() !== null}>
        <Modal
          message={modalConfig()!.message}
          onConfirm={() => modalConfig()!.resolve(true)}
          onCancel={() => modalConfig()!.resolve(false)}
        />
      </Show>
    </div>
  );
}

export default App;
