import { toolRegistry } from "./tool.registry.js";
import { webSearchPlugin } from "./builtin/web-search.plugin.js";
import { marketIntelPlugin } from "./builtin/market-intel.plugin.js";
import { brainPlugin } from "./builtin/brain.plugin.js";
import { pdfDocumentPlugin } from "./builtin/pdf-document.plugin.js";

export function initializePlugins(): void {
  toolRegistry.registerPlugin(webSearchPlugin);
  toolRegistry.registerPlugin(marketIntelPlugin);
  toolRegistry.registerPlugin(brainPlugin);
  toolRegistry.registerPlugin(pdfDocumentPlugin);
}

export * from "./tool.types.js";
export * from "./tool.registry.js";
