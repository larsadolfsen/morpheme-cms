// The site's social settings (src/data/social.json, Business › Social media in the editor): its profiles, a list of
// links the owner adds ({ profiles: [{ url }] }), each one's network known by its address (networkOf), for the
// structured data (sameAs); and the share buttons under a blog post, with their addresses. A file written before the
// profiles were a list has a key for each of seven networks ("facebook": "https://…"): upgradeSocial makes it a list.
// Exposes NETWORKS, networkOf, upgradeSocial, socialOf, shareLinks, sameAsOf.

/**
 * The networks known by their addresses: for now those a post can be shared on (SHARE_IDS). The id, the name (a brand, the
 * same in every language) and the hosts (one ending in ".*" is that name with any ending: pinterest.dk). A host matches
 * itself and any address under it (www.facebook.com, dk.linkedin.com). A link to any other site is a profile too, shown by
 * its host.
 */
export const NETWORKS = /** @type {const} */ ([
  { id: 'facebook', name: 'Facebook', hosts: ['facebook.com', 'fb.com', 'fb.me'] },
  { id: 'x', name: 'X', hosts: ['x.com', 'twitter.com'] },
  { id: 'linkedin', name: 'LinkedIn', hosts: ['linkedin.com', 'lnkd.in'] },
  { id: 'pinterest', name: 'Pinterest', hosts: ['pinterest.*', 'pin.it'] },
]);

/** The keys of a file from before the profiles were a list, one for each network, in the order they had. */
const OLD_KEYS = ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok', 'pinterest'];
export const SHARE_IDS = /** @type {const} */ (['facebook', 'x', 'linkedin', 'pinterest', 'copy-link']);
/** @typedef {(typeof NETWORKS)[number]['id']} NetworkId */
/** @typedef {(typeof SHARE_IDS)[number]} ShareId */
/** @typedef {{ id: NetworkId | null, url: string }} Profile */
/** @typedef {{ profiles: Profile[], share: ShareId[] }} Social */

/**
 * The host of an address, in small letters and without "www.": '' for one that is not an address.
 * @param {string} url
 */
export function hostOf(url) {
  try {
    return new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** @param {string} host @param {string} known */
function hostIs(host, known) {
  if (known.endsWith('.*')) return new RegExp(`(^|\\.)${known.slice(0, -2)}\\.[a-z]{2,}(\\.[a-z]{2,})?$`).test(host);
  return host === known || host.endsWith(`.${known}`);
}

/**
 * The network an address is a profile on, by its host; null for one not known (or not an address).
 * @param {string} url
 * @returns {(typeof NETWORKS)[number] | null}
 */
export function networkOf(url) {
  const host = hostOf(url);
  if (!host) return null;
  return NETWORKS.find((n) => n.hosts.some((h) => hostIs(host, h))) ?? null;
}

/**
 * The file's data as it is written now: one from before the profiles were a list has its filled keys
 * ("facebook": "https://…") as links in the list, where the first of them was, in their order, after any the
 * list has; the other keys stay as and where they were. A file without those keys is given back as it is.
 * @param {Record<string, unknown>} data
 * @returns {Record<string, unknown>}
 */
export function upgradeSocial(data) {
  if (!OLD_KEYS.some((k) => k in data)) return data;
  const kept = Array.isArray(data.profiles) ? data.profiles : [];
  const old = OLD_KEYS.map((k) => data[k])
    .filter((v) => typeof v === 'string' && v.trim() !== '')
    .map((v) => ({ url: /** @type {string} */ (v).trim() }));
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'profiles' || OLD_KEYS.includes(key)) {
      if (!('profiles' in out)) out.profiles = [...kept, ...old];
    } else out[key] = value;
  }
  return out;
}

/**
 * @param {Record<string, unknown> | undefined} raw
 * @returns {Social}
 */
export function socialOf(raw) {
  const data = upgradeSocial(raw || {});

  // Profiles: the filled links, in their order, each with its network (null: one not known).
  const profiles = [];
  for (const item of Array.isArray(data.profiles) ? data.profiles : []) {
    const value = item && typeof item === 'object' ? item.url : undefined;
    if (typeof value === 'string' && value.trim() !== '') {
      const url = value.trim();
      profiles.push({ id: networkOf(url)?.id ?? null, url });
    }
  }

  // Share switches
  const switchMap = {
    facebook: 'shareFacebook',
    x: 'shareX',
    linkedin: 'shareLinkedin',
    pinterest: 'sharePinterest',
    'copy-link': 'shareCopyLink',
  };

  const share = [];
  for (const id of SHARE_IDS) {
    const key = switchMap[id];
    const val = data[key];
    if (val !== false) {
      share.push(id);
    }
  }

  return { profiles, share };
}

/**
 * @param {{ url: string, title: string, picture?: string }} post
 * @param {ShareId[]} share
 * @returns {{ id: ShareId, href?: string }[]}
 */
export function shareLinks(post, share) {
  const links = [];
  const url = encodeURIComponent(post.url);
  const title = encodeURIComponent(post.title);
  const picture = post.picture ? encodeURIComponent(post.picture) : '';

  for (const id of share) {
    let item = { id };

    if (id === 'facebook') {
      item.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (id === 'x') {
      item.href = `https://x.com/intent/post?url=${url}&text=${title}`;
    } else if (id === 'linkedin') {
      item.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    } else if (id === 'pinterest') {
      if (post.picture && post.picture !== '') {
        item.href = `https://pinterest.com/pin/create/button/?url=${url}&media=${picture}&description=${title}`;
      } else {
        continue;
      }
    } else if (id === 'copy-link') {
      // No href, just { id: 'copy-link' }
    }

    links.push(item);
  }

  return links;
}

/**
 * @param {Social['profiles']} profiles
 * @returns {string[]}
 */
export function sameAsOf(profiles) {
  return profiles.map((p) => p.url);
}
