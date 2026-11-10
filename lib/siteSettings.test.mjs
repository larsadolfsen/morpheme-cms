// Tests of lib/siteSettings.mjs: the three site settings (files folder, testimonials page, contact anchor) with English
// defaults, and the old Danish value found in an existing site that pins nothing. Run: node --test lib/siteSettings.test.mjs
// The Danish values are the old ones on purpose (a live site keeps them), so each line that holds one says so.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reduceFacts, resolveSettings, settingProblems } from './siteSettings.mjs';

const OLD_FOLDER = 'public/filer'; // language-ok: the old Danish folder a live site keeps
const OLD_PAGE = '/udtalelser/'; // language-ok: the old Danish page address a live site keeps
const OLD_ANCHOR = 'find-vej'; // language-ok: the old Danish anchor a live site keeps
const OLD_HEADING = '## Find vej'; // language-ok: the heading that gives the old anchor

const config = (pinned = [], own = {}) => ({
  folders: { files: 'public/files' },
  testimonialsPath: '/testimonials/',
  contactAnchor: 'directions',
  pinned,
  ...own,
});
const facts = (own = {}) => ({ dirs: [], pageAddresses: ['/contact/'], contactText: '', ...own });
const entry = (settings, setting) => settings.report.find((r) => r.setting === setting);

describe('the files folder', () => {
  it('is public/files on a new site', () => {
    const s = resolveSettings(config(), facts());
    assert.equal(s.filesFolder, 'public/files');
    assert.equal(entry(s, 'folders.files').from, 'default');
    assert.deepEqual(s.warnings, []);
  });
  it('is public/files when only public/files exists', () => {
    const s = resolveSettings(config(), facts({ dirs: ['public/files'] }));
    assert.equal(s.filesFolder, 'public/files');
    assert.equal(entry(s, 'folders.files').from, 'default');
  });
  it('is the pinned old folder', () => {
    const s = resolveSettings(config(['folders.files'], { folders: { files: OLD_FOLDER } }), facts({ dirs: [OLD_FOLDER] }));
    assert.equal(s.filesFolder, OLD_FOLDER);
    assert.equal(entry(s, 'folders.files').from, 'pinned');
  });
  it('is detected when only the old folder exists and the site pins nothing', () => {
    const s = resolveSettings(config(), facts({ dirs: [OLD_FOLDER] }));
    assert.equal(s.filesFolder, OLD_FOLDER);
    const e = entry(s, 'folders.files');
    assert.equal(e.from, 'detected');
    assert.match(e.note, /public\/filer/); // language-ok: the old folder named in the note
    assert.match(e.note, /folders: \{ files: /);
    assert.deepEqual(s.warnings, []);
  });
  it('is the default with a warning when both folders exist and the site pins nothing', () => {
    const s = resolveSettings(config(), facts({ dirs: [OLD_FOLDER, 'public/files'] }));
    assert.equal(s.filesFolder, 'public/files');
    assert.equal(entry(s, 'folders.files').from, 'default');
    assert.equal(s.warnings.length, 1);
    assert.match(s.warnings[0], /public\/filer/); // language-ok: the old folder named in the warning
    assert.match(s.warnings[0], /folders: \{ files: /);
  });
  it('is the pinned new value while the old folder exists (the pin wins)', () => {
    const s = resolveSettings(config(['folders.files']), facts({ dirs: [OLD_FOLDER] }));
    assert.equal(s.filesFolder, 'public/files');
    assert.equal(entry(s, 'folders.files').from, 'pinned');
  });
  it('is the pinned old folder when both exist, without a warning', () => {
    const s = resolveSettings(config(['folders.files'], { folders: { files: OLD_FOLDER } }), facts({ dirs: [OLD_FOLDER, 'public/files'] }));
    assert.equal(s.filesFolder, OLD_FOLDER);
    assert.deepEqual(s.warnings, []);
  });
});

describe('the testimonials page', () => {
  it('is /testimonials/ on a new site', () => {
    const s = resolveSettings(config(), facts({ pageAddresses: ['/contact/', '/testimonials/'] }));
    assert.equal(s.testimonialsPath, '/testimonials/');
    assert.equal(entry(s, 'testimonialsPath').from, 'default');
  });
  it('is the pinned old address', () => {
    const s = resolveSettings(config(['testimonialsPath'], { testimonialsPath: OLD_PAGE }), facts({ pageAddresses: [OLD_PAGE] }));
    assert.equal(s.testimonialsPath, OLD_PAGE);
    assert.equal(entry(s, 'testimonialsPath').from, 'pinned');
  });
  it('is detected when only the old page exists and the site pins nothing', () => {
    const s = resolveSettings(config(), facts({ pageAddresses: ['/contact/', OLD_PAGE] }));
    assert.equal(s.testimonialsPath, OLD_PAGE);
    const e = entry(s, 'testimonialsPath');
    assert.equal(e.from, 'detected');
    assert.match(e.note, /testimonialsPath: /);
  });
  it('is the default when both pages exist', () => {
    const s = resolveSettings(config(), facts({ pageAddresses: [OLD_PAGE, '/testimonials/'] }));
    assert.equal(s.testimonialsPath, '/testimonials/');
    assert.equal(entry(s, 'testimonialsPath').from, 'default');
  });
  it('is the pinned new address while the old page exists (the pin wins)', () => {
    const s = resolveSettings(config(['testimonialsPath']), facts({ pageAddresses: [OLD_PAGE] }));
    assert.equal(s.testimonialsPath, '/testimonials/');
    assert.equal(entry(s, 'testimonialsPath').from, 'pinned');
  });
});

describe('the contact anchor', () => {
  it('is directions on a new site', () => {
    const s = resolveSettings(config(), facts({ contactText: '## Directions\n\nBy bus.' }));
    assert.equal(s.contactAnchor, 'directions');
    assert.equal(entry(s, 'contactAnchor').from, 'default');
  });
  it('is the pinned old anchor', () => {
    const s = resolveSettings(config(['contactAnchor'], { contactAnchor: OLD_ANCHOR }), facts({ contactText: OLD_HEADING }));
    assert.equal(s.contactAnchor, OLD_ANCHOR);
    assert.equal(entry(s, 'contactAnchor').from, 'pinned');
  });
  it('is detected from a heading whose slug is the old anchor', () => {
    const s = resolveSettings(config(), facts({ contactText: `# Contact\n\n${OLD_HEADING}\n\nBy bus.` }));
    assert.equal(s.contactAnchor, OLD_ANCHOR);
    const e = entry(s, 'contactAnchor');
    assert.equal(e.from, 'detected');
    assert.match(e.note, /contactAnchor: /);
  });
  it('is detected from the old id written out', () => {
    for (const text of [`<div id="${OLD_ANCHOR}"></div>`, `## Where {#${OLD_ANCHOR}}`, `[Map](#${OLD_ANCHOR})`]) {
      assert.equal(resolveSettings(config(), facts({ contactText: text })).contactAnchor, OLD_ANCHOR, text);
    }
  });
  it('does not take a longer word for the old anchor', () => {
    const s = resolveSettings(config(), facts({ contactText: `see ${OLD_ANCHOR}-more and x${OLD_ANCHOR}` }));
    assert.equal(s.contactAnchor, 'directions');
  });
  it('is the default when the page has both anchors', () => {
    const s = resolveSettings(config(), facts({ contactText: `${OLD_HEADING}\n\n## Directions\n` }));
    assert.equal(s.contactAnchor, 'directions');
    assert.equal(entry(s, 'contactAnchor').from, 'default');
  });
  it('is the default when the page has neither, or there is no contact text', () => {
    assert.equal(resolveSettings(config(), facts({ contactText: '## Opening hours' })).contactAnchor, 'directions');
    assert.equal(resolveSettings(config(), facts()).contactAnchor, 'directions');
  });
  it('is the pinned new anchor while the old one is on the page (the pin wins)', () => {
    const s = resolveSettings(config(['contactAnchor']), facts({ contactText: OLD_HEADING }));
    assert.equal(s.contactAnchor, 'directions');
    assert.equal(entry(s, 'contactAnchor').from, 'pinned');
  });
});

describe('the report', () => {
  it('has one entry for each setting, with a note', () => {
    const s = resolveSettings(config(), facts());
    assert.deepEqual(
      s.report.map((r) => r.setting),
      ['folders.files', 'testimonialsPath', 'contactAnchor'],
    );
    for (const r of s.report) assert.ok(r.note.length > 0);
  });
  it('gives the defaults to a hand-written config that has none of the settings', () => {
    const s = resolveSettings({}, facts());
    assert.deepEqual([s.filesFolder, s.testimonialsPath, s.contactAnchor], ['public/files', '/testimonials/', 'directions']);
  });
  it('treats a config without `pinned` as pinning nothing', () => {
    const { pinned, ...rest } = config();
    assert.equal(resolveSettings(rest, facts({ dirs: [OLD_FOLDER] })).filesFolder, OLD_FOLDER);
  });
});

describe('reduceFacts', () => {
  const chosen = (f) => {
    const s = resolveSettings(config(), f);
    return [s.filesFolder, s.testimonialsPath, s.contactAnchor];
  };
  it('gives the same settings as the whole facts', () => {
    for (const f of [
      facts(),
      facts({ dirs: [OLD_FOLDER], pageAddresses: [OLD_PAGE, '/grid/'], contactText: OLD_HEADING }),
      facts({
        dirs: [OLD_FOLDER, 'public/files'],
        pageAddresses: [OLD_PAGE, '/testimonials/'],
        contactText: `${OLD_HEADING}\n## Directions`,
      }),
      facts({ contactText: '## Directions' }),
    ])
      assert.deepEqual(chosen(reduceFacts(f)), chosen(f));
  });
  it('carries no page text and no other address', () => {
    const r = reduceFacts(facts({ pageAddresses: ['/grid/', OLD_PAGE], contactText: 'Hidden block text\n## Opening hours' }));
    assert.deepEqual(r.pageAddresses, [OLD_PAGE]);
    assert.equal(r.contactText, '');
  });
});

describe('settingProblems', () => {
  const settingsOf = (cfg, f = facts()) => resolveSettings(cfg, f);
  const run = (cfg, files = [], f = facts()) => settingProblems(cfg, settingsOf(cfg, f), files);

  it('finds nothing wrong in the defaults', () => {
    assert.deepEqual(run(config()), { problems: [], warnings: [] });
  });
  it('finds nothing wrong in the old values pinned', () => {
    const cfg = config(['folders.files', 'testimonialsPath', 'contactAnchor'], {
      folders: { files: OLD_FOLDER },
      testimonialsPath: OLD_PAGE,
      contactAnchor: OLD_ANCHOR,
    });
    assert.deepEqual(run(cfg, [], facts({ pageAddresses: [OLD_PAGE] })), { problems: [], warnings: [] });
  });
  it('stops at a testimonialsPath that does not start and end with a slash', () => {
    for (const value of ['testimonials/', '/testimonials', 'testimonials', '']) {
      const { problems } = run(config(['testimonialsPath'], { testimonialsPath: value }));
      assert.equal(problems.length, 1, value);
      assert.match(problems[0], /testimonialsPath/);
    }
  });
  it('stops at a contactAnchor that is not a plain slug', () => {
    for (const value of ['#directions', 'find the way', '', 'Directions']) {
      const { problems } = run(config(['contactAnchor'], { contactAnchor: value }));
      assert.equal(problems.length, 1, JSON.stringify(value));
      assert.match(problems[0], /contactAnchor/);
    }
  });
  it('stops at a files folder that is not under public/ or ends with a slash', () => {
    for (const value of ['files', 'public/files/', 'static/files', 'public/']) {
      const { problems } = run(config(['folders.files'], { folders: { files: value } }));
      assert.equal(problems.length, 1, value);
      assert.match(problems[0], /folders\.files/);
    }
  });
  it('does not check the shape of a setting the site did not set', () => {
    assert.deepEqual(run(config([], { testimonialsPath: 'bad' })).problems, []);
  });
  it('warns when the testimonials block is on a page and the testimonials page does not exist', () => {
    const files = [{ path: 'src/content/pages/home.md', text: '<div data-block="testimonials"></div>' }];
    const { problems, warnings } = run(config(), files);
    assert.deepEqual(problems, []);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /\/testimonials\//);
  });
  it('does not warn when the testimonials page exists, or no page has the block', () => {
    const files = [{ path: 'src/content/pages/home.md', text: '<div data-block="testimonials"></div>' }];
    assert.deepEqual(run(config(), files, facts({ pageAddresses: ['/testimonials/'] })).warnings, []);
    assert.deepEqual(run(config(), [{ path: 'src/content/pages/home.md', text: 'plain' }]).warnings, []);
  });
  it('warns, and does not stop, when both folders exist and the site pins nothing', () => {
    const { problems, warnings } = run(config(), [], facts({ dirs: [OLD_FOLDER, 'public/files'] }));
    assert.deepEqual(problems, []);
    assert.equal(warnings.length, 1);
  });
});
