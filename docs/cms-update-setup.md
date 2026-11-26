# What a site needs for a safe CMS update

Spec: `docs/superpowers/specs/2026-11-25-safe-cms-update-design.md`. The Worker (`worker/cms-update.js`) tries each CMS version on a branch before it touches `main`.

- **`GITHUB_PUBLISH_TOKEN`** with *Contents: Read and write*. It creates and deletes the branch `cms-update-<version>` and moves `main` to it (a fast-forward, never a force). *Checks: Read* is optional: with it a failed build is seen at once, without it the Worker waits for the preview's `editor/version.json`.
- **The branch's preview address** comes from the Worker's own `*.workers.dev` address: Cloudflare serves a branch at `<branch>-<worker name>.<account>.workers.dev`. The Worker keeps its own host when the editor is opened on it (`cms:host` in KV), so open `/editor/` once on the `*.workers.dev` address. The branch name has lower-case letters, digits and hyphens only (`cms-update-0-19-9` for 0.19.9), so Cloudflare's alias rules never change it. Whether a long name is cut by Cloudflare's alias limit is verified once on `morpheme-staging`.
- **`PREVIEW_URL`** (optional): overrides the above, for a site whose previews are on another address. The address with `{branch}` where the branch's name goes.
- **No address, no update.** When the Worker knows neither, the update is not tried: `main` is left as it is and the Morpheme page tells the owner.
- **Branch builds.** Cloudflare must build branches other than `main` as previews (`"previews": {}` in the starter's `wrangler.jsonc`). A branch that is not built gives no answer, so the version is counted as failed and tried again after 24 hours.
- **A rule that protects `main`** must let the token fast-forward it. If it can't, the update ends as failed with the reason "GitHub wouldn’t let Morpheme save it": `main` is left as it is, the update's branch is kept and the Morpheme page tells the owner. The Worker never commits an update on `main` itself.
