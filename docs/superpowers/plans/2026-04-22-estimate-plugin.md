# Estimate & Scheduler Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Super Productivity plugin (TypeScript + SolidJS) for rapidly editing task estimates and scheduling start times across all projects.

**Architecture:** Two-process model — `src/plugin.ts` runs in SP's sandboxed context and handles all PluginAPI calls via `onMessage`; `src/app/` is a SolidJS iframe app that communicates via `postMessage`. The iframe displays all tasks grouped by project with inline ±estimate buttons and an expandable day/time picker.

**Tech Stack:** TypeScript 5.x, SolidJS 1.9.x, Vite 7.x, vite-plugin-solid, vite-plugin-singlefile, vitest, @solidjs/testing-library, @super-productivity/plugin-api

---

## File Map

| File | Responsibility |
|---|---|
| `public/manifest.json` | Plugin manifest — auto-copied to `dist/` by Vite |
| `src/plugin.ts` | SP sandboxed context: registers header button + shortcut, handles all PluginAPI message calls |
| `src/app/index.tsx` | SolidJS entry point — mounts `<App />` into `#root` |
| `src/app/App.tsx` | Root: fetches tasks/projects, owns signals for grouped tasks + expanded state, handles estimate/schedule updates |
| `src/app/App.css` | All layout and component styles using SP CSS variables |
| `src/app/components/EstimateButtons.tsx` | Stateless ±button strip: −5h −1h −30m −15m −5m [value] +5m +15m +30m +1h +5h |
| `src/app/components/StartTimePicker.tsx` | Day chip row + Morning/Noon/Afternoon/Evening time presets |
| `src/app/components/TaskRow.tsx` | Single row: title, parent label, logged time, estimate strip, scheduled badge; expands to picker |
| `src/app/components/ProjectGroup.tsx` | Collapsible project heading + flattened top-level + subtask rows |
| `src/app/utils/formatTime.ts` | `formatTime(ms): string` — converts milliseconds to `"1h 30m"` etc. |
| `src/app/utils/schedulingUtils.ts` | `getDayChips()`, `getTimestamp(date, hour)`, `formatScheduledDate(ts)`, `sameDay(a, b)` |
| `src/app/utils/sendMessage.ts` | `sendMessage<T>(type, payload?): Promise<T>` — typed postMessage helper with timeout |
| `index.html` | Vite entry HTML — references `/src/app/index.tsx` |
| `package.json` | Dependencies + `build`, `test`, `typecheck` scripts |
| `vite.config.ts` | Dual-mode: default builds SolidJS app (singlefile); `--mode plugin` builds plugin.ts as IIFE |
| `tsconfig.json` | App TypeScript config (SolidJS JSX, noEmit) |

---

## Task 1: Scaffold project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `public/manifest.json`
- Create: `src/app/index.tsx` (stub)
- Create: `src/app/App.tsx` (stub)
- Create: `src/plugin.ts` (stub)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "superproductivity-estimate-plugin",
  "version": "1.0.0",
  "description": "Rapidly edit task estimates and schedule start times",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && vite build --mode plugin",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "@solidjs/testing-library": "^0.8.10",
    "@super-productivity/plugin-api": "latest",
    "@testing-library/dom": "^10.0.0",
    "@types/node": "^22.0.0",
    "jsdom": "^27.0.0",
    "solid-js": "^1.9.0",
    "typescript": "^5.9.0",
    "vite": "^7.0.0",
    "vite-plugin-solid": "^2.11.0",
    "vite-plugin-singlefile": "^2.0.0",
    "vitest": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'plugin') {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/plugin.ts'),
          formats: ['iife' as const],
          name: '_sp',
          fileName: () => 'plugin.js',
        },
        outDir: 'dist',
        emptyOutDir: false,
        minify: false,
      },
    };
  }

  return {
    plugins: [solidPlugin(), viteSingleFile()],
    build: {
      target: 'esnext',
      outDir: 'dist',
      emptyOutDir: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      transformMode: { web: [/\.[jt]sx?$/] },
    },
    resolve: {
      conditions: ['development', 'browser'],
    },
  };
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src/app/**/*", "tests/**/*", "src/plugin.ts"]
}
```

- [ ] **Step 4: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Estimate &amp; Scheduler</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/index.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `public/manifest.json`**

```json
{
  "id": "estimate-scheduler",
  "name": "Estimate & Scheduler",
  "version": "1.0.0",
  "manifestVersion": 1,
  "minSupVersion": "14.0.0",
  "description": "Rapidly edit task estimates and schedule start times across all projects",
  "iFrame": true,
  "sidePanel": true,
  "permissions": ["getTasks", "getAllProjects", "updateTask"],
  "hooks": ["anyTaskUpdate"]
}
```

- [ ] **Step 6: Create stub `src/app/App.tsx`**

```tsx
function App() {
  return <div class="app">Loading...</div>;
}

export default App;
```

- [ ] **Step 7: Create stub `src/app/index.tsx`**

```tsx
import { render } from 'solid-js/web';
import App from './App';

const root = document.getElementById('root');
if (root) {
  render(() => <App />, root);
}
```

- [ ] **Step 8: Create stub `src/plugin.ts`**

```ts
import type { PluginAPI } from '@super-productivity/plugin-api';

declare const plugin: PluginAPI;

plugin.log.info('Estimate & Scheduler plugin initialized');
```

- [ ] **Step 9: Install dependencies**

Run: `mise exec -- npm install`

Expected: `node_modules/` created, no errors. (On VPN: if SSL fails, the combined CA bundle should handle it — check `NODE_EXTRA_CA_CERTS` is set.)

- [ ] **Step 10: Verify typecheck passes**

Run: `mise exec -- npm run typecheck`

Expected: no errors (stubs have minimal content, nothing to type-check yet).

- [ ] **Step 11: Commit scaffold**

```bash
git add package.json vite.config.ts tsconfig.json index.html public/manifest.json src/
git commit -m "chore: scaffold TypeScript + SolidJS plugin project"
```

---

## Task 2: `formatTime` utility

**Files:**
- Create: `src/app/utils/formatTime.ts`
- Create: `tests/formatTime.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/formatTime.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { formatTime } from '../src/app/utils/formatTime';

describe('formatTime', () => {
  test('returns — for zero', () => {
    expect(formatTime(0)).toBe('—');
  });

  test('returns — for negative', () => {
    expect(formatTime(-1000)).toBe('—');
  });

  test('returns minutes only when under an hour', () => {
    expect(formatTime(30 * 60 * 1000)).toBe('30m');
  });

  test('returns hours only when no remaining minutes', () => {
    expect(formatTime(2 * 60 * 60 * 1000)).toBe('2h');
  });

  test('returns hours and minutes', () => {
    expect(formatTime(90 * 60 * 1000)).toBe('1h 30m');
  });

  test('rounds sub-minute amounts up', () => {
    // 45s rounds to 1m
    expect(formatTime(45 * 1000)).toBe('1m');
  });

  test('returns — when sub-minute rounds to zero', () => {
    // 20s rounds to 0m → treated as zero
    expect(formatTime(20 * 1000)).toBe('—');
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `mise exec -- npm test -- tests/formatTime.test.ts`

Expected: FAIL — `Cannot find module '../src/app/utils/formatTime'`

- [ ] **Step 3: Implement `src/app/utils/formatTime.ts`**

```ts
export function formatTime(ms: number): string {
  if (ms <= 0) return '—';
  const totalMinutes = Math.round(ms / 60_000);
  if (totalMinutes === 0) return '—';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
```

- [ ] **Step 4: Run tests — expect all pass**

Run: `mise exec -- npm test -- tests/formatTime.test.ts`

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/utils/formatTime.ts tests/formatTime.test.ts
git commit -m "feat: add formatTime utility with tests"
```

---

## Task 3: `schedulingUtils` utility

**Files:**
- Create: `src/app/utils/schedulingUtils.ts`
- Create: `tests/schedulingUtils.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/schedulingUtils.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import {
  getDayChips,
  getTimestamp,
  formatScheduledDate,
  sameDay,
} from '../src/app/utils/schedulingUtils';

describe('getDayChips', () => {
  test('returns 7 chips', () => {
    expect(getDayChips()).toHaveLength(7);
  });

  test('first chip is Today', () => {
    expect(getDayChips()[0].label).toBe('Today');
  });

  test('second chip is Tomorrow', () => {
    expect(getDayChips()[1].label).toBe('Tomorrow');
  });

  test('remaining chips are day names', () => {
    const chips = getDayChips();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 2; i < 7; i++) {
      expect(dayNames).toContain(chips[i].label);
    }
  });

  test('chip dates are consecutive from today', () => {
    const chips = getDayChips();
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      expect(chips[i].date.getDate()).toBe(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + i).getDate()
      );
    }
  });
});

describe('getTimestamp', () => {
  test('returns correct unix ms for given date and hour', () => {
    const date = new Date(2026, 3, 22); // April 22 2026
    const ts = getTimestamp(date, 9);
    const result = new Date(ts);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(3);
    expect(result.getDate()).toBe(22);
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  test('handles midnight (hour 0)', () => {
    const date = new Date(2026, 3, 22);
    const ts = getTimestamp(date, 0);
    expect(new Date(ts).getHours()).toBe(0);
  });
});

describe('formatScheduledDate', () => {
  test('formats Wednesday afternoon', () => {
    // April 22 2026 is a Wednesday
    const ts = new Date(2026, 3, 22, 15, 0, 0).getTime();
    expect(formatScheduledDate(ts)).toBe('Wed 15:00');
  });

  test('pads single-digit hours', () => {
    const ts = new Date(2026, 3, 22, 9, 0, 0).getTime();
    expect(formatScheduledDate(ts)).toBe('Wed 09:00');
  });
});

describe('sameDay', () => {
  test('returns true for same date', () => {
    const a = new Date(2026, 3, 22, 9, 0, 0);
    const b = new Date(2026, 3, 22, 15, 0, 0);
    expect(sameDay(a, b)).toBe(true);
  });

  test('returns false for different dates', () => {
    const a = new Date(2026, 3, 22);
    const b = new Date(2026, 3, 23);
    expect(sameDay(a, b)).toBe(false);
  });

  test('returns false for same day different month', () => {
    const a = new Date(2026, 3, 22);
    const b = new Date(2026, 4, 22);
    expect(sameDay(a, b)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `mise exec -- npm test -- tests/schedulingUtils.test.ts`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/app/utils/schedulingUtils.ts`**

```ts
export interface DayChip {
  label: string;
  date: Date; // midnight local time on that day
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function getDayChips(): DayChip[] {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY_NAMES[d.getDay()];
    return { label, date: d };
  });
}

export function getTimestamp(date: Date, hour: number): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    0,
    0,
    0,
  ).getTime();
}

export function formatScheduledDate(dueWithTime: number): string {
  const d = new Date(dueWithTime);
  const day = DAY_NAMES[d.getDay()];
  const hour = String(d.getHours()).padStart(2, '0');
  return `${day} ${hour}:00`;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
```

- [ ] **Step 4: Run tests — expect all pass**

Run: `mise exec -- npm test -- tests/schedulingUtils.test.ts`

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/utils/schedulingUtils.ts tests/schedulingUtils.test.ts
git commit -m "feat: add schedulingUtils with tests"
```

---

## Task 4: `sendMessage` utility + `plugin.ts`

**Files:**
- Create: `src/app/utils/sendMessage.ts`
- Modify: `src/plugin.ts`

- [ ] **Step 1: Implement `src/app/utils/sendMessage.ts`**

```ts
export async function sendMessage<T = unknown>(
  type: string,
  payload?: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const messageId = Math.random().toString(36).slice(2, 11);

    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error(`sendMessage timeout: ${type}`));
    }, 10_000);

    const handler = (event: MessageEvent) => {
      if (event.data?.messageId !== messageId) return;
      clearTimeout(timeout);
      window.removeEventListener('message', handler);
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.response as T);
    };

    window.addEventListener('message', handler);
    window.parent.postMessage({ type, payload, messageId }, '*');
  });
}
```

- [ ] **Step 2: Implement `src/plugin.ts`**

Replace the stub with the full implementation. Note: uses `'anyTaskUpdate'` string literal instead of the enum to avoid bundling PluginHooks — Vite IIFE mode inlines the string directly.

```ts
import type { PluginAPI } from '@super-productivity/plugin-api';

declare const plugin: PluginAPI;

plugin.log.info('Estimate & Scheduler plugin initialized');

plugin.registerHeaderButton({
  icon: 'schedule',
  label: 'Estimates & Schedule',
  onClick: () => plugin.showIndexHtmlAsView(),
});

plugin.registerShortcut({
  id: 'open-estimate-plugin',
  label: 'Open Estimates & Scheduler',
  onExec: () => plugin.showIndexHtmlAsView(),
});

// Notify iframe when any task changes so it can re-fetch
plugin.registerHook('anyTaskUpdate' as Parameters<typeof plugin.registerHook>[0], () => {
  const iframe = document.querySelector(
    'iframe[data-plugin-iframe]',
  ) as HTMLIFrameElement | null;
  iframe?.contentWindow?.postMessage({ type: 'tasksUpdated' }, '*');
});

if (plugin.onMessage) {
  plugin.onMessage(async (message: unknown) => {
    const msg = message as { type: string; payload?: any };
    switch (msg?.type) {
      case 'getTasks':
        return await plugin.getTasks();
      case 'getAllProjects':
        return await plugin.getAllProjects();
      case 'updateTask':
        await plugin.updateTask(msg.payload.id, msg.payload.updates);
        return { success: true };
      case 'showSnack':
        plugin.showSnack(msg.payload);
        return { success: true };
      default:
        return { error: `Unknown message type: ${msg?.type}` };
    }
  });
}
```

- [ ] **Step 3: Verify typecheck**

Run: `mise exec -- npm run typecheck`

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/utils/sendMessage.ts src/plugin.ts
git commit -m "feat: add sendMessage helper and implement plugin.ts"
```

---

## Task 5: `EstimateButtons` component

**Files:**
- Create: `src/app/components/EstimateButtons.tsx`
- Create: `tests/components/EstimateButtons.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/EstimateButtons.test.tsx`:

```tsx
import { describe, expect, test, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { EstimateButtons } from '../../src/app/components/EstimateButtons';

const MIN = 60_000;
const HOUR = 60 * MIN;

describe('EstimateButtons', () => {
  test('displays current estimate', () => {
    const { getByText } = render(() => (
      <EstimateButtons estimate={30 * MIN} onUpdate={() => {}} />
    ));
    expect(getByText('30m')).toBeTruthy();
  });

  test('displays — when estimate is 0', () => {
    const { getByText } = render(() => (
      <EstimateButtons estimate={0} onUpdate={() => {}} />
    ));
    expect(getByText('—')).toBeTruthy();
  });

  test('calls onUpdate with incremented value on +15m click', () => {
    const onUpdate = vi.fn();
    const { getByText } = render(() => (
      <EstimateButtons estimate={30 * MIN} onUpdate={onUpdate} />
    ));
    fireEvent.click(getByText('+15m'));
    expect(onUpdate).toHaveBeenCalledWith(45 * MIN);
  });

  test('calls onUpdate with decremented value on −15m click', () => {
    const onUpdate = vi.fn();
    const { getByText } = render(() => (
      <EstimateButtons estimate={30 * MIN} onUpdate={onUpdate} />
    ));
    fireEvent.click(getByText('−15m'));
    expect(onUpdate).toHaveBeenCalledWith(15 * MIN);
  });

  test('floors at 0 when decrement exceeds current estimate', () => {
    const onUpdate = vi.fn();
    const { getByText } = render(() => (
      <EstimateButtons estimate={5 * MIN} onUpdate={onUpdate} />
    ));
    fireEvent.click(getByText('−30m'));
    expect(onUpdate).toHaveBeenCalledWith(0);
  });

  test('minus buttons are disabled when estimate is 0', () => {
    const { getByText } = render(() => (
      <EstimateButtons estimate={0} onUpdate={() => {}} />
    ));
    expect((getByText('−5m') as HTMLButtonElement).disabled).toBe(true);
    expect((getByText('−15m') as HTMLButtonElement).disabled).toBe(true);
    expect((getByText('−5h') as HTMLButtonElement).disabled).toBe(true);
  });

  test('plus buttons are never disabled', () => {
    const { getByText } = render(() => (
      <EstimateButtons estimate={0} onUpdate={() => {}} />
    ));
    expect((getByText('+5m') as HTMLButtonElement).disabled).toBe(false);
  });

  test('does not call onUpdate when disabled button is clicked', () => {
    const onUpdate = vi.fn();
    const { getByText } = render(() => (
      <EstimateButtons estimate={0} onUpdate={onUpdate} />
    ));
    fireEvent.click(getByText('−5m'));
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `mise exec -- npm test -- tests/components/EstimateButtons.test.tsx`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/app/components/EstimateButtons.tsx`**

```tsx
import { Component, For } from 'solid-js';
import { formatTime } from '../utils/formatTime';

interface Props {
  estimate: number; // milliseconds
  onUpdate: (newEstimate: number) => void;
}

interface Increment {
  label: string;
  ms: number;
}

const DECREMENTS: Increment[] = [
  { label: '−5h', ms: -5 * 60 * 60_000 },
  { label: '−1h', ms: -60 * 60_000 },
  { label: '−30m', ms: -30 * 60_000 },
  { label: '−15m', ms: -15 * 60_000 },
  { label: '−5m', ms: -5 * 60_000 },
];

const INCREMENTS: Increment[] = [
  { label: '+5m', ms: 5 * 60_000 },
  { label: '+15m', ms: 15 * 60_000 },
  { label: '+30m', ms: 30 * 60_000 },
  { label: '+1h', ms: 60 * 60_000 },
  { label: '+5h', ms: 5 * 60 * 60_000 },
];

export const EstimateButtons: Component<Props> = (props) => {
  const handleClick = (e: MouseEvent, deltaMs: number) => {
    e.stopPropagation();
    const next = Math.max(0, props.estimate + deltaMs);
    props.onUpdate(next);
  };

  return (
    <div class="estimate-buttons" onClick={(e) => e.stopPropagation()}>
      <For each={DECREMENTS}>
        {(inc) => (
          <button
            class="btn-increment"
            disabled={props.estimate === 0}
            onClick={(e) => handleClick(e, inc.ms)}
          >
            {inc.label}
          </button>
        )}
      </For>
      <span class="estimate-value">{formatTime(props.estimate)}</span>
      <For each={INCREMENTS}>
        {(inc) => (
          <button
            class="btn-increment"
            onClick={(e) => handleClick(e, inc.ms)}
          >
            {inc.label}
          </button>
        )}
      </For>
    </div>
  );
};
```

- [ ] **Step 4: Run tests — expect all pass**

Run: `mise exec -- npm test -- tests/components/EstimateButtons.test.tsx`

Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/components/EstimateButtons.tsx tests/components/EstimateButtons.test.tsx
git commit -m "feat: add EstimateButtons component with tests"
```

---

## Task 6: `StartTimePicker` component

**Files:**
- Create: `src/app/components/StartTimePicker.tsx`
- Create: `tests/components/StartTimePicker.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/StartTimePicker.test.tsx`:

```tsx
import { describe, expect, test, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { StartTimePicker } from '../../src/app/components/StartTimePicker';

describe('StartTimePicker', () => {
  test('renders 7 day chips', () => {
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={() => {}} onClear={() => {}} />
    ));
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Tomorrow')).toBeTruthy();
  });

  test('renders 4 time presets', () => {
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={() => {}} onClear={() => {}} />
    ));
    expect(getByText('Morning')).toBeTruthy();
    expect(getByText('Noon')).toBeTruthy();
    expect(getByText('Afternoon')).toBeTruthy();
    expect(getByText('Evening')).toBeTruthy();
  });

  test('time presets are disabled before a day is selected', () => {
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={() => {}} onClear={() => {}} />
    ));
    expect((getByText('Morning') as HTMLButtonElement).disabled).toBe(true);
    expect((getByText('Evening') as HTMLButtonElement).disabled).toBe(true);
  });

  test('time presets enable after clicking a day chip', () => {
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={() => {}} onClear={() => {}} />
    ));
    fireEvent.click(getByText('Today'));
    expect((getByText('Morning') as HTMLButtonElement).disabled).toBe(false);
  });

  test('calls onUpdate with correct timestamp when day + time selected', () => {
    const onUpdate = vi.fn();
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={onUpdate} onClear={() => {}} />
    ));
    fireEvent.click(getByText('Today'));
    fireEvent.click(getByText('Morning'));
    expect(onUpdate).toHaveBeenCalledOnce();
    const ts: number = onUpdate.mock.calls[0][0];
    const d = new Date(ts);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(0);
  });

  test('calls onClear when Clear is clicked', () => {
    const onClear = vi.fn();
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={null} onUpdate={() => {}} onClear={onClear} />
    ));
    fireEvent.click(getByText('Clear'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  test('pre-selects day chip matching existing dueWithTime', () => {
    // April 22 2026 15:00 — a Wednesday
    const ts = new Date(2026, 3, 22, 15, 0, 0).getTime();
    const { getByText } = render(() => (
      <StartTimePicker dueWithTime={ts} onUpdate={() => {}} onClear={() => {}} />
    ));
    // Afternoon should be enabled (day is already set)
    expect((getByText('Afternoon') as HTMLButtonElement).disabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

Run: `mise exec -- npm test -- tests/components/StartTimePicker.test.tsx`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/app/components/StartTimePicker.tsx`**

```tsx
import { Component, createEffect, createSignal, For } from 'solid-js';
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

  const dateFromDueWithTime = () => {
    if (!props.dueWithTime) return null;
    const d = new Date(props.dueWithTime);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

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
```

- [ ] **Step 4: Run tests — expect all pass**

Run: `mise exec -- npm test -- tests/components/StartTimePicker.test.tsx`

Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/components/StartTimePicker.tsx tests/components/StartTimePicker.test.tsx
git commit -m "feat: add StartTimePicker component with tests"
```

---

## Task 7: `TaskRow` component

**Files:**
- Create: `src/app/components/TaskRow.tsx`
- Create: `tests/components/TaskRow.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/components/TaskRow.test.tsx`:

```tsx
import { describe, expect, test, vi } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { TaskRow } from '../../src/app/components/TaskRow';
import type { Task } from '@super-productivity/plugin-api';

const MIN = 60_000;
const HOUR = 60 * MIN;

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
```

- [ ] **Step 2: Run tests — expect failures**

Run: `mise exec -- npm test -- tests/components/TaskRow.test.tsx`

Expected: FAIL — module not found

- [ ] **Step 3: Implement `src/app/components/TaskRow.tsx`**

```tsx
import { Component, Show } from 'solid-js';
import type { Task } from '@super-productivity/plugin-api';
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
```

- [ ] **Step 4: Run tests — expect all pass**

Run: `mise exec -- npm test -- tests/components/TaskRow.test.tsx`

Expected: 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/components/TaskRow.tsx tests/components/TaskRow.test.tsx
git commit -m "feat: add TaskRow component with tests"
```

---

## Task 8: `ProjectGroup` component

**Files:**
- Create: `src/app/components/ProjectGroup.tsx`

No dedicated unit test — `ProjectGroup` is a thin composition of `TaskRow`. Its logic (subtask flattening) is exercised in the App integration.

- [ ] **Step 1: Implement `src/app/components/ProjectGroup.tsx`**

```tsx
import { Component, createMemo, createSignal, For, Show } from 'solid-js';
import type { Task } from '@super-productivity/plugin-api';
import { TaskRow } from './TaskRow';

interface FlatRow {
  task: Task;
  isSubtask: boolean;
  parentTitle: string | undefined;
}

interface Props {
  projectTitle: string;
  tasks: Task[]; // top-level tasks only
  taskMap: Map<string, Task>;
  showDone: boolean;
  expandedTaskId: string | null;
  onToggleExpand: (taskId: string) => void;
  onEstimateUpdate: (taskId: string, newEstimate: number) => void;
  onScheduleUpdate: (taskId: string, timestamp: number) => Promise<void>;
  onScheduleClear: (taskId: string) => Promise<void>;
}

export const ProjectGroup: Component<Props> = (props) => {
  const [collapsed, setCollapsed] = createSignal(false);

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
      <div class="project-header" onClick={() => setCollapsed((c) => !c)}>
        <span class="project-collapse-icon">{collapsed() ? '▶' : '▼'}</span>
        <span class="project-title">{props.projectTitle}</span>
        <span class="project-task-count">({props.tasks.length})</span>
      </div>
      <Show when={!collapsed()}>
        <For each={flatRows()}>
          {(row) => (
            <TaskRow
              task={row.task}
              isSubtask={row.isSubtask}
              parentTitle={row.parentTitle}
              isExpanded={props.expandedTaskId === row.task.id}
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
```

- [ ] **Step 2: Verify typecheck**

Run: `mise exec -- npm run typecheck`

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/components/ProjectGroup.tsx
git commit -m "feat: add ProjectGroup component"
```

---

## Task 9: `App.tsx` + `App.css`

**Files:**
- Modify: `src/app/App.tsx` (replace stub)
- Create: `src/app/App.css`

- [ ] **Step 1: Implement `src/app/App.css`**

```css
.app {
  font-family: var(--font-primary-stack, system-ui, sans-serif);
  color: var(--text-color, #333);
  max-width: 960px;
  margin: 0 auto;
  padding: var(--s3, 24px);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--s3, 24px);
}

.app-header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.show-done-toggle {
  display: flex;
  align-items: center;
  gap: var(--s, 8px);
  color: var(--text-color-muted, #999);
  cursor: pointer;
  font-size: 0.875rem;
}

.loading {
  text-align: center;
  padding: var(--s4, 32px);
  color: var(--text-color-muted, #999);
}

/* Project group */
.project-group {
  margin-bottom: var(--s3, 24px);
}

.project-header {
  display: flex;
  align-items: center;
  gap: var(--s, 8px);
  cursor: pointer;
  padding: var(--s-half, 4px) 0;
  border-bottom: 2px solid var(--divider-color, #ddd);
  margin-bottom: var(--s, 8px);
  color: var(--text-color-muted, #999);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  user-select: none;
}

.project-collapse-icon {
  font-size: 0.65rem;
}

/* Task row */
.task-row {
  border-bottom: 1px solid var(--divider-color, #eee);
}

.task-row-main {
  display: flex;
  align-items: center;
  gap: var(--s, 8px);
  padding: var(--s, 8px) 0;
}

.task-row-main.is-subtask {
  padding-left: var(--s3, 24px);
}

.task-title {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.task-title-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
}

.task-parent-label {
  font-size: 0.72rem;
  color: var(--text-color-muted, #999);
  margin-top: 2px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: var(--s, 8px);
  font-size: 0.8rem;
  color: var(--text-color-muted, #999);
  white-space: nowrap;
  cursor: pointer;
}

.scheduled-badge {
  font-size: 0.72rem;
  background: var(--c-primary, #3f51b5);
  color: #fff;
  padding: 2px var(--s, 8px);
  border-radius: 10px;
}

.time-logged {
  min-width: 36px;
  text-align: right;
}

/* Estimate buttons */
.estimate-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.btn-increment {
  background: var(--card-bg, #f5f5f5);
  border: 1px solid var(--divider-color, #ddd);
  border-radius: 3px;
  padding: 2px 5px;
  font-size: 0.72rem;
  cursor: pointer;
  white-space: nowrap;
  line-height: 1.4;
}

.btn-increment:hover:not(:disabled) {
  background: var(--c-primary, #3f51b5);
  color: #fff;
  border-color: var(--c-primary, #3f51b5);
}

.btn-increment:disabled {
  opacity: 0.25;
  cursor: default;
}

.estimate-value {
  padding: 2px 6px;
  font-weight: 600;
  min-width: 44px;
  text-align: center;
  font-size: 0.8rem;
  white-space: nowrap;
}

/* Start time picker */
.start-time-picker {
  padding: var(--s, 8px) 0 var(--s2, 16px) 0;
  border-top: 1px dashed var(--divider-color, #eee);
}

.picker-row {
  display: flex;
  align-items: center;
  gap: var(--s, 8px);
  flex-wrap: wrap;
  margin-bottom: var(--s, 8px);
}

.chip {
  background: var(--card-bg, #f5f5f5);
  border: 1px solid var(--divider-color, #ddd);
  border-radius: 14px;
  padding: 4px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

.chip.active {
  background: var(--c-primary, #3f51b5);
  color: #fff;
  border-color: var(--c-primary, #3f51b5);
}

.chip:disabled {
  opacity: 0.3;
  cursor: default;
}

.btn-clear {
  background: transparent;
  border: 1px solid var(--c-warn, #f44336);
  color: var(--c-warn, #f44336);
  border-radius: 3px;
  padding: 4px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  margin-left: auto;
}

.btn-clear:hover {
  background: var(--c-warn, #f44336);
  color: #fff;
}
```

- [ ] **Step 2: Implement `src/app/App.tsx`**

```tsx
import { createMemo, createSignal, For, onMount, Show } from 'solid-js';
import type { Project, Task } from '@super-productivity/plugin-api';
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
    // Top-level: no parentId, or parentId points to a task not in the map
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
```

- [ ] **Step 3: Verify typecheck**

Run: `mise exec -- npm run typecheck`

Expected: no errors

- [ ] **Step 4: Run all tests**

Run: `mise exec -- npm test`

Expected: all tests pass (Task 2–7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/App.tsx src/app/App.css
git commit -m "feat: implement App root with grouped task list and state management"
```

---

## Task 10: Build `dist/` and verify

**Files:**
- Modify: `src/app/index.tsx` (confirm final — no change needed if stub matches)
- Create: `dist/` (generated)

- [ ] **Step 1: Confirm `src/app/index.tsx` is correct**

The file should contain exactly:

```tsx
import { render } from 'solid-js/web';
import App from './App';

const root = document.getElementById('root');
if (root) {
  render(() => <App />, root);
}
```

- [ ] **Step 2: Run the full build**

Run: `mise exec -- npm run build`

Expected output (two sequential Vite builds):
```
vite v7.x.x building for production...
✓ built in ...ms
vite v7.x.x building for production (plugin mode)...
✓ built in ...ms
```

If build fails with a Rollup error about `plugin` not being defined: `plugin` is a global injected by SP at runtime — this is expected. Add `globals: { plugin: 'plugin' }` to the `plugin` mode `rollupOptions` in `vite.config.ts` if Rollup warns about it:

```ts
// In the mode === 'plugin' branch of vite.config.ts, update the return:
rollupOptions: {
  external: ['plugin'],
  output: {
    globals: { plugin: 'plugin' },
  },
},
```

Wait — that would make `plugin` an external, but it's not imported, it's a global. Remove `external` and just declare it as a global in the IIFE wrapper. Since `plugin` is not imported in plugin.ts (only `import type`), Rollup won't complain. No changes needed.

- [ ] **Step 3: Verify `dist/` contents**

Run: `ls dist/`

Expected:
```
dist/
├── index.html      (SolidJS app, all assets inlined)
├── manifest.json   (copied from public/)
└── plugin.js       (compiled from src/plugin.ts)
```

If `plugin.js` is missing, the second Vite build failed. Check `vite.config.ts` mode detection.

If `manifest.json` is missing from `dist/`, the `public/manifest.json` wasn't copied. Verify the file is in `public/` (not `src/`).

- [ ] **Step 4: Verify `dist/index.html` is self-contained**

Run: `grep -c '<script' dist/index.html`

Expected: at least 1 (the inlined app script). There should be no `src=` attributes on script tags — `vite-plugin-singlefile` inlines everything.

Run: `grep 'src=' dist/index.html`

Expected: no output (no external script references)

- [ ] **Step 5: Commit `dist/`**

```bash
git add dist/
git commit -m "build: add compiled dist for direct SP plugin loading"
```

- [ ] **Step 6: Load and test in SP**

1. Open Super Productivity (or https://test-app.super-productivity.com/)
2. Go to **Settings → Plugins → Load Plugin from Folder**
3. Select the `dist/` folder (or the repo root if SP reads `manifest.json` from the root — try both)
4. Open browser DevTools (F12) and check the Console for errors
5. Click the **Estimates & Schedule** header button — the plugin view should open
6. Verify: tasks load grouped by project, ±buttons are clickable, clicking a row expands the start-time picker, day chips + time presets are functional
7. Verify: changing an estimate in the plugin view updates the task in the main SP view

- [ ] **Step 7: Commit any fixes found during SP testing**

If SP requires the manifest at the repo root rather than in `dist/`, copy it: `cp public/manifest.json ./manifest.json` and commit. If other minor issues appear, fix and commit with `fix: <description>`.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| TypeScript + Vite + SolidJS | Task 1 |
| plugin.ts registers header button + shortcut | Task 4 |
| plugin.ts handles getTasks, getAllProjects, updateTask via onMessage | Task 4 |
| ANY_TASK_UPDATE hook → iframe refresh | Task 4 |
| sendMessage typed postMessage helper | Task 4 |
| formatTime utility | Task 2 |
| getDayChips, getTimestamp, formatScheduledDate, sameDay | Task 3 |
| EstimateButtons: −5h −1h −30m −15m −5m [value] +5m +15m +30m +1h +5h | Task 5 |
| Estimate floor at 0, buttons disabled at 0 | Task 5 |
| Optimistic estimate update with revert on failure | Task 9 |
| StartTimePicker: 7 day chips | Task 6 |
| StartTimePicker: Morning/Noon/Afternoon/Evening presets | Task 6 |
| Time presets disabled until day selected | Task 6 |
| Set dueWithTime on task | Task 6/9 |
| Clear button sets dueWithTime: null | Task 6/9 |
| TaskRow: title, parent label, logged time, estimate strip, scheduled badge | Task 7 |
| Expand/collapse picker per row | Task 7/9 |
| ProjectGroup: collapsible, flattens subtasks | Task 8 |
| All projects shown, grouped by project title | Task 9 |
| Inbox group for tasks with no project | Task 9 |
| Show/hide done tasks toggle | Task 9 |
| Build produces self-contained dist/ | Task 10 |
| showSnack message handler in plugin.ts | Task 4 |

All spec requirements are covered. ✓
