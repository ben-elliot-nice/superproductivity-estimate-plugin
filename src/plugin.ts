import type { PluginAPI } from '@super-productivity/plugin-api';

declare const PluginAPI: PluginAPI;

PluginAPI.registerHeaderButton({
  icon: 'schedule',
  label: 'Estimates & Schedule',
  onClick: () => PluginAPI.showIndexHtmlAsView(),
});

PluginAPI.registerShortcut({
  id: 'open-estimate-plugin',
  label: 'Open Estimates & Scheduler',
  onExec: () => PluginAPI.showIndexHtmlAsView(),
});

PluginAPI.registerMenuEntry({
  label: 'Estimates and Scheduler',
  icon: 'dashboard',
  onClick: () => {
    PluginAPI.showIndexHtmlAsView();
  }
});

// Debounced notify — coalesces rapid-fire hook events into a single re-fetch
let notifyTimer: ReturnType<typeof setTimeout> | null = null;
const notify = () => {
  if (notifyTimer) clearTimeout(notifyTimer);
  notifyTimer = setTimeout(() => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      iframe.contentWindow?.postMessage({ type: 'tasksUpdated' }, '*');
    });
    notifyTimer = null;
  }, 300);
};

// Register all task lifecycle hooks so any add/update/delete/complete triggers a re-fetch
const TASK_HOOKS = [
  'anyTaskUpdate',
  'taskAdd',
  'taskUpdate',
  'taskDelete',
  'taskComplete',
] as const;

TASK_HOOKS.forEach((hook) => {
  PluginAPI.registerHook(hook as Parameters<typeof PluginAPI.registerHook>[0], notify);
});
