// The JSON-RPC side of the MCP server (Streamable HTTP, one message at a time): initialize, ping, tools/list and tools/call.
// Exposes PROTOCOL_VERSIONS and handleMessage. Built against the MCP revision 2025-11-25 (the newest is first; 2025-06-18 and 2025-03-26 are also
// answered, by the spec's version negotiation). No dependencies, so the Worker can use it.

/** The protocol revisions answered, the newest first. */
export const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];

/** What a request without an MCP-Protocol-Version header is taken to be (2025-11-25, Streamable HTTP: protocol version header). */
export const DEFAULT_PROTOCOL_VERSION = '2025-03-26';

const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const fail = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const toolError = (id, text) => ok(id, { content: [{ type: 'text', text }], isError: true });

/**
 * The answer to one JSON-RPC message, or null for a notification (no answer). A tool that throws is a tool error that says
 * nothing of why; one that returns `{ error }` says that.
 * @param {unknown} message
 * @param {{ tools: object[], call: (name: string, args: Record<string, unknown>) => Promise<{ text?: string, data?: unknown, error?: string } | undefined> }} server
 */
export async function handleMessage(message, server) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return fail(null, -32600, 'Invalid request');
  const { id, method, params } = /** @type {Record<string, any>} */ (message);
  if (typeof method !== 'string') return fail(id, -32600, 'Invalid request');
  if (id === undefined) return null;
  switch (method) {
    case 'initialize': {
      const asked = params?.protocolVersion;
      return ok(id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
        capabilities: { tools: {} },
        serverInfo: { name: 'morpheme', title: 'Morpheme', version: '1' },
      });
    }
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: server.tools });
    case 'tools/call': {
      const name = params?.name;
      if (typeof name !== 'string' || !server.tools.some((t) => /** @type {any} */ (t).name === name))
        return fail(id, -32602, 'Unknown tool');
      const args = params.arguments && typeof params.arguments === 'object' && !Array.isArray(params.arguments) ? params.arguments : {};
      let done;
      try {
        done = await server.call(name, args);
      } catch {
        return toolError(id, 'The tool failed. Try again.');
      }
      if (!done) return fail(id, -32602, 'Unknown tool');
      if (done.error) return toolError(id, done.error);
      return ok(id, {
        content: [{ type: 'text', text: done.text ?? JSON.stringify(done.data ?? null) }],
        ...(done.data === undefined ? {} : { structuredContent: done.data }),
      });
    }
    default:
      return fail(id, -32601, 'Method not found');
  }
}
