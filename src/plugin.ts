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
  console.log('[plugin] onMessage handler registered');
  (PluginAPI as any).onMessage(async (message: unknown) => {
    const msg = message as { type: string; payload?: any };
    console.log('[plugin] received message:', msg);
    let result: unknown;
    switch (msg?.type) {
      case 'getTasks':
        result = await PluginAPI.getTasks();
        console.log('[plugin] getTasks result:', result);
        return result;
      case 'getAllProjects':
        result = await PluginAPI.getAllProjects();
        console.log('[plugin] getAllProjects result:', result);
        return result;
      case 'updateTask':
        await PluginAPI.updateTask(msg.payload.id, msg.payload.updates);
        console.log('[plugin] updateTask done:', msg.payload);
        return { success: true };
      case 'showSnack':
        (PluginAPI as any).showSnack(msg.payload);
        return { success: true };
      default:
        console.warn('[plugin] unknown message type:', msg?.type);
        return { error: `Unknown message type: ${msg?.type}` };
    }
  });
} else {
  console.error('[plugin] PluginAPI.onMessage is not available — bridge will not work');
}
