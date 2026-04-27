(function() {
  "use strict";
  plugin.registerHeaderButton({
    icon: "schedule",
    label: "Estimates & Schedule",
    onClick: () => plugin.showIndexHtmlAsView()
  });
  plugin.registerShortcut({
    id: "open-estimate-plugin",
    label: "Open Estimates & Scheduler",
    onExec: () => plugin.showIndexHtmlAsView()
  });
  plugin.registerHook("anyTaskUpdate", () => {
    const iframe = document.querySelector(
      "iframe[data-plugin-iframe]"
    );
    iframe?.contentWindow?.postMessage({ type: "tasksUpdated" }, "*");
  });
  if (plugin.onMessage) {
    plugin.onMessage(async (message) => {
      const msg = message;
      switch (msg?.type) {
        case "getTasks":
          return await plugin.getTasks();
        case "getAllProjects":
          return await plugin.getAllProjects();
        case "updateTask":
          await plugin.updateTask(msg.payload.id, msg.payload.updates);
          return { success: true };
        case "showSnack":
          plugin.showSnack(msg.payload);
          return { success: true };
        default:
          return { error: `Unknown message type: ${msg?.type}` };
      }
    });
  }
})();
