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

// Notify iframe when any task changes so it can re-fetch
PluginAPI.registerHook('anyTaskUpdate' as Parameters<typeof PluginAPI.registerHook>[0], () => {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    iframe.contentWindow?.postMessage({ type: 'tasksUpdated' }, '*');
  });
});

PluginAPI.registerMenuEntry({
      label: 'Estimates and Scheduler',
      icon: 'dashboard',
      onClick: () => {
        PluginAPI.showIndexHtmlAsView();
      }
    });

