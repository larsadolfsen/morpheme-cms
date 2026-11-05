// The editor's menu as data: the two-level tree (menuTree) and which section/item/child is open for a route (currentPlace).
// In the Apps section the installed-apps list (`apps`) is not an item: each installed app is an item after the others.
// currentPart (which item is open for a route) is exported only for its tests; currentPlace uses it as its last rule.
// Pure, no browser; MainMenu.tsx draws the drawer from it. No dependencies.

/**
 * @param {{ id: string, title: string, href?: string, ids: string[] }[]} groups
 * @param {(id: string) => { label: string, href: string, count: number | null }} partOf
 * @param {(id: string) => { id: string, label: string, href: string }[]} childrenOf
 * @returns {{ id: string, label: string, href?: string, items: { id: string, label: string, href: string, count: number | null, children?: { id: string, label: string, href: string }[] }[] }[]}
 */
export function menuTree(groups, partOf, childrenOf) {
  return groups.map((group) => {
    const entry = { id: group.id, label: group.title };
    if (group.href !== undefined) {
      entry.href = group.href;
    }
    // The installed-apps list (#apps) is not a row of the Apps section: its apps are rows, after the other items.
    const hoisted = group.id === 'apps' ? childrenOf('apps') : [];
    const rows = group.id === 'apps' ? group.ids.filter((id) => id !== 'apps') : group.ids;
    entry.items = rows.map((id) => {
      const item = { id, ...partOf(id) };
      const children = childrenOf(id);
      if (children.length > 0) {
        item.children = children;
      }
      return item;
    });
    for (const app of hoisted) {
      entry.items.push({ id: app.id, label: app.label, href: app.href, count: null });
    }
    return entry;
  });
}

const PARENTS = ['company', 'blocks', 'appearance', 'seo', 'apps'];

const under = (path, prefix) => path === prefix || path.startsWith(prefix + '/');

/**
 * @param {string} route
 * @param {{ open?: string, lists: string[], header: string[], partScreens: string[], cookies: string, store: string }} known
 * @returns {string}
 */
export function currentPart(route, known) {
  if (known.store && under(route, known.store)) {
    return 'appstore';
  }

  const part = known.open || route.replace(/^(list|ny|slettet)\/([^/]+).*/, '$2');

  if (part === known.cookies) {
    // The cookie list is a list, but its place is under Privacy.
    return 'privacy';
  }

  if (known.lists.includes(part)) {
    return 'lists';
  }

  if (known.header.includes(part)) {
    return 'header';
  }

  const parent = PARENTS.find((id) => under(part, id));
  if (parent) {
    return parent;
  }

  return known.partScreens.find((id) => part.startsWith(id + '/')) ?? part;
}

/**
 * @param {string} route
 * @param {ReturnType<typeof menuTree>} tree
 * @param {Parameters<typeof currentPart>[1]} known
 * @returns {{ section: string | null, item?: string, child?: string }}
 */
export function currentPlace(route, tree, known) {
  if (route === '') {
    return { section: null };
  }

  // Rule 2: the first child whose href path matches wins.
  for (const entry of tree) {
    for (const item of entry.items) {
      if (!item.children) continue;
      for (const child of item.children) {
        if (under(route, child.href.replace(/^#/, ''))) {
          return { section: entry.id, item: item.id, child: child.id };
        }
      }
    }
  }

  // Rule 3: among items whose href path matches, the one with the longest href wins.
  let best = null;
  let bestHrefLength = -1;
  for (const entry of tree) {
    for (const item of entry.items) {
      const path = item.href.replace(/^#/, '');
      if (path !== '' && under(route, path) && item.href.length > bestHrefLength) {
        best = { section: entry.id, item: item.id };
        bestHrefLength = item.href.length;
      }
    }
  }
  if (best) {
    return best;
  }

  // Rule 4: fall back to currentPart and look up the item by id.
  const id = currentPart(route, known);
  for (const entry of tree) {
    for (const item of entry.items) {
      if (item.id === id) {
        return { section: entry.id, item: id };
      }
    }
  }

  // A screen that is a section itself (Appearance, Privacy) and not one of its items: the section is open, no item.
  if (tree.some((entry) => entry.id === id)) {
    return { section: id };
  }

  // Rule 5: nothing matched.
  return { section: null };
}
