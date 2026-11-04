// The site's social settings (src/data/social.json, Company > Social media in the editor): its profiles, for the structured
// data (sameAs), and the share buttons under a blog post, with their addresses. Exposes socialOf, shareLinks, sameAsOf.

export const PROFILE_IDS = /** @type {const} */ (['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok', 'pinterest']);
export const SHARE_IDS = /** @type {const} */ (['facebook', 'x', 'linkedin', 'pinterest', 'copy-link']);
/** @typedef {(typeof PROFILE_IDS)[number]} ProfileId */
/** @typedef {(typeof SHARE_IDS)[number]} ShareId */
/** @typedef {{ profiles: { id: ProfileId, url: string }[], share: ShareId[] }} Social */

/**
 * @param {Record<string, unknown> | undefined} raw
 * @returns {Social}
 */
export function socialOf(raw) {
  const data = raw || {};

  // Profiles
  const profiles = [];
  for (const id of PROFILE_IDS) {
    const value = data[id];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '') {
        profiles.push({ id, url: trimmed });
      }
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
