// A site that posts the CMS's releases on its blog (its setting `releasePosts`, site/defineSite.mjs; Morpheme's own site,
// getmorpheme.com): each minute the Worker asks npm for the newest @morphemecms/cms, and when a new released version has
// release notes and the site has no post for it, it commits the post and its images (lib/releasePost.mjs) in one commit,
// which builds the site. So the post is out minutes after the owner has approved the release on npm. Exposes
// postRelease. Needs GITHUB_PUBLISH_TOKEN and the KV binding PUSH, where it keeps `cms:release-post`: the version it last
// looked at, and whether it was posted, had no notes, or failed (tried again after an hour). Depends on github.js and
// lib/{changelog,releasePost}.mjs; I/O is injected (`deps`).
import { config } from '@site/config';
import { cms as cmsEn } from '../src/i18n/en-US/cms';
import { cms as cmsDa } from '../src/i18n/da-DK/cms';
import { library as libraryEn } from '../src/i18n/en-US/library';
import { library as libraryDa } from '../src/i18n/da-DK/library';
import { gunzip } from '../lib/changelog.mjs';
import { postPath, releaseFromTar, releasePost } from '../lib/releasePost.mjs';
import { commitFiles, readFiles } from './github.js';

const NPM = 'https://registry.npmjs.org';
const NPM_NAME = '@morphemecms%2fcms';
const KEY = 'cms:release-post';
const HOUR = 60 * 60 * 1000;
const PLAIN = /^\d+\.\d+\.\d+$/;

const defaultDeps = { readFiles, commitFiles, fetch: (...args) => fetch(...args), config };

/** The site's texts: its own language, else the same language, else Danish (as cms-update.js). */
const textsOf = (locale) => {
  const code = String(locale ?? '');
  const english = code === 'en-US' || (code !== 'da-DK' && code.startsWith('en'));
  return english ? { cms: cmsEn, library: libraryEn } : { cms: cmsDa, library: libraryDa };
};

async function getJson(deps, url) {
  const res = await deps.fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** The version's npm tar, unzipped. */
async function tarOf(deps, version) {
  const manifest = await getJson(deps, `${NPM}/${NPM_NAME}/${version}`);
  const res = await deps.fetch(manifest.dist.tarball);
  if (!res.ok) throw new Error(`${res.status} ${manifest.dist.tarball}`);
  return gunzip(new Uint8Array(await res.arrayBuffer()));
}

/**
 * Each minute: posts npm's newest version on the site's blog, once. One npm request and one KV read when there is nothing
 * new. Never throws.
 * @returns {Promise<{ version: string, state: 'posted' | 'exists' | 'no-notes' | 'failed', at: string, commit?: string } | undefined>}
 *   what it kept, or undefined when it did nothing
 */
export async function postRelease(env, deps = defaultDeps, now = Date.now()) {
  const settings = deps.config.releasePosts;
  if (!settings || !env.GITHUB_PUBLISH_TOKEN || !env.PUSH) return undefined;
  let latest;
  try {
    latest = (await getJson(deps, `${NPM}/-/package/${NPM_NAME}/dist-tags`)).latest;
  } catch {
    return undefined;
  }
  if (!PLAIN.test(String(latest))) return undefined;
  const kept = await env.PUSH.get(KEY, 'json');
  if (kept?.version === latest && (kept.state !== 'failed' || now - Date.parse(kept.at) < HOUR)) return undefined;

  const at = new Date(now).toISOString();
  const keep = async (state, extra = {}) => {
    const value = { version: latest, state, at, ...extra };
    await env.PUSH.put(KEY, JSON.stringify(value));
    return value;
  };
  try {
    const { locale, folders } = deps.config;
    const release = releaseFromTar(await tarOf(deps, latest), latest, locale);
    if (!release) return await keep('no-notes');
    const { head, texts } = await deps.readFiles(env, [postPath(latest, folders.blog)]);
    if (texts[0] !== undefined) return await keep('exists');
    const { cms, library } = textsOf(locale);
    const name = release.edition ? library.cmsEdition(release.edition.name, latest) : library.cmsVersion(latest);
    const { files } = releasePost({
      version: latest,
      date: at.slice(0, 10),
      release,
      texts: { title: cms.newIn(name), also: cms.alsoInThisVersion, photo: cms.postPhoto },
      folders,
      categories: settings.categories ?? [],
    });
    const commit = await deps.commitFiles(env, head, cms.commitReleasePost(latest), files);
    return await keep('posted', { commit });
  } catch {
    return await keep('failed').catch(() => undefined);
  }
}
