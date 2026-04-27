import { createMemo, createSignal, For, onMount, Show } from 'solid-js';
import type { Project } from '@super-productivity/plugin-api';
import type { Task } from './types';
import { ProjectGroup } from './components/ProjectGroup';
import { sendMessage } from './utils/sendMessage';
import './App.css';

interface GroupedProject {
  projectId: string | null;
  title: string;
  tasks: Task[];
}

function App() {
  const [tasks, setTasks] = createSignal<Task[]>([]);
  const [projects, setProjects] = createSignal<Project[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showDone, setShowDone] = createSignal(false);
  const [expandedTaskId, setExpandedTaskId] = createSignal<string | null>(null);

  const taskMap = createMemo(() => new Map(tasks().map((t) => [t.id, t])));

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

    projects()
      .filter((p) => byProject.has(p.id))
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach((p) =>
        result.push({ projectId: p.id, title: p.title, tasks: byProject.get(p.id)! }),
      );

    return result;
  });

  const fetchData = async () => {
    const [fetchedTasks, fetchedProjects] = await Promise.all([
      sendMessage<Task[]>('getTasks'),
      sendMessage<Project[]>('getAllProjects'),
    ]);
    setTasks(fetchedTasks);
    setProjects(fetchedProjects);
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
    setTasks((all) =>
      all.map((t) => (t.id === taskId ? { ...t, timeEstimate: newEstimate } : t)),
    );
    try {
      await sendMessage('updateTask', { id: taskId, updates: { timeEstimate: newEstimate } });
    } catch {
      setTasks((all) => all.map((t) => (t.id === taskId ? { ...t, timeEstimate: prev } : t)));
      sendMessage('showSnack', { msg: 'Failed to update estimate', type: 'ERROR' }).catch(
        () => {},
      );
    }
  };

  const handleScheduleUpdate = async (taskId: string, timestamp: number) => {
    try {
      await sendMessage('updateTask', { id: taskId, updates: { dueWithTime: timestamp } });
      setTasks((all) =>
        all.map((t) => (t.id === taskId ? { ...t, dueWithTime: timestamp } : t)),
      );
      setExpandedTaskId(null);
    } catch {
      sendMessage('showSnack', { msg: 'Failed to update schedule', type: 'ERROR' }).catch(
        () => {},
      );
    }
  };

  const handleScheduleClear = async (taskId: string) => {
    try {
      await sendMessage('updateTask', { id: taskId, updates: { dueWithTime: null } });
      setTasks((all) =>
        all.map((t) => (t.id === taskId ? { ...t, dueWithTime: null } : t)),
      );
      setExpandedTaskId(null);
    } catch {
      sendMessage('showSnack', { msg: 'Failed to clear schedule', type: 'ERROR' }).catch(
        () => {},
      );
    }
  };

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  return (
    <div class="app">
      <header class="app-header">
        <h1>Estimates &amp; Schedule</h1>
        <label class="show-done-toggle">
          <input
            type="checkbox"
            checked={showDone()}
            onChange={(e) => setShowDone(e.currentTarget.checked)}
          />
          Show done
        </label>
      </header>
      <Show when={!loading()} fallback={<div class="loading">Loading tasks…</div>}>
        <For each={grouped()}>
          {(group) => (
            <ProjectGroup
              projectTitle={group.title}
              tasks={group.tasks}
              taskMap={taskMap()}
              showDone={showDone()}
              expandedTaskId={expandedTaskId()}
              onToggleExpand={handleToggleExpand}
              onEstimateUpdate={handleEstimateUpdate}
              onScheduleUpdate={handleScheduleUpdate}
              onScheduleClear={handleScheduleClear}
            />
          )}
        </For>
      </Show>
    </div>
  );
}

export default App;
