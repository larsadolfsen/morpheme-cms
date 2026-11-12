# Content-based color: the engine on the host, the hook only decides

Date: 2026-11-10. Status: implemented in this pull request (CMS part); the app part follows the release.

## Problem

The app *Dynamic page colors* (`content-colors`, in `morpheme-apps`) does not color photographs. Its `page-colors` hook
bundles the color engine (`lib/dynamic-colors.ts`: Material's quantizer, score and schemes) and runs it in the QuickJS
sandbox, where a hook has 1000 ms (`HOOK_LIMITS`). Measured on a made-up 128 × 128 photograph (every pixel its own
color): `sourceColorsOf` takes about 2.6 s in the sandbox (the run with a 10 s limit) and times out at 1000 ms; on the host
the same takes about 55 ms. A sandbox run is a fresh context, so the library is also loaded again for every page.

## Decision

The engine runs in the site's build (`lib/contentColors.ts`, used by `site/pageColors.ts`), not in the hook. The hook
only decides: which pictures to try, in which order, with which choice (variant and contrast from the app's settings).
It gets one new helper beside `pixels` and `readable`:

```ts
contentColors(picture: string, choice: { variant; contrast }): Promise<Colors | undefined>
```

The helper makes the source color of the picture (Material's quantizer and score), then the scheme of the choice, each of
the site's colors by its role, in both modes. It gives `undefined` for a picture that is not one of the page's, cannot be
read, has no color (a grey one), a choice that is not a variant and a contrast, or colors that are hard to read.

## Why this is also the safer design

- The sandbox limits stay as they are (1000 ms, 64 MB). The limits are the wall against a malicious publisher; raising
  them for one app would raise them for all.
- Everything the hook gives the helper is checked on the host: the picture must be in the page's own list, the choice by
  `dynamicProblems`, the roles are the site's (`colorRoles`, never the hook's) and the colors must be readable. The cost
  of the helper is fixed (a picture of at most 128 px, at most 128 colors), so it can't be used to stall the build.
- The sandboxed `pixels` helper read any picture in `public/`. It now reads only the page's own pictures.
- The hook's bundle no longer carries Material's library, so it is small and loads fast in each fresh context.

## Speed

A picture is read and quantized once in a build (the shared picture is on every page), and the colors of a picture and a
choice are made once. The hook is a loop of one call per picture.

## Compatibility

- Additive: `contentColors` is a new field of `PageColorsPage`. Apps that don't use it run as before, and the older
  (non-sandboxed) hooks get it too.
- `lib/dynamic-colors` stays an allowed import of a hook (`ALLOWED_CORE`), so the apps on the older way still work.
- An app that calls `contentColors` needs a CMS with it; its store entry says so under `needs`. The `content-colors` app
  changes after the owner releases this version (its hook becomes the loop above and its `needs` names the version).

## Not in this change

- No change of the 1000 ms limit.
- No cache between builds.
