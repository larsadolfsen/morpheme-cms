---
'@morphemecms/cms': minor
---

A theme that writes a faulty value for a colour, size or time token (`--mo-sys-color-primary: banana`) no longer breaks the page: 148 `--mo-sys-*` and `--mo-ref-*` tokens and the 45 colour roles are registered with `@property` and keep today's default, and the comp tokens that point at one sys token are read with it as their fallback. Components: theme tokens.
