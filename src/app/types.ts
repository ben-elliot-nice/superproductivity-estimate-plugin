import type { Task as BaseTask } from '@super-productivity/plugin-api';

// Extend Task interface with fields that exist in the SP codebase
// but aren't yet exposed in the published plugin-api package
export interface Task extends BaseTask {
  dueWithTime?: number | null;
  dueDay?: string | null;
  remindAt?: number | null;
  created?: number; // ms timestamp — used for estimate staleness detection
}
