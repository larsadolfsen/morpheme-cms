# Plugin Worker isolation: prototype result (11 November 2026)

Answers open question 4 of `2026-11-11-store-sections-design.md`: can a plugin's `worker.js` run in a Cloudflare dynamic
Worker (Worker Loader) with no network, one scoped binding and capped CPU?

**Result: yes, all four checks passed on a real, throwaway Worker.** Nothing in the account was changed except the two
things created and deleted below.

## What was run

- Account: `Larsadolfsen@gmail.com's Account` only. One Worker `zz-proto-dynworker-103af7` and one KV namespace
  `zz-proto-103af7`, both created for this and deleted afterwards. Deployed with `wrangler 4.160.1`.
- The host Worker had a `worker_loaders` binding (`LOADER`), a KV binding, a `ScopedKV` `WorkerEntrypoint` and the
  starter's settings (`starter/wrangler.jsonc`): `compatibility_date` `2026-09-01`, flags `nodejs_compat` and
  `global_fetch_strictly_public`. Its default export has `fetch` and `scheduled`, like `worker/index.js`.
- The plugin `worker.js` was bundled with `lib/sandbox/bundle.mjs` (`bundleEntry`, copied unchanged next to esbuild) and
  loaded with `env.LOADER.get(id, cb)`, `globalOutbound: null` and `env: { KV: ctx.exports.ScopedKV({ props: { id } }) }`.
- Each case ran twice: plugin flags `{}` (`default`) and `["nodejs_compat", "global_fetch_strictly_public"]`
  (`starterFlags`), both with `compatibilityDate` `2026-09-01`. Results were identical.
- The sandbox cannot reach `*.workers.dev`, so a cron trigger (`* * * * *`) ran the cases and wrote the JSON to KV, which
  was read back through the Cloudflare API.

## Outputs (real, same in both configurations)

1. **Outbound fetch fails.** The plugin's `fetch('https://example.com')` threw `Error`: _This worker is not permitted to
   access the internet via global functions like fetch(). It must use capabilities (such as bindings in 'env') to talk to
   the outside world._ (about 10 ms).
2. **One scoped binding works.** `plugA` called `env.KV.put('shared', …)` and `env.KV.get('shared')` and read back
   `written-by-plugA`. Its `env` held only `KV` (`Object.keys(env)` is `["KV"]`; `env.RAW_KV` is `undefined`). The stub
   prefixed every key with `plugin:<id>:` from `ctx.props`, which the plugin cannot set. `plugB` reading `shared` got
   `null`.
3. **Same behaviour with the starter's flags**, from a `worker/index.js`-style entry: every result above and below is the
   same under `default` and `starterFlags`.
4. **Limits stop it.** With `limits: { cpuMs: 50, subRequests: 5 }`, `while (true) n++` threw _Worker exceeded CPU time
   limit._ in the host after 6 to 7 ms. With `subRequests: 3`, ten calls to the scoped KV stub threw _Too many
   subrequests by single Worker invocation._ The same ten calls without limits returned `done: 10`.

Finding: **calls on a binding stub count as subrequests**, so `subRequests` caps a plugin's binding calls too, not only
its `fetch`. The plan must pick a number that fits real plugins.

Cleanup: the Worker and the KV namespace were deleted. The account's Worker list is the same as before:
`morpheme-appstore`, `morpheme-demo`, `morpheme-staging`, `morpheme-website`, `punk-arcana`. No `zz-proto` namespace is
left.

## Still unverified

- **The plan.** The token had no billing scope, so the Workers Paid plan was not read. The deploy with `worker_loaders`
  and the runs worked on this account, which shows that the feature works here, not which plan it is on. What a site on
  the Free plan gets is still open.
- The real `worker/index.js` and a real plugin (QuickJS hooks are a different path); a site's own limits and CPU cost
  per request; cold-start (first scoped call about 450 ms, later ones about 10 to 50 ms, one sample); that the feature
  leaves beta; `connect()` (TCP) was not called, only `fetch`.
- Plugins that need more than one binding, `props` abuse by the host, and how errors surface in the editor.

## Recommendation

Use it. A plugin `worker.js` runs in a dynamic Worker with `globalOutbound: null`, only scoped `WorkerEntrypoint` stubs
with `props`, and `limits` (`cpuMs`, `subRequests`). Before the plan relies on it: run the same cases once from the real
`worker/index.js` on `morpheme-staging` (owner's call), decide the limits and what the Free plan gets, and keep
first-party-only `worker.js` until then.
