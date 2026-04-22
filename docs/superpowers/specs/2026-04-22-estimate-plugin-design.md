# Estimate & Scheduler Plugin — Design Spec

**Date:** 2026-04-22
**Status:** Approved

---

## Overview

A Super Productivity plugin for rapidly editing task time estimates and scheduling start times across a full task list. The primary use case is pre-session planning: scan a long list of tasks, adjust estimates with one-click increment/decrement buttons, and optionally set a rough start time without leaving the plugin view.

---

## Architecture

**Stack:** TypeScript + Vite + SolidJS, based on the `boilerplate-solid-js` template from the SP monorepo.

**Two-process model:**

- `src/plugin.ts` — runs in SP's sandboxed JS context. Registers a header button and keyboard shortcut to open the view. Handles all `PluginAPI` calls via `plugin.onMessage`. The iframe cannot call `PluginAPI` directly.
- `src/app/` — SolidJS app in the iframe. Communicates with `plugin.ts` via `postMessage` using a typed `sendMessage(type, payload)` helper.

**Message protocol:**

| Message type | plugin.ts action | Returns |
|---|---|---|
| `getTasks` | `plugin.getTasks()` | `Task[]` |
| `getAllProjects` | `plugin.getAllProjects()` | `Project[]` |
| `updateTask` | `plugin.updateTask(id, updates)` | `void` |

**Manifest:** `iFrame: true`, `sidePanel: true`. No i18n. No `nodeExecution` permission needed.

**Build output:** `dist/` committed to the repo. The plugin can be loaded directly from the folder in SP without a separate build step on the user's side.

**File structure:**

```
superproductivity-estimate-plugin/
├── src/
│   ├── manifest.json
│   ├── plugin.ts
│   └── app/
│       ├── index.tsx
│       ├── App.tsx
│       ├── App.css
│       ├── components/
│       │   ├── ProjectGroup.tsx
│       │   ├── TaskRow.tsx
│       │   ├── EstimateButtons.tsx
│       │   └── StartTimePicker.tsx
│       └── utils/
│           ├── formatTime.ts
│           ├── sendMessage.ts
│           └── schedulingUtils.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── dist/
```

---

## Components

### `App.tsx`

Root component. Fetches tasks and projects on mount in parallel. Owns:
- `tasks: Task[]` signal
- `projects: Project[]` signal
- `expandedTaskId: string | null` signal (only one start-time picker open at a time)
- `showDone: boolean` toggle

Derives grouped structure: tasks grouped by `projectId`, top-level tasks (no `parentId`) listed first, each immediately followed by their direct subtasks. Tasks with `isDone: true` filtered out by default; a toggle shows them. Tasks with no `projectId` appear in an "Inbox" group at the top.

Registers `ANY_TASK_UPDATE` hook via plugin.ts. When fired, re-fetches tasks to stay in sync with edits made elsewhere in SP.

### `ProjectGroup.tsx`

A collapsible project heading followed by its task rows. Renders `TaskRow` for each top-level task, with subtasks indented beneath their parent.

### `TaskRow.tsx`

A single task row displaying:
- **Title** — slightly indented and muted if the task is a subtask
- **Parent label** — if `parentId` is set, shows `↳ Parent title` as a small secondary label
- **Time logged** — formatted from `timeSpent` (e.g. `1h 30m`, or `—` if zero)
- **Estimate** — current `timeEstimate` displayed inline between the ± buttons
- **`EstimateButtons`** strip
- **Scheduled badge** — if `dueWithTime` is set, shows e.g. `Scheduled: Wed 15:00`

Clicking the row toggles `expandedTaskId`. When expanded, renders `StartTimePicker` below the row.

### `EstimateButtons.tsx`

A horizontal strip of buttons:

```
−5h  −1h  −30m  −15m  −5m  [estimate]  +5m  +15m  +30m  +1h  +5h
```

Behaviour:
- Clicking a button applies an optimistic local signal update immediately, then fires `updateTask` in the background.
- Floor at 0ms — minus buttons do nothing if `timeEstimate` is already 0.
- If `updateTask` fails, reverts the local signal to the previous value and shows a snack error.
- Rapid clicks are safe — each click operates on the current signal value.

### `StartTimePicker.tsx`

Shown below the row when expanded. Two rows of chips:

**Day chips (7):** Today | Tomorrow | then the next 5 calendar day names (e.g. Wed | Thu | Fri | Sat | Sun). The chip matching the current `dueWithTime` date is highlighted.

**Time presets (4):** Morning (09:00) | Noon (12:00) | Afternoon (15:00) | Evening (20:00). Disabled until a day chip is selected.

Selecting day + time sets `dueWithTime` to a unix ms timestamp: `new Date(year, month, day, hour, 0, 0).getTime()`. A **Clear** button sets `dueWithTime: null`. The picker closes after a successful update.

> **Scheduling field note:** The SP plugin API has no dedicated "start time" field. `dueWithTime` (unix ms datetime) is used, which is the same field SP's built-in scheduler uses. Fine-grained time adjustments beyond the 4 presets should be done in SP's scheduler view.

---

## Data Flow

**Initial load:** `getTasks` and `getAllProjects` fetched in parallel on mount. Two lookup maps built: `taskMap: Map<id, Task>` and `projectMap: Map<id, Project>`. Grouped structure derived reactively from signals.

**Estimate updates (optimistic):** Signal updates immediately on button click for instant UI feedback. `updateTask` fires async. On failure: revert signal, show snack.

**Start time updates (non-optimistic):** Picker stays open until `updateTask` resolves, then closes. On failure: picker stays open, show snack error.

**Live sync:** `ANY_TASK_UPDATE` hook in `plugin.ts` sends a `tasksUpdated` message to the iframe, which triggers a re-fetch. Keeps the list current if tasks change elsewhere in SP while the plugin is open.

**Error handling:** All `sendMessage` calls wrapped in try/catch. Failures surface via `plugin.showSnack`. No silent failures.

---

## Testing

Vitest (configured in boilerplate). Unit tests cover:
- `formatTime.ts` — ms-to-string formatting edge cases (0, sub-minute, hours+minutes)
- `schedulingUtils.ts` — day chip date calculations, unix ms timestamp generation
- `EstimateButtons` — floor-at-zero behaviour, increment/decrement math
