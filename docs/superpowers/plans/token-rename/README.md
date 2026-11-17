# Token rename inputs

Inputs for the token rename (`docs/superpowers/plans/2026-11-16-token-rename-table.md`), written 17 Nov 2026.

- `map.json`: every renamed token, old name to new name, its kind (S exact M3 token, S? M3 pattern without a token, O ours) and its group. PR 3 reads it
  as the old-to-new map for the computed-value proof and for the search and replace.
- `m3-component-token-names.json`: the 3,996 `md.comp.…` names that the M3 component specs pages print (token modules, every token set, expand all),
  read with Playwright on 17 Nov 2026. A component token is marked S only when its M3 name is in this list.
- `crawl-m3-specs.mjs`: how that list was read: `node crawl-m3-specs.mjs <slug> <out.json>` opens
  `https://m3.material.io/components/<slug>/specs`, opens the token set menu, and for every set presses *expand all* and collects the names.
  Playwright's Chromium is needed (`CHROMIUM` at `/opt/pw-browsers/chromium` in the cloud container).
