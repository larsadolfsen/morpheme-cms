// Tests of lib/siteFacts.mjs: what a site's files tell the site settings. Run: node --test lib/siteFacts.test.mjs
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectFacts } from './siteFacts.mjs';

const OLD_FOLDER = 'public/filer'; // language-ok: the old Danish folder a live site keeps
const write = (root, path, text) => {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), text);
};
const site = () => mkdtempSync(join(tmpdir(), 'facts-'));

describe('detectFacts', () => {
  it('gives empty facts for a folder with nothing in it, and never throws', () => {
    assert.deepEqual(detectFacts(site()), { dirs: [], pageAddresses: [], contactText: '' });
    assert.deepEqual(detectFacts(join(site(), 'missing')), { dirs: [], pageAddresses: [], contactText: '' });
  });

  it('lists which of the two files folders are directories', () => {
    const root = site();
    mkdirSync(join(root, OLD_FOLDER), { recursive: true });
    assert.deepEqual(detectFacts(root).dirs, [OLD_FOLDER]);
    mkdirSync(join(root, 'public/files'), { recursive: true });
    assert.deepEqual(detectFacts(root).dirs, [OLD_FOLDER, 'public/files']);
  });

  it('does not count a file named like the folder', () => {
    const root = site();
    write(root, 'public/files', 'not a folder');
    assert.deepEqual(detectFacts(root).dirs, []);
  });

  it('gives the address of each page: its front matter path, else its name', () => {
    const root = site();
    write(root, 'src/content/pages/about.md', '---\ntitle: "About"\n---\nText');
    write(root, 'src/content/pages/team/jane.md', '---\ntitle: Jane\n---\n');
    write(root, 'src/content/pages/jobs.md', '---\npath: "/careers/"\ntitle: Jobs\n---\n');
    write(root, 'src/content/pages/readme.txt', 'not a page');
    assert.deepEqual(detectFacts(root).pageAddresses.sort(), ['/about/', '/careers/', '/team/jane/']);
  });

  it('reads the pages folder the site names', () => {
    const root = site();
    write(root, 'content/p/about.md', '---\ntitle: About\n---\n');
    assert.deepEqual(detectFacts(root, { pages: 'content/p' }).pageAddresses, ['/about/']);
  });

  it('gives the text of the contact page named in standard-pages.json', () => {
    const root = site();
    write(root, 'src/data/standard-pages.json', JSON.stringify({ contact: '/contact/' }));
    write(root, 'src/content/pages/contact.md', '---\ntitle: Contact\n---\n## Directions\n');
    write(root, 'src/content/pages/about.md', '---\ntitle: About\n---\nOther');
    assert.match(detectFacts(root).contactText, /## Directions/);
    assert.doesNotMatch(detectFacts(root).contactText, /Other/);
  });

  it('finds a contact page by its path in the front matter', () => {
    const root = site();
    write(root, 'src/data/standard-pages.json', JSON.stringify({ contact: '/get-in-touch/' }));
    write(root, 'src/content/pages/contact.md', '---\npath: /get-in-touch/\n---\nHello');
    assert.match(detectFacts(root).contactText, /Hello/);
  });

  it('gives no contact text when the file, the page or the JSON is missing or wrong', () => {
    const root = site();
    assert.equal(detectFacts(root).contactText, '');
    write(root, 'src/data/standard-pages.json', JSON.stringify({ contact: '/nowhere/' }));
    assert.equal(detectFacts(root).contactText, '');
    write(root, 'src/data/standard-pages.json', '{ not json');
    assert.equal(detectFacts(root).contactText, '');
    write(root, 'src/data/standard-pages.json', JSON.stringify({}));
    assert.equal(detectFacts(root).contactText, '');
  });
});
