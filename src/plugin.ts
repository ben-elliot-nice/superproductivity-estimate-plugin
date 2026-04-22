import type { PluginAPI } from '@super-productivity/plugin-api';

declare const plugin: PluginAPI;

// Plugin entry point — SP injects `plugin` global at runtime
void (plugin satisfies PluginAPI);
