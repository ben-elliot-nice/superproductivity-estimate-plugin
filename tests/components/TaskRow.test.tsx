import { describe, expect, test, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { TaskRow } from '../../src/app/components/TaskRow';
import type { Task } from '../../src/app/types';

const MIN = 60_000;

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Test Task',
  timeEstimate: 30 * MIN,
  timeSpent: 10 * MIN,
  isDone: false,
  projectId: 'proj-1',
  tagIds: [],
  subTaskIds: [],
  created: Date.now(),
  dueWithTime: null,
  ...overrides,
});

describe('TaskRow', () => {
  test('renders task title', () => {
    const { getByText } = render(() => (
      <TaskRow
        task={makeTask()}
        isSubtask={false}
        isExpanded={false}
        onToggleExpand={() => {}}
        onEstimateUpdate={() => {}}
        onScheduleUpdate={() => Promise.resolve()}
        onScheduleClear={() => Promise.resolve()}
      />
    ));
    expect(getByText('Test Task')).toBeTruthy();
  });

  test('renders time logged', () => {
    const { getByText } = render(() => (
      <TaskRow
        task={makeTask({ timeSpent: 10 * MIN })}
        isSubtask={false}
        isExpanded={false}
        onToggleExpand={() => {}}
        onEstimateUpdate={() => {}}
        onScheduleUpdate={() => Promise.resolve()}
        onScheduleClear={() => Promise.resolve()}
      />
    ));
    expect(getByText('10m')).toBeTruthy();
  });

  test('renders parent label when isSubtask and parentTitle provided', () => {
    const { getByText } = render(() => (
      <TaskRow
        task={makeTask()}
        isSubtask={true}
        parentTitle="Parent Task"
        isExpanded={false}
        onToggleExpand={() => {}}
        onEstimateUpdate={() => {}}
        onScheduleUpdate={() => Promise.resolve()}
        onScheduleClear={() => Promise.resolve()}
      />
    ));
    expect(getByText('↳ Parent Task')).toBeTruthy();
  });

  test('does not render parent label when not a subtask', () => {
    const { queryByText } = render(() => (
      <TaskRow
        task={makeTask()}
        isSubtask={false}
        parentTitle="Parent Task"
        isExpanded={false}
        onToggleExpand={() => {}}
        onEstimateUpdate={() => {}}
        onScheduleUpdate={() => Promise.resolve()}
        onScheduleClear={() => Promise.resolve()}
      />
    ));
    expect(queryByText('↳ Parent Task')).toBeNull();
  });

  test('shows scheduled badge when dueWithTime is set', () => {
    // Wed April 22 2026 15:00
    const ts = new Date(2026, 3, 22, 15, 0, 0).getTime();
    const { getByText } = render(() => (
      <TaskRow
        task={makeTask({ dueWithTime: ts })}
        isSubtask={false}
        isExpanded={false}
        onToggleExpand={() => {}}
        onEstimateUpdate={() => {}}
        onScheduleUpdate={() => Promise.resolve()}
        onScheduleClear={() => Promise.resolve()}
      />
    ));
    expect(getByText('Wed 15:00')).toBeTruthy();
  });

  test('calls onToggleExpand when title area clicked', () => {
    const onToggleExpand = vi.fn();
    const { getByText } = render(() => (
      <TaskRow
        task={makeTask()}
        isSubtask={false}
        isExpanded={false}
        onToggleExpand={onToggleExpand}
        onEstimateUpdate={() => {}}
        onScheduleUpdate={() => Promise.resolve()}
        onScheduleClear={() => Promise.resolve()}
      />
    ));
    fireEvent.click(getByText('Test Task'));
    expect(onToggleExpand).toHaveBeenCalledOnce();
  });

  test('renders StartTimePicker when expanded', () => {
    const { getByText } = render(() => (
      <TaskRow
        task={makeTask()}
        isSubtask={false}
        isExpanded={true}
        onToggleExpand={() => {}}
        onEstimateUpdate={() => {}}
        onScheduleUpdate={() => Promise.resolve()}
        onScheduleClear={() => Promise.resolve()}
      />
    ));
    expect(getByText('Morning')).toBeTruthy();
  });

  test('does not render StartTimePicker when collapsed', () => {
    const { queryByText } = render(() => (
      <TaskRow
        task={makeTask()}
        isSubtask={false}
        isExpanded={false}
        onToggleExpand={() => {}}
        onEstimateUpdate={() => {}}
        onScheduleUpdate={() => Promise.resolve()}
        onScheduleClear={() => Promise.resolve()}
      />
    ));
    expect(queryByText('Morning')).toBeNull();
  });

  test('calls onEstimateUpdate when estimate button clicked', () => {
    const onEstimateUpdate = vi.fn();
    const { getByText } = render(() => (
      <TaskRow
        task={makeTask({ timeEstimate: 30 * MIN })}
        isSubtask={false}
        isExpanded={false}
        onToggleExpand={() => {}}
        onEstimateUpdate={onEstimateUpdate}
        onScheduleUpdate={() => Promise.resolve()}
        onScheduleClear={() => Promise.resolve()}
      />
    ));
    fireEvent.click(getByText('+15m'));
    expect(onEstimateUpdate).toHaveBeenCalledWith(45 * MIN);
  });
});