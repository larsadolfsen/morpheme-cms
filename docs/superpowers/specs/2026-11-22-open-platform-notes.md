# An open platform: notes

> **Status:** the owner's direction from a discussion with the CTO, 22 November 2026. Not a spec: nothing here is designed or
> built. It is the frame for the store track of the roadmap (`plans/2026-11-14-roadmap-0-18-to-0-24.md`, 0.28 to 0.32) and for
> what waits under *Later* there. The owner starts none of it before the editor is done (owner: "I will not start with this
> before the editor is done").

## The goal

Open the platform to outside developers, as WordPress did ("WP became big on this freedom"), while the sites stay safe, fast and
easy to use, and the store earns the money the business model needs.

## The direction

1. **Trust sits in the boundary, not in the developer.** WordPress trusts every plugin with full access, so a site is only as safe
   and fast as its worst plugin. Morpheme enforces the limits itself (the sandbox, the contracts, the hosts an app declares), so it
   can say yes to every developer.
2. **A small core; everything else replaceable.** The core is what guarantees safety: sign-in, saving, publishing, the sandbox and
   the contracts. Every function above it is a built-in default that an item replaces (one active) or adds to (many active), and the
   built-in takes over again when the item is removed, turned off or fails. This extends the built-in rule of the 0.23 app platform
   plan (`plans/2026-11-15-app-platform-0-23.md`, decision 14).
3. **Good defaults.** A site is complete with no apps. Apps make things better, never basic, and Morpheme never weakens a built-in to
   sell an app.
4. **Declared, not discovered.** An item says what it needs (hosts, data, the functions it provides or replaces); the owner sees it
   and the platform enforces it.
5. **Speed is the platform's guarantee.** What an item adds to a page is measured and shown, not assumed.
6. **Blocks are open.** Outside developers make blocks too (owner: "Blocks had never been of the table").
7. **Contract, then SDK, then API.** The contract (a versioned, public description of what an item may declare and do) is the
   foundation. The SDK (types, templates, a local runner that behaves like production, an upgrade command) is how developers use it,
   never the security. The API opens a site's data to other systems (MCP first) with scoped tokens the owner grants.
8. **The store is the best place to sell, not the only one.** It sells trust and convenience (install, updates, licences, billing,
   the sandbox's guarantee); its commission is low, especially at the start; no paid ranking; a site's own code always runs.

## Stability comes from opening

The owner: "We will not become stable before we can open for outside developers." So the platform opens while the contract still
changes, in stages:

- **Stability per part.** Each part of the contract is marked stable, preview or experimental.
- **Preview parts don't reach live sites.** An item that uses a preview part can be built and tested, but not offered in the store
  to every site until the part is stable.
- **Invited developers first.** A small group builds real items on the preview parts and shapes the stable contract.
- **A change costs a command.** The CLI upgrades an item to the new contract, and the previous contract keeps working for a while
  instead of being refused.

## Morpheme first, ready to be replaced

The owner: free items first ("icons and themes and basic apps"), made by Morpheme alone, but built so outside items can replace them
later, with auto-update included ("I agree, but include auto update"). What that needs:

1. **Morpheme is its own first outside developer.** Its items go through the store and the same contract; the core has no hard-coded
   item ids and no first-party shortcuts.
2. **The core names functions, not items** ("an icon pack", "a theme", "a spam check", never "Phosphor"). Icon packs and themes are
   the model already. The one-app types (`ONE_APP_TYPES`) move onto the same mechanism.
3. **Morpheme's items keep the coming limits** (data first, hosts declared, server code ready for the sandbox) before they are
   enforced.
4. **Contract discipline from now:** mark what is settled; avoid changes that refuse older items.
5. **The same experience for every item:** install, switch, remove, fall back to the built-in, keep the data.

This is the order of the roadmap's store track: 0.28 replaceable functions, 0.29 contract discipline, 0.30 auto-update, 0.31
Morpheme's free items one at a time, 0.32 the same experience for every item.

## Later

Not needed until the platform opens: sandboxes for blocks and page scripts, outside publishers' sign-up, a review process, the
public SDK and `morpheme new app`, payments. Spam protection becomes a replaceable function then, with Turnstile as its built-in
(it is "always on" in the app platform plan, decision 28).

No contract raise: additive, optional keys, a theme without the new part falls back (themeProblems does not require it).
