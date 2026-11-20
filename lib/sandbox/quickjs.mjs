// Runs one app bundle in a fresh QuickJS runtime and context (WebAssembly, asyncify build) with time, memory and output
// limits. Values cross as JSON; a helper's Uint8Array or Uint8ClampedArray crosses as the same typed array.
// Exposes runInQuickJS, the engine behind run() in lib/sandbox/runner.mjs. Depends on quickjs-emscripten.
import { newQuickJSAsyncWASMModule } from 'quickjs-emscripten';

/** @typedef {import('./runner.mjs').Limits} Limits */
/** @typedef {import('./runner.mjs').Helpers} Helpers */
/** @typedef {import('./runner.mjs').RunResult} RunResult */
/** @typedef {import('quickjs-emscripten').QuickJSHandle} QuickJSHandle */
/** @typedef {import('quickjs-emscripten').QuickJSAsyncContext} QuickJSAsyncContext */
/** @typedef {import('quickjs-emscripten').QuickJSDeferredPromise} QuickJSDeferredPromise */
/** @typedef {{ ok: false; error: 'throw' | 'timeout' | 'memory' | 'output'; message: string }} RunError */

/** Longest error message passed on. */
const MESSAGE_MAX = 1000;

/**
 * Built in the context before the app's code runs, so the app cannot replace what the host relies on (JSON,
 * Promise, typed arrays). `drive` awaits the module namespace, calls its default export with the input and the
 * helpers, and hands the result to `done` as a JSON string (or undefined), or the error to `fail`.
 */
const KERNEL = `(() => {
  const P = Promise;
  const then = P.prototype.then;
  const resolve = P.resolve.bind(P);
  const stringify = JSON.stringify;
  const parse = JSON.parse;
  const U8 = Uint8Array;
  const U8C = Uint8ClampedArray;
  const drive = (ns, input, helpers, done, fail) => {
    const called = then.call(resolve(ns), (m) => {
      const f = m.default;
      if (typeof f !== 'function') throw new TypeError('the default export is not a function');
      return f(input === undefined ? undefined : parse(input), helpers);
    });
    const written = then.call(called, (v) => { done(stringify(v)); });
    then.call(written, undefined, (e) => { fail(e); });
  };
  const toJson = (v) => stringify(v);
  const fromJson = (s) => (s === undefined ? undefined : parse(s));
  const bytes = (buffer, clamped) => (clamped ? new U8C(buffer) : new U8(buffer));
  return { drive, toJson, fromJson, bytes };
})()`;

/** @type {Promise<import('quickjs-emscripten').QuickJSAsyncWASMModule> | undefined} */
let modulePromise;

/** One WebAssembly module for all calls; each call gets its own runtime and context. */
function quickjs() {
  modulePromise ??= newQuickJSAsyncWASMModule();
  return modulePromise;
}

/**
 * Drops the shared module, so the next call starts a new one. Used after QuickJS ran out of memory or stack: it can
 * then leak objects, and freeing that runtime would abort the whole WebAssembly module. Calls still running on the old module
 * finish on it; the old module is garbage collected after them.
 * @param {Promise<import('quickjs-emscripten').QuickJSAsyncWASMModule>} retired
 */
function retireModule(retired) {
  if (modulePromise === retired) modulePromise = undefined;
}

/**
 * Cuts a message to MESSAGE_MAX characters.
 * @param {unknown} text
 */
function short(text) {
  const s = String(text);
  return s.length > MESSAGE_MAX ? s.slice(0, MESSAGE_MAX) : s;
}

/**
 * Runs `code` (an ES module whose default export is called as `fn(input, helpers)`) in a fresh QuickJS context.
 * Always resolves to a RunResult; it never throws.
 * @param {string} code
 * @param {unknown} input
 * @param {Helpers} helpers
 * @param {Limits} limits
 * @returns {Promise<RunResult>}
 */
export async function runInQuickJS(code, input, helpers, limits) {
  try {
    const shared = quickjs();
    const module = await shared;
    return await runOnce(module, code, input, helpers, limits, () => retireModule(shared));
  } catch (error) {
    return { ok: false, error: 'throw', message: short(error instanceof Error ? error.message : error) };
  }
}

/**
 * @param {import('quickjs-emscripten').QuickJSAsyncWASMModule} module
 * @param {string} code
 * @param {unknown} input
 * @param {Helpers} helpers
 * @param {Limits} limits
 * @param {() => void} retire drops the shared module after this call
 * @returns {Promise<RunResult>}
 */
async function runOnce(module, code, input, helpers, limits, retire) {
  // The input crosses as JSON; a value JSON cannot hold (a BigInt, a cycle) fails here, before QuickJS is touched.
  const json = JSON.stringify(input);
  const deadline = Date.now() + limits.ms;
  const outputMax = limits.outputKb * 1024;
  /** Becomes false when the call ends; late helper answers then touch nothing. */
  let alive = true;
  /** @type {QuickJSHandle[]} handles this call owns */
  const owned = [];
  /** @type {QuickJSDeferredPromise[]} */
  const deferreds = [];
  /** @type {(result: RunResult) => void} */
  let finish = () => {};
  /** @type {Promise<RunResult>} */
  const finished = new Promise((resolve) => {
    finish = (result) => {
      if (!alive) return;
      alive = false;
      resolve(result);
    };
  });
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;
  /** True once QuickJS ran out of memory or stack: the runtime may have leaked objects and must not be freed. */
  let leaky = false;

  const runtime = module.newRuntime();
  runtime.setMemoryLimit(limits.memoryMb * 1024 * 1024);
  // Small enough that QuickJS stops deep recursion itself (about 1500 frames) before the host's stack runs out.
  runtime.setMaxStackSize(256 * 1024);
  runtime.setInterruptHandler(() => Date.now() > deadline);
  const ctx = runtime.newContext();

  /**
   * Turns an error value from the isolate into a RunError.
   * @param {QuickJSHandle} handle
   * @returns {RunError}
   */
  const errorOf = (handle) => {
    let name = '';
    let message = '';
    try {
      const dumped = ctx.dump(handle);
      if (dumped && typeof dumped === 'object') {
        name = String(dumped.name ?? '');
        message = String(dumped.message ?? '');
      } else {
        message = String(dumped);
      }
    } catch {
      message = 'unknown error';
    }
    if (message === 'interrupted' || Date.now() > deadline) {
      return { ok: false, error: 'timeout', message: `the code ran longer than ${limits.ms} ms` };
    }
    if (/stack size exceeded|stack overflow/i.test(message)) leaky = true;
    if (/out of memory|string too long/i.test(message)) {
      leaky = true;
      return { ok: false, error: 'memory', message: `the code used more than ${limits.memoryMb} MB` };
    }
    return { ok: false, error: 'throw', message: short(name && name !== 'Error' ? `${name}: ${message}` : message) };
  };

  /** Runs the isolate's pending jobs; an error that escapes them (interrupt, out of memory) ends the call. */
  const pump = () => {
    if (!alive) return;
    const jobs = runtime.executePendingJobs();
    if (jobs.error) {
      const error = errorOf(jobs.error);
      jobs.error.dispose();
      finish(error);
    }
  };

  /**
   * Keeps a handle until the end of the call.
   * @param {QuickJSHandle} handle
   */
  const own = (handle) => {
    owned.push(handle);
    return handle;
  };

  try {
    const kernel = own(ctx.unwrapResult(ctx.evalCode(KERNEL, 'kernel.js', { type: 'global', strict: true })));
    const drive = own(ctx.getProp(kernel, 'drive'));
    const toJson = own(ctx.getProp(kernel, 'toJson'));
    const fromJson = own(ctx.getProp(kernel, 'fromJson'));
    const bytes = own(ctx.getProp(kernel, 'bytes'));

    /**
     * Makes an isolate value from a host value: JSON, or a typed array for Uint8Array and Uint8ClampedArray.
     * @param {unknown} value
     * @returns {QuickJSHandle} a handle the caller must dispose
     */
    const toIsolate = (value) => {
      if (value instanceof Uint8Array || value instanceof Uint8ClampedArray) {
        const copy = new Uint8Array(value.byteLength);
        copy.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
        const buffer = ctx.newArrayBuffer(copy.buffer);
        const clamped = value instanceof Uint8ClampedArray ? ctx.true : ctx.false;
        const made = ctx.callFunction(bytes, ctx.undefined, buffer, clamped);
        buffer.dispose();
        return ctx.unwrapResult(made);
      }
      const json = JSON.stringify(value);
      if (json === undefined) return ctx.undefined;
      const text = ctx.newString(json);
      const made = ctx.callFunction(fromJson, ctx.undefined, text);
      text.dispose();
      return ctx.unwrapResult(made);
    };

    /**
     * Makes a host value from an isolate value, through JSON.
     * @param {QuickJSHandle} handle
     */
    const toHost = (handle) => {
      const json = ctx.unwrapResult(ctx.callFunction(toJson, ctx.undefined, handle));
      try {
        return ctx.typeof(json) === 'string' ? JSON.parse(ctx.getString(json)) : undefined;
      } finally {
        json.dispose();
      }
    };

    const helperObject = own(ctx.newObject());
    for (const [name, fn] of Object.entries(helpers)) {
      if (typeof fn !== 'function') continue;
      const handle = ctx.newFunction(name, (...args) => {
        const deferred = ctx.newPromise();
        deferreds.push(deferred);
        /** @type {unknown[]} */
        let values;
        try {
          values = args.map(toHost);
        } catch (error) {
          const reason = ctx.newError(short(error instanceof Error ? error.message : error));
          deferred.reject(reason);
          reason.dispose();
          return deferred.handle;
        }
        Promise.resolve()
          .then(() => fn(...values))
          .then(
            (value) => {
              if (!alive) return;
              let made;
              try {
                made = toIsolate(value);
              } catch (error) {
                const reason = ctx.newError(short(error instanceof Error ? error.message : error));
                deferred.reject(reason);
                reason.dispose();
                pump();
                return;
              }
              deferred.resolve(made);
              made.dispose();
              pump();
            },
            (error) => {
              if (!alive) return;
              const reason = ctx.newError(short(error instanceof Error ? error.message : error));
              deferred.reject(reason);
              reason.dispose();
              pump();
            },
          )
          .catch((error) => finish({ ok: false, error: 'throw', message: short(error?.message ?? error) }));
        return deferred.handle;
      });
      ctx.setProp(helperObject, name, handle);
      handle.dispose();
    }

    const done = own(
      ctx.newFunction('done', (json) => {
        if (!alive) return;
        if (ctx.typeof(json) !== 'string') return finish({ ok: true, value: undefined });
        const text = ctx.getString(json);
        if (Buffer.byteLength(text, 'utf8') > outputMax) {
          return finish({ ok: false, error: 'output', message: `the result is larger than ${limits.outputKb} KB` });
        }
        finish({ ok: true, value: JSON.parse(text) });
      }),
    );
    const fail = own(
      ctx.newFunction('fail', (error) => {
        finish(errorOf(error));
      }),
    );

    const evaluated = ctx.evalCode(code, 'app.js', { type: 'module', strict: true });
    if (evaluated.error) {
      const error = errorOf(evaluated.error);
      evaluated.error.dispose();
      return error;
    }
    const namespace = own(evaluated.value);
    const inputHandle = own(json === undefined ? ctx.undefined : ctx.newString(json));
    const started = ctx.callFunction(drive, ctx.undefined, namespace, inputHandle, helperObject, done, fail);
    if (started.error) {
      const error = errorOf(started.error);
      started.error.dispose();
      return error;
    }
    started.value.dispose();
    pump();

    const remaining = Math.max(0, deadline - Date.now());
    timer = setTimeout(() => finish({ ok: false, error: 'timeout', message: `the code ran longer than ${limits.ms} ms` }), remaining);
    return await finished;
  } catch (error) {
    // A host exception from inside QuickJS (for example the host stack running out) can leave the runtime broken.
    leaky = true;
    return { ok: false, error: 'throw', message: short(error instanceof Error ? error.message : error) };
  } finally {
    alive = false;
    clearTimeout(timer);
    if (leaky) {
      retire();
    } else {
      try {
        for (const deferred of deferreds) if (deferred.alive) deferred.dispose();
        for (const handle of owned.reverse()) if (handle.alive) handle.dispose();
        ctx.dispose();
        runtime.dispose();
      } catch {
        retire();
      }
    }
  }
}
