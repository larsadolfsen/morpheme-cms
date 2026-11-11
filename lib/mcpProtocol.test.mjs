// Tests for lib/mcpProtocol.mjs: the JSON-RPC side of the MCP server (initialize, tools/list, tools/call, errors).
import assert from 'node:assert/strict';
import test from 'node:test';
import { handleMessage, PROTOCOL_VERSIONS } from './mcpProtocol.mjs';

const tool = (name) => ({ name, description: name, inputSchema: { type: 'object' }, annotations: { readOnlyHint: true } });
const tools = ['echo', 'boom', 'refuse', 'gone'].map(tool);
const server = {
  tools,
  call: async (name, args) => {
    if (name === 'echo') return { text: `echo ${args.what}`, data: { what: args.what } };
    if (name === 'boom') throw new Error('secret internals');
    if (name === 'refuse') return { error: 'Not allowed' };
    return undefined;
  },
};
const rpc = (method, params, id = 1) => ({ jsonrpc: '2.0', id, method, params });

test('initialize answers with the version the client asked for, when supported, else the newest', async () => {
  const asked = await handleMessage(rpc('initialize', { protocolVersion: PROTOCOL_VERSIONS[1] }), server);
  assert.equal(asked.result.protocolVersion, PROTOCOL_VERSIONS[1]);
  const other = await handleMessage(rpc('initialize', { protocolVersion: '1999-01-01' }), server);
  assert.equal(other.result.protocolVersion, PROTOCOL_VERSIONS[0]);
  assert.deepEqual(Object.keys(other.result.capabilities), ['tools']);
  assert.equal(other.result.serverInfo.name, 'morpheme');
  assert.equal(other.id, 1);
  assert.equal(other.jsonrpc, '2.0');
});

test('tools/list gives the tools', async () => {
  const res = await handleMessage(rpc('tools/list'), server);
  assert.deepEqual(res.result.tools, tools);
});

test('tools/call gives text and structured data', async () => {
  const res = await handleMessage(rpc('tools/call', { name: 'echo', arguments: { what: 'hi' } }), server);
  assert.deepEqual(res.result.content, [{ type: 'text', text: 'echo hi' }]);
  assert.deepEqual(res.result.structuredContent, { what: 'hi' });
  assert.notEqual(res.result.isError, true);
});

test('a tool that refuses or fails is a tool error, and never leaks its message', async () => {
  const refused = await handleMessage(rpc('tools/call', { name: 'refuse', arguments: {} }), server);
  assert.equal(refused.result.isError, true);
  assert.equal(refused.result.content[0].text, 'Not allowed');
  const failed = await handleMessage(rpc('tools/call', { name: 'boom', arguments: {} }), server);
  assert.equal(failed.result.isError, true);
  assert.ok(!failed.result.content[0].text.includes('secret internals'));
});

test('an unknown tool, a bad call or an unknown method are protocol errors', async () => {
  assert.equal((await handleMessage(rpc('tools/call', { name: 'nope' }), server)).error.code, -32602);
  assert.equal((await handleMessage(rpc('tools/call', { name: 'gone' }), server)).error.code, -32602);
  assert.equal((await handleMessage(rpc('tools/call', {}), server)).error.code, -32602);
  assert.equal((await handleMessage(rpc('resources/list'), server)).error.code, -32601);
  assert.equal((await handleMessage({ id: 3 }, server)).error.code, -32600);
  assert.equal((await handleMessage('text', server)).error.code, -32600);
});

test('ping answers empty; notifications get no answer', async () => {
  assert.deepEqual((await handleMessage(rpc('ping'), server)).result, {});
  assert.equal(await handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }, server), null);
});

test('tools cannot write: nothing but read tools is listed in this batch', () => {
  for (const tool of tools) assert.equal(tool.annotations.readOnlyHint, true);
});
