// The tools an assistant calls on the site (the MCP server, worker/mcp.js), all read-only in this version: site_info,
// list_content, read_content, list_apps, read_app_settings. They read the site's files through `site` (the Worker gives the
// files as the signed-in person may read them), so what an assistant sees is what that person sees in the repository.
// Exposes createTools. Depends on lib/blocks.mjs, lib/appsFile.mjs and src/frontmatter.mjs. No node: imports, so the Worker can use it.
import { activeOf, readAppsFile } from './appsFile.mjs';
import { blocksIn } from './blocks.mjs';
import { readFields, splitFrontmatter } from '../src/frontmatter.mjs';

/**
 * @typedef {{ path: string, oid: string }} SiteFile
 * @typedef {{
 *   config: { name: string, domain?: string, siteDescription?: string, locale: string, repo: { owner: string, name: string, branch?: string },
 *     folders: { pages: string, blog: string }, apps: { installed: string, settings: string, folder: string }, theme: string },
 *   files: (folders: string[], depth: number) => Promise<SiteFile[]>,
 *   texts: (oids: string[]) => Promise<Map<string, string | null | undefined>>,
 *   status?: () => Promise<unknown>,
 * }} Site
 */

const STATUSES = ['published', 'draft', 'scheduled'];
const KINDS = ['page', 'post'];
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;
const MAX_BODY = 200_000;
// Field names that hold a credential, whether or not the app marked them: never given to an assistant.
const SECRET_NAME = /secret|token|password|passwd|api[-_]?key|private[-_]?key|credential/i;
const APP_ID = /^[a-z0-9][a-z0-9-]*$/;

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const object = (properties = {}) => ({ type: 'object', properties, additionalProperties: false });

const TOOLS = [
  {
    name: 'site_info',
    title: 'Site information',
    description:
      "The site's name, language, theme and address, how many pages, posts and apps it has, and the state of GitHub and Cloudflare.",
    inputSchema: object(),
    annotations: readOnly,
  },
  {
    name: 'list_content',
    title: 'List pages and posts',
    description:
      'Pages and blog posts with their address, title, status (published, draft or scheduled) and language. Filter by kind, status or text.',
    inputSchema: object({
      kind: { type: 'string', enum: KINDS, description: 'Only pages, or only blog posts.' },
      status: { type: 'string', enum: STATUSES },
      text: { type: 'string', description: 'Only those whose title or address contains this text.' },
      limit: { type: 'integer', minimum: 1, maximum: MAX_LIMIT, description: `At most this many (default ${DEFAULT_LIMIT}).` },
    }),
    annotations: readOnly,
  },
  {
    name: 'read_content',
    title: 'Read a page or post',
    description:
      'One page or blog post: its fields, its text (Markdown) and the blocks in it, as the editor has them. Give its address (as list_content shows it) or its file.',
    inputSchema: object({
      address: { type: 'string', description: 'The address, such as /about/.' },
      file: { type: 'string', description: 'The file, as list_content shows it.' },
    }),
    annotations: readOnly,
  },
  {
    name: 'list_apps',
    title: 'List apps',
    description: 'The apps installed on the site, with their name, version and whether they are on. Secrets are never included.',
    inputSchema: object(),
    annotations: readOnly,
  },
  {
    name: 'read_app_settings',
    title: 'Read an app’s settings',
    description: "One installed app's settings as saved. A field that holds a secret, such as a token or a key, is left out.",
    inputSchema: { ...object({ app: { type: 'string', description: 'The app id, as list_apps shows it.' } }), required: ['app'] },
    annotations: readOnly,
  },
];

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const parse = (text) => {
  try {
    const value = JSON.parse(text ?? '');
    return isObject(value) ? value : {};
  } catch {
    return {};
  }
};
const asText = (v) => (v === undefined || v === null || v === '' ? undefined : String(v));
const statusOf = (s) => (STATUSES.includes(s) ? s : 'published');
const slugOf = (path) => path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '');

/** The tools and the function that runs one, over a site. @param {Site} site */
export function createTools(site) {
  const { config } = site;
  const folders = [
    { kind: 'page', folder: config.folders.pages },
    { kind: 'post', folder: config.folders.blog },
  ];

  /** The text of files by their paths, from one listing (undefined: the file is not there). @param {string[]} paths */
  async function textsAt(paths, listing) {
    const wanted = paths.map((p) => listing.find((f) => f.path === p));
    const texts = await site.texts(wanted.filter(Boolean).map((f) => f.oid));
    return paths.map((p, i) => (wanted[i] ? (texts.get(wanted[i].oid) ?? undefined) : undefined));
  }

  /** Every page and post with its parsed front matter and body. */
  async function content() {
    const listing = await site.files(
      folders.map((f) => f.folder),
      3,
    );
    const markdown = listing.filter((f) => f.path.endsWith('.md'));
    const texts = await site.texts(markdown.map((f) => f.oid));
    return markdown.flatMap((file) => {
      const text = texts.get(file.oid);
      const where = folders.find((f) => file.path.startsWith(`${f.folder}/`));
      if (typeof text !== 'string' || !where) return [];
      const { yaml, body } = splitFrontmatter(text);
      let fields;
      try {
        fields = readFields(yaml);
      } catch {
        fields = {};
      }
      const address = asText(fields.path) ?? `/${slugOf(file.path)}/`;
      return [{ file: file.path, kind: where.kind, fields, body, address }];
    });
  }

  const summary = (e) => ({
    kind: e.kind,
    address: e.address,
    title: String(e.fields.title ?? e.file),
    status: statusOf(e.fields.status),
    language: config.locale,
    file: e.file,
    ...(asText(e.fields.publishAt) ? { publishAt: asText(e.fields.publishAt) } : {}),
    ...(asText(e.fields.date) ? { date: asText(e.fields.date) } : {}),
  });

  async function siteInfo() {
    const entries = await content();
    const [apps, theme] = await filesOf([config.apps.installed, config.theme]);
    const state = readAppsFile(apps);
    const data = {
      name: config.name,
      description: config.siteDescription ?? null,
      domain: config.domain ?? null,
      language: config.locale,
      theme: asText(parse(theme).theme) ?? null,
      pages: entries.filter((e) => e.kind === 'page').length,
      posts: entries.filter((e) => e.kind === 'post').length,
      apps: { installed: state.installed.length, active: activeOf(state).length },
      repository: `${config.repo.owner}/${config.repo.name}`,
    };
    if (site.status) {
      try {
        data.services = await site.status();
      } catch {
        // The state of GitHub and Cloudflare is a courtesy: the rest is still right.
      }
    }
    return { text: `${data.name}: ${data.pages} pages, ${data.posts} posts, ${data.apps.active} apps on.`, data };
  }

  /** The texts of single files by path (undefined when not there): the folder listing of each file's folder. */
  async function filesOf(paths) {
    const dirs = [...new Set(paths.map((p) => p.slice(0, p.lastIndexOf('/'))))];
    const listing = await site.files(dirs, 1);
    return textsAt(paths, listing);
  }

  async function listContent(args) {
    const { kind, status, text } = args;
    let { limit } = args;
    if (kind !== undefined && !KINDS.includes(kind)) return { error: `kind must be one of: ${KINDS.join(', ')}.` };
    if (status !== undefined && !STATUSES.includes(status)) return { error: `status must be one of: ${STATUSES.join(', ')}.` };
    if (limit !== undefined && !(Number.isInteger(limit) && limit >= 1 && limit <= MAX_LIMIT))
      return { error: `limit must be a whole number from 1 to ${MAX_LIMIT}.` };
    if (text !== undefined && typeof text !== 'string') return { error: 'text must be text.' };
    limit ??= DEFAULT_LIMIT;
    const needle = text?.toLowerCase();
    const found = (await content())
      .map(summary)
      .filter((i) => (!kind || i.kind === kind) && (!status || i.status === status))
      .filter((i) => !needle || i.title.toLowerCase().includes(needle) || i.address.toLowerCase().includes(needle))
      .sort((a, b) => a.kind.localeCompare(b.kind) || a.address.localeCompare(b.address));
    const data = { total: found.length, items: found.slice(0, limit) };
    return { text: `${data.total} found${data.total > data.items.length ? `, ${data.items.length} shown` : ''}.`, data };
  }

  async function readContent({ address, file }) {
    if (typeof address !== 'string' && typeof file !== 'string') return { error: 'Give an address or file.' };
    const wanted = typeof address === 'string' ? `/${address.replace(/^\/+|\/+$/g, '')}/` : undefined;
    const entry = (await content()).find((e) => (wanted ? e.address === wanted : e.file === file));
    if (!entry) return { error: 'No page or post there.' };
    if (entry.body.length > MAX_BODY) return { error: 'The text is too long to read in one call.' };
    const data = {
      ...summary(entry),
      fields: entry.fields,
      body: entry.body,
      blocks: blocksIn(entry.body),
    };
    return { text: `${data.title} (${data.address}), ${data.status}.`, data };
  }

  /** The apps' manifests by id, from one listing of the apps' folder. */
  async function manifests(ids) {
    const listing = await site.files([config.apps.folder], 2);
    const texts = await textsAt(
      ids.map((id) => `${config.apps.folder}/${id}/app.json`),
      listing,
    );
    return texts.map((t) => parse(t));
  }

  async function installed() {
    const [text] = await filesOf([config.apps.installed]);
    return readAppsFile(text);
  }

  async function listApps() {
    const state = await installed();
    const found = await manifests(state.installed);
    const apps = state.installed.map((id, i) => ({
      id,
      name: asText(found[i].label) ?? id,
      version: asText(found[i].version) ?? null,
      on: !state.off.includes(id),
    }));
    return { text: `${apps.length} apps installed.`, data: { apps } };
  }

  async function readAppSettings({ app }) {
    if (typeof app !== 'string' || !app) return { error: 'Give the app id.' };
    const state = await installed();
    if (!APP_ID.test(app) || !state.installed.includes(app))
      return { error: `The app ${JSON.stringify(app).slice(0, 60)} is not installed.` };
    const [manifest] = await manifests([app]);
    const [saved] = await filesOf([`${config.apps.settings}/${app}.json`]);
    const defined = isObject(manifest.settings) ? manifest.settings : {};
    const secret = new Set([
      ...(Array.isArray(defined.fields) ? defined.fields.filter((f) => isObject(f) && f.secret === true).map((f) => String(f.name)) : []),
    ]);
    const merged = { ...(isObject(defined.values) ? defined.values : {}), ...parse(saved) };
    const settings = {};
    let hidden = 0;
    for (const [name, value] of Object.entries(merged)) {
      if (secret.has(name) || SECRET_NAME.test(name)) hidden++;
      else settings[name] = value;
    }
    // A secret field with no value yet is still a hidden field.
    for (const name of secret) if (!(name in merged)) hidden++;
    return { text: `Settings of ${asText(manifest.label) ?? app}.`, data: { app, settings, hidden } };
  }

  const handlers = {
    site_info: siteInfo,
    list_content: listContent,
    read_content: readContent,
    list_apps: listApps,
    read_app_settings: readAppSettings,
  };

  return {
    tools: TOOLS,
    /** @param {string} name @param {Record<string, any>} args */
    call: async (name, args) => (Object.hasOwn(handlers, name) ? handlers[name](args ?? {}) : undefined),
  };
}
