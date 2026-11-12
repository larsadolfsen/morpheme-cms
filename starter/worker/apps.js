// Written by packages/editor/lib/apps.mjs (writeAppWorkers): the part of the Worker of each app
// that has one (src/apps/<app>/worker.js), and its texts. Don't edit it; `npx morpheme app-workers` writes it again.

export const appWorkers = {};

export const appTexts = {};

// The MCP server of each connector (`mcp` in its app.json), for worker/mcp-client.js.
export const appMcp = {};

// The media providers of each app (`mediaProviders` in its app.json) and its hosts, for worker/media-providers.js.
export const appMedia = {};
