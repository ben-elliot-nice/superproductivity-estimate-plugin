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
  const iframe = document.querySelector(
    'iframe[data-plugin-iframe]',
  ) as HTMLIFrameElement | null;
  iframe?.contentWindow?.postMessage({ type: 'tasksUpdated' }, '*');
});

PluginAPI.registerMenuEntry({
      label: 'Estimates and Scheduler',
      icon: 'dashboard',
      onClick: () => {
        PluginAPI.showIndexHtmlAsView();
      }
    });

if ((PluginAPI as any).onMessage) {
  (PluginAPI as any).onMessage(async (message: unknown) => {
    const msg = message as { type: string; payload?: any };
    switch (msg?.type) {
      case 'getTasks':
        return await PluginAPI.getTasks();
      case 'getAllProjects':
        return await PluginAPI.getAllProjects();
      case 'updateTask':
        await PluginAPI.updateTask(msg.payload.id, msg.payload.updates);
        return { success: true };
      case 'showSnack':
        (PluginAPI as any).showSnack(msg.payload);
        return { success: true };
      default:
        return { error: `Unknown message type: ${msg?.type}` };
    }
  });
}
