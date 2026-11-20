// Tests for lib/sandbox/runner.mjs: app code runs in the QuickJS sandbox, gets its result back as data, and never
// reaches the host (no process, require, fetch, timers, host modules, host objects or shared state), within its limits.
// The code under test is written as plain ES module strings, the way a bundle reaches run().
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AFTER_BUILD_LIMITS, HOOK_LIMITS, run } from './runner.mjs';

/** Generous limits for cases that test behaviour, not limits. */
const LIMITS = { ms: 5000, memoryMb: 64, outputKb: 256 };

/**
 * Asserts a failed result of the given kind with a string message.
 * @param {import('./runner.mjs').RunResult} result
 * @param {'throw' | 'timeout' | 'memory' | 'output'} error
 */
function assertError(result, error) {
  assert.equal(result.ok, false, `expected error '${error}', got ${JSON.stringify(result)}`);
  assert.equal(result.error, error, `expected error '${error}', got ${JSON.stringify(result)}`);
  assert.equal(typeof result.message, 'string');
}

/**
 * Runs `code` and measures how long run() took.
 * @param {string} code
 * @param {unknown} input
 * @param {import('./runner.mjs').Helpers} helpers
 * @param {import('./runner.mjs').Limits} limits
 */
async function timed(code, input, helpers, limits) {
  const start = performance.now();
  const result = await run(code, input, helpers, limits);
  return { result, elapsed: performance.now() - start };
}

describe('limits', () => {
  it('HOOK_LIMITS match the spec', () => {
    assert.deepEqual({ ...HOOK_LIMITS }, { ms: 1000, memoryMb: 64, outputKb: 256 });
  });

  it('AFTER_BUILD_LIMITS match the spec', () => {
    assert.deepEqual({ ...AFTER_BUILD_LIMITS }, { ms: 30000, memoryMb: 256, outputKb: 5120 });
  });
});

describe('values', () => {
  it('returns the default export result for the input', async () => {
    const result = await run('export default (i) => i.a + 1', { a: 1 }, {}, LIMITS);
    assert.deepEqual(result, { ok: true, value: 2 });
  });

  it('returns a nested JSON value', async () => {
    const result = await run('export default (i) => ({ list: [i.n, "two", true, null], deep: { x: i.n * 2 } })', { n: 1 }, {}, LIMITS);
    assert.deepEqual(result, { ok: true, value: { list: [1, 'two', true, null], deep: { x: 2 } } });
  });

  it('returns undefined when the function returns nothing', async () => {
    const result = await run('export default () => {}', {}, {}, LIMITS);
    assert.deepEqual(result, { ok: true, value: undefined });
  });

  it('awaits an async default export', async () => {
    const result = await run('export default async (i) => { await null; return i.a * 3; }', { a: 2 }, {}, LIMITS);
    assert.deepEqual(result, { ok: true, value: 6 });
  });

  it('runs a module with top-level code and named helpers', async () => {
    const code = 'const K = 10;\nfunction add(a, b) { return a + b; }\nexport default function main(i) { return add(i.a, K); }';
    assert.deepEqual(await run(code, { a: 5 }, {}, LIMITS), { ok: true, value: 15 });
  });
});

describe('helpers', () => {
  it('awaits a helper whose host function returns a Promise', async () => {
    const helpers = { double: async (n) => /** @type {number} */ (n) * 2 };
    const result = await run('export default async (i, h) => await h.double(2)', {}, helpers, LIMITS);
    assert.deepEqual(result, { ok: true, value: 4 });
  });

  it('gets the value of a synchronous helper', async () => {
    const helpers = { add: (a, b) => /** @type {number} */ (a) + /** @type {number} */ (b) };
    const result = await run('export default async (i, h) => await h.add(2, 3)', {}, helpers, LIMITS);
    assert.deepEqual(result, { ok: true, value: 5 });
  });

  it('passes helper arguments to the host as JSON copies', async () => {
    /** @type {unknown[]} */
    const seen = [];
    const helpers = {
      take: (/** @type {unknown} */ arg) => {
        seen.push(arg);
        return null;
      },
    };
    const code = 'export default async (i, h) => { await h.take({ a: [1, 2], b: "c" }); await h.take(() => 1); return "done"; }';
    const result = await run(code, {}, helpers, LIMITS);
    assert.deepEqual(result, { ok: true, value: 'done' });
    assert.deepEqual(seen[0], { a: [1, 2], b: 'c' });
    assert.notEqual(typeof seen[1], 'function', 'a function from the isolate must not reach the host');
  });

  it('crosses a Uint8Array from a helper as a Uint8Array', async () => {
    const helpers = { bytes: async () => new Uint8Array([1, 2, 3]) };
    const code =
      'export default async (i, h) => { const b = await h.bytes(); return { length: b.length, isBytes: b instanceof Uint8Array, sum: b[0] + b[1] + b[2] }; }';
    const result = await run(code, {}, helpers, LIMITS);
    assert.deepEqual(result, { ok: true, value: { length: 3, isBytes: true, sum: 6 } });
  });

  it('crosses a Uint8ClampedArray from a helper as a Uint8ClampedArray', async () => {
    const helpers = { pixels: () => new Uint8ClampedArray([10, 20, 255, 0]) };
    const code =
      'export default async (i, h) => { const p = await h.pixels(); return { length: p.length, isClamped: p instanceof Uint8ClampedArray, values: Array.from(p) }; }';
    const result = await run(code, {}, helpers, LIMITS);
    assert.deepEqual(result, { ok: true, value: { length: 4, isClamped: true, values: [10, 20, 255, 0] } });
  });

  it('drops functions from a helper result (values cross as JSON)', async () => {
    const helpers = { leak: () => ({ fn: () => process, n: 1 }) };
    const code = 'export default async (i, h) => { const r = await h.leak(); return { fn: typeof r.fn, n: r.n }; }';
    const result = await run(code, {}, helpers, LIMITS);
    assert.deepEqual(result, { ok: true, value: { fn: 'undefined', n: 1 } });
  });

  it('turns a host helper error into an error the app can catch', async () => {
    const helpers = {
      fail: async () => {
        throw new Error('boom');
      },
    };
    const code = 'export default async (i, h) => { try { await h.fail(); return "no"; } catch (e) { return "caught"; } }';
    assert.deepEqual(await run(code, {}, helpers, LIMITS), { ok: true, value: 'caught' });
  });

  it('gives an uncaught host helper error as a throw', async () => {
    const helpers = {
      fail: async () => {
        throw new Error('boom');
      },
    };
    assertError(await run('export default async (i, h) => await h.fail()', {}, helpers, LIMITS), 'throw');
  });

  it('a helper function gives no way to the host', async () => {
    const helpers = { x: () => 1 };
    const code = `export default (i, h) => {
      const tries = [
        () => h.x.constructor('return typeof process')(),
        () => h.x.constructor.constructor('return typeof process')(),
        () => Object.getPrototypeOf(h.x).constructor('return typeof require')(),
        () => h.constructor.constructor('return typeof process')(),
        () => h.x.call.constructor('return typeof fetch')(),
        () => typeof h.x.prototype?.constructor?.constructor('return process')(),
        () => typeof Reflect.getPrototypeOf(h).constructor.constructor('return globalThis.process')(),
      ];
      return tries.map((t) => { try { return t(); } catch { return 'threw'; } });
    }`;
    const result = await run(code, {}, helpers, LIMITS);
    assert.equal(result.ok, true, JSON.stringify(result));
    const value = /** @type {{ ok: true, value: unknown[] }} */ (result).value;
    assert.equal(value.length, 7);
    for (const v of value) assert.ok(v === 'undefined' || v === 'threw', `escape attempt gave ${JSON.stringify(v)}`);
  });
});

describe('errors', () => {
  it('gives a thrown Error as a throw with its message', async () => {
    const result = await run("export default () => { throw new Error('x'); }", {}, {}, LIMITS);
    assertError(result, 'throw');
    assert.match(/** @type {{ message: string }} */ (result).message, /x/);
  });

  it('gives a thrown non-Error as a throw', async () => {
    assertError(await run("export default () => { throw 'plain'; }", {}, {}, LIMITS), 'throw');
  });

  it('gives a rejected async function as a throw', async () => {
    const result = await run("export default async () => { await null; throw new Error('later'); }", {}, {}, LIMITS);
    assertError(result, 'throw');
    assert.match(/** @type {{ message: string }} */ (result).message, /later/);
  });

  it('gives a syntax error as a throw', async () => {
    assertError(await run('export default () => {', {}, {}, LIMITS), 'throw');
  });

  it('gives a non-function default export as a throw', async () => {
    assertError(await run('export default 42', {}, {}, LIMITS), 'throw');
  });

  it('gives a module without a default export as a throw', async () => {
    assertError(await run('export const a = 1', {}, {}, LIMITS), 'throw');
  });
});

describe('no host access', () => {
  it('has no process', async () => {
    assertError(await run('export default () => process.env', {}, {}, LIMITS), 'throw');
  });

  it('has no require', async () => {
    assertError(await run("export default () => require('fs')", {}, {}, LIMITS), 'throw');
  });

  it('has no fetch, and no request leaves the host', async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = /** @type {typeof fetch} */ (
      async () => {
        calls += 1;
        return new Response('');
      }
    );
    try {
      assertError(await run("export default async () => await fetch('https://example.com')", {}, {}, LIMITS), 'throw');
      assertError(await run("export default async () => await globalThis.fetch('https://example.com')", {}, {}, LIMITS), 'throw');
    } finally {
      globalThis.fetch = original;
    }
    assert.equal(calls, 0);
  });

  it('has no setTimeout', async () => {
    assertError(await run('export default () => setTimeout(() => {}, 0)', {}, {}, LIMITS), 'throw');
  });

  it('has no setInterval', async () => {
    assertError(await run('export default () => setInterval(() => {}, 10)', {}, {}, LIMITS), 'throw');
  });

  it('has none of the host globals', async () => {
    const names = [
      'process',
      'require',
      'module',
      'fetch',
      'setTimeout',
      'setInterval',
      'setImmediate',
      'queueMicrotask',
      'Buffer',
      'global',
      'XMLHttpRequest',
      'WebSocket',
      'std',
      'os',
    ];
    const code = `export default (i) => Object.fromEntries(i.names.map((n) => [n, typeof globalThis[n]]))`;
    const result = await run(code, { names }, {}, LIMITS);
    assert.deepEqual(result, { ok: true, value: Object.fromEntries(names.map((n) => [n, 'undefined'])) });
  });

  it('refuses a static import of a Node module', async () => {
    assertError(await run("import fs from 'node:fs';\nexport default () => typeof fs.readFileSync", {}, {}, LIMITS), 'throw');
  });

  it('refuses a dynamic import of a Node module', async () => {
    const code = "export default async () => { const fs = await import('node:fs'); return typeof fs.readFileSync; }";
    assertError(await run(code, {}, {}, LIMITS), 'throw');
  });

  it("refuses QuickJS's std module", async () => {
    assertError(await run("import * as std from 'std';\nexport default () => typeof std.open", {}, {}, LIMITS), 'throw');
  });

  it("refuses QuickJS's os module", async () => {
    assertError(await run("import * as os from 'os';\nexport default () => typeof os.exec", {}, {}, LIMITS), 'throw');
  });

  it('refuses a dynamic import of std', async () => {
    const code = "export default async () => { const std = await import('std'); return typeof std.getenv; }";
    assertError(await run(code, {}, {}, LIMITS), 'throw');
  });

  it("the Function constructor cannot reach the host's process", async () => {
    assertError(await run("export default () => globalThis.constructor.constructor('return process')()", {}, {}, LIMITS), 'throw');
  });

  it("Function('return this')() is the isolate's global, without host objects", async () => {
    const code = `export default () => {
      const g = Function('return this')();
      return { process: typeof g.process, require: typeof g.require, fetch: typeof g.fetch, sameGlobal: g === globalThis };
    }`;
    const result = await run(code, {}, {}, LIMITS);
    assert.deepEqual(result, { ok: true, value: { process: 'undefined', require: 'undefined', fetch: 'undefined', sameGlobal: true } });
  });

  it('eval cannot reach the host either', async () => {
    assertError(await run("export default () => (0, eval)('process.env')", {}, {}, LIMITS), 'throw');
  });
});

describe('time limit', () => {
  it('stops an endless loop with a timeout within 1 s', async () => {
    const { result, elapsed } = await timed('export default () => { while (true) {} }', {}, {}, { ...LIMITS, ms: 100 });
    assertError(result, 'timeout');
    assert.ok(elapsed < 1000, `took ${elapsed} ms`);
  });

  it('stops an endless loop after an await with a timeout within 1 s', async () => {
    const code = 'export default async () => { await null; while (true) {} }';
    const { result, elapsed } = await timed(code, {}, {}, { ...LIMITS, ms: 100 });
    assertError(result, 'timeout');
    assert.ok(elapsed < 1000, `took ${elapsed} ms`);
  });

  it('stops an endless loop after a helper call with a timeout within 1 s', async () => {
    const helpers = { tick: async () => 1 };
    const code = 'export default async (i, h) => { await h.tick(); while (true) {} }';
    const { result, elapsed } = await timed(code, {}, helpers, { ...LIMITS, ms: 100 });
    assertError(result, 'timeout');
    assert.ok(elapsed < 1000, `took ${elapsed} ms`);
  });

  it('stops a wait on a helper that never answers with a timeout', async () => {
    const helpers = { never: () => new Promise(() => {}) };
    const { result, elapsed } = await timed('export default async (i, h) => await h.never()', {}, helpers, { ...LIMITS, ms: 200 });
    assertError(result, 'timeout');
    assert.ok(elapsed < 1500, `took ${elapsed} ms`);
  });

  it('stops an app promise that never settles with a timeout', async () => {
    const { result, elapsed } = await timed('export default () => new Promise(() => {})', {}, {}, { ...LIMITS, ms: 200 });
    assertError(result, 'timeout');
    assert.ok(elapsed < 1500, `took ${elapsed} ms`);
  });
});

describe('memory limit', () => {
  it('stops a growing array with a memory error', async () => {
    const code = "export default () => { const a = []; while (true) a.push('x'.repeat(1024) + a.length); }";
    assertError(await run(code, {}, {}, { ms: 20000, memoryMb: 8, outputKb: 256 }), 'memory');
  });

  it('stops a growing string with a memory error', async () => {
    const code = "export default () => { let s = 'x'; while (true) s += s; }";
    assertError(await run(code, {}, {}, { ms: 20000, memoryMb: 8, outputKb: 256 }), 'memory');
  });
});

describe('output limit', () => {
  it('refuses 1 MB of text with outputKb 256', async () => {
    assertError(await run("export default () => 'x'.repeat(1024 * 1024)", {}, {}, { ms: 5000, memoryMb: 64, outputKb: 256 }), 'output');
  });

  it('refuses a large object with outputKb 256', async () => {
    const code = "export default () => Array.from({ length: 4096 }, (_, n) => ({ n, text: 'y'.repeat(100) }))";
    assertError(await run(code, {}, {}, { ms: 5000, memoryMb: 64, outputKb: 256 }), 'output');
  });

  it('accepts output under the limit', async () => {
    const result = await run("export default () => 'x'.repeat(100 * 1024)", {}, {}, { ms: 5000, memoryMb: 64, outputKb: 256 });
    assert.equal(result.ok, true, JSON.stringify(result).slice(0, 200));
    assert.equal(/** @type {{ value: string }} */ (result).value.length, 100 * 1024);
  });
});

describe('isolation', () => {
  it('keeps no state between calls', async () => {
    const first = await run('export default () => { globalThis.x = 1; return globalThis.x; }', {}, {}, LIMITS);
    assert.deepEqual(first, { ok: true, value: 1 });
    const second = await run('export default () => globalThis.x', {}, {}, LIMITS);
    assert.deepEqual(second, { ok: true, value: undefined });
  });

  it('Object.prototype pollution does not reach the host', async () => {
    const result = await run('export default () => { Object.prototype.polluted = 1; return {}; }', {}, {}, LIMITS);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(/** @type {any} */ ({}).polluted, undefined);
    assert.equal(/** @type {any} */ (/** @type {{ value: unknown }} */ (result).value).polluted, undefined);
  });

  it('Array.prototype and JSON changes do not reach the host', async () => {
    const code = `export default () => {
      Array.prototype.polluted = 1;
      Array.prototype.map = () => 'pwned';
      JSON.parse = () => 'pwned';
      JSON.stringify = () => 'pwned';
      return [1, 2];
    }`;
    const result = await run(code, {}, {}, LIMITS);
    assert.deepEqual(result, { ok: true, value: [1, 2] });
    assert.equal(/** @type {any} */ ([]).polluted, undefined);
    assert.deepEqual(
      [1, 2].map((n) => n * 2),
      [2, 4],
    );
    assert.equal(JSON.parse('1'), 1);
    assert.equal(JSON.stringify({ a: 1 }), '{"a":1}');
  });

  it('a __proto__ key in the result does not change prototypes on the host', async () => {
    const result = await run('export default () => JSON.parse(\'{"__proto__": {"polluted": 1}}\')', {}, {}, LIMITS);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(/** @type {any} */ ({}).polluted, undefined);
    assert.equal(Object.getPrototypeOf(/** @type {{ value: object }} */ (result).value), Object.prototype);
  });

  it('the input is a copy: the app changing it leaves the host object as it was', async () => {
    const input = { a: 1, list: [1, 2], deep: { b: 'c' } };
    const code = "export default (i) => { i.a = 99; i.list.push(3); i.deep.b = 'changed'; delete i.deep; return i.a; }";
    const result = await run(code, input, {}, LIMITS);
    assert.deepEqual(result, { ok: true, value: 99 });
    assert.deepEqual(input, { a: 1, list: [1, 2], deep: { b: 'c' } });
  });

  it('the result is a copy, not an isolate handle', async () => {
    const result = await run('export default () => ({ a: [1, { b: 2 }] })', {}, {}, LIMITS);
    assert.equal(result.ok, true, JSON.stringify(result));
    const value = /** @type {{ value: { a: unknown[] } }} */ (result).value;
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
    assert.ok(Array.isArray(value.a));
    assert.deepEqual(value, { a: [1, { b: 2 }] });
  });
});

describe('concurrency and clean-up', () => {
  it('runs two calls at the same time, each with its own input and helpers', async () => {
    const slow = { wait: () => new Promise((resolve) => setTimeout(() => resolve('slow'), 50)) };
    const fast = { wait: async () => 'fast' };
    const code = 'export default async (i, h) => ({ n: i.n, got: await h.wait() })';
    const [a, b] = await Promise.all([run(code, { n: 1 }, slow, LIMITS), run(code, { n: 2 }, fast, LIMITS)]);
    assert.deepEqual(a, { ok: true, value: { n: 1, got: 'slow' } });
    assert.deepEqual(b, { ok: true, value: { n: 2, got: 'fast' } });
  });

  it('runs many calls at the same time without mixing them up', async () => {
    const helpers = { echo: (v) => new Promise((resolve) => setTimeout(() => resolve(v), Math.random() * 20)) };
    const code =
      'export default async (i, h) => { globalThis.seen = (globalThis.seen ?? 0) + 1; return [await h.echo(i.n), globalThis.seen]; }';
    const results = await Promise.all(Array.from({ length: 20 }, (_, n) => run(code, { n }, helpers, LIMITS)));
    results.forEach((result, n) => assert.deepEqual(result, { ok: true, value: [n, 1] }));
  });

  it('a call that times out does not block a call running beside it', async () => {
    const never = { never: () => new Promise(() => {}) };
    const [stuck, quick] = await Promise.all([
      run('export default async (i, h) => await h.never()', {}, never, { ...LIMITS, ms: 200 }),
      run('export default (i) => i.a', { a: 7 }, {}, LIMITS),
    ]);
    assertError(stuck, 'timeout');
    assert.deepEqual(quick, { ok: true, value: 7 });
  });

  it('a helper answering after the timeout touches nothing and throws nothing later', async () => {
    /** @type {unknown[]} */
    const uncaught = [];
    const onError = (/** @type {unknown} */ error) => uncaught.push(error);
    process.on('uncaughtException', onError);
    process.on('unhandledRejection', onError);
    try {
      const late = {
        late: () => new Promise((resolve) => setTimeout(() => resolve(new Uint8Array([1])), 300)),
        lateFail: () => new Promise((_, reject) => setTimeout(() => reject(new Error('late')), 300)),
      };
      const code = 'export default async (i, h) => [await h.late(), await h.lateFail()]';
      assertError(await run(code, {}, late, { ...LIMITS, ms: 100 }), 'timeout');
      await new Promise((resolve) => setTimeout(resolve, 400));
      assert.deepEqual(uncaught, []);
      assert.deepEqual(await run('export default () => "still fine"', {}, {}, LIMITS), { ok: true, value: 'still fine' });
    } finally {
      process.off('uncaughtException', onError);
      process.off('unhandledRejection', onError);
    }
  });

  it('works again after a memory error and a stack overflow', async () => {
    const grow = "export default () => { const a = []; while (true) a.push('x'.repeat(1024) + a.length); }";
    assertError(await run(grow, {}, {}, { ms: 20000, memoryMb: 8, outputKb: 256 }), 'memory');
    assert.deepEqual(await run('export default () => 1', {}, {}, LIMITS), { ok: true, value: 1 });
    assertError(await run('export default async () => { await null; const f = () => f() + 1; return f(); }', {}, {}, LIMITS), 'throw');
    assert.deepEqual(await run('export default () => 2', {}, {}, LIMITS), { ok: true, value: 2 });
  });

  it('never rejects: an input or a result JSON cannot hold gives a throw', async () => {
    assertError(await run('export default (i) => i', { big: 1n }, {}, LIMITS), 'throw');
    assertError(await run('export default () => 10n', {}, {}, LIMITS), 'throw');
    assertError(await run('export default () => { const o = {}; o.o = o; return o; }', {}, {}, LIMITS), 'throw');
  });

  it('a helper result JSON cannot hold reaches the app as an error', async () => {
    const helpers = { big: () => 1n };
    const code = 'export default async (i, h) => { try { await h.big(); return "no"; } catch { return "caught"; } }';
    assert.deepEqual(await run(code, {}, helpers, LIMITS), { ok: true, value: 'caught' });
  });
});
