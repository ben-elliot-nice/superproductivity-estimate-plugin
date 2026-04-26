import type { PluginAPI } from '@super-productivity/plugin-api';

declare const plugin: PluginAPI;

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

if ((plugin as any).onMessage) {
  (plugin as any).onMessage(async (message: unknown) => {
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
        (plugin as any).showSnack(msg.payload);
        return { success: true };
      default:
        return { error: `Unknown message type: ${msg?.type}` };
    }
  });
}
