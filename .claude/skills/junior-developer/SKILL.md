---
name: junior-developer
description: Use when a developer session in morpheme-cms hands a mechanical, judgement-light step to a junior helper (a Haiku subagent) - "junior", "Haiku", "rename across files", "snapshot update", "find every use". Says what a junior may do, how the developer briefs it, and what the developer checks before anything is pushed.
---

# Junior developer

Announce "Using junior-developer". Owner, 24 Nov 2026: "A junior Developer skill". A junior is a Haiku subagent that a **developer
session** starts (the Agent tool, `model: "haiku"`) inside its own session, for a step that needs no judgement. The PM never starts
a junior; it sees in the developer's report what was delegated.

## What a junior does

Mechanical work with a precise brief, for example:

- a rename across many files from a given map (old name → new name, file list);
- updating snapshots or fixtures after a change the developer made;
- finding every use of a name, a token or an import and listing it with file and line.

A plain literal replace is done as a script by the developer, not by a junior.

## What a junior never does

- Push, commit, open, review or merge a pull request, or message another session.
- Make a design choice, a Material 3 decision, a wording choice or any decision the brief does not spell out.
- Touch the app sandbox (`lib/sandbox/`, `app*.mjs`, `reads.mjs`, `afterBuild.mjs`, `sandboxHooks.mjs`) or the Worker (`worker/`).
- Work outside the files the brief names.

## The brief

The developer writes it, every time:

1. the files (or the folder and the search that finds them);
2. the exact change, with one worked example;
3. how to verify it (a command and what it must print), and what to report back (the changed files, anything it could not do).

A junior that meets a case the brief does not cover stops and reports it; it does not guess.

## After the junior

The developer reads the whole diff, runs the checks (skill `checks`) and is responsible for the result as if it wrote it. Its report
to the PM names what it delegated to a junior.
