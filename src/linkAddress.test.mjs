import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { nameOf, problemOf, shownAddress, typedLink } from './linkAddress.mjs';

test('typedLink gives https:// to an address without a scheme', () => {
  assert.equal(typedLink('instagram.com/acme'), 'https://instagram.com/acme');
  assert.equal(typedLink('  //instagram.com/acme '), 'https://instagram.com/acme');
});

test('typedLink gives https:// to a host with a port', () => {
  assert.equal(typedLink('www.facebook.com:443/acme'), 'https://www.facebook.com:443/acme');
  assert.equal(typedLink('localhost:8080'), 'https://localhost:8080');
});

test('typedLink keeps a real scheme', () => {
  assert.equal(typedLink('mailto:a@b.dk'), 'mailto:a@b.dk');
  assert.equal(typedLink('ftp://x.dk/a'), 'ftp://x.dk/a');
});

test('typedLink changes http:// to https:// in any case', () => {
  assert.equal(typedLink('http://x'), 'https://x');
  assert.equal(typedLink('HTTP://x'), 'https://x');
  assert.equal(typedLink('HTTPS://x'), 'HTTPS://x');
});

test('typedLink of nothing is nothing', () => {
  assert.equal(typedLink(''), '');
  assert.equal(typedLink('   '), '');
});

const rules = { pattern: /** @type {[string, string]} */ (['^https://\\S+$', 'not https']), noAddress: 'none', twice: 'twice' };

test('problemOf: no address, not one, twice, and fine', () => {
  const urls = ['https://a.dk/x', 'https://b.dk/y'];
  assert.equal(problemOf('', null, urls, rules), 'none');
  assert.equal(problemOf('ftp://a', null, urls, rules), 'not https');
  assert.equal(problemOf('https://a.dk/x', null, urls, rules), 'twice');
  assert.equal(problemOf('https://c.dk', null, urls, rules), null);
});

test('problemOf: a link is not a duplicate of itself', () => {
  const urls = ['https://a.dk/x', 'https://b.dk/y'];
  assert.equal(problemOf('https://a.dk/x', 0, urls, rules), null);
  assert.equal(problemOf('https://a.dk/x', 1, urls, rules), 'twice');
});

test('problemOf: the same address in another case or with a slash is twice', () => {
  const urls = ['https://www.facebook.com/acme'];
  assert.equal(problemOf('https://WWW.FACEBOOK.com/acme/', null, urls, rules), 'twice');
});

test('nameOf and shownAddress', () => {
  assert.equal(nameOf('https://www.facebook.com/acme'), 'Facebook');
  assert.equal(nameOf('https://www.example.com/a'), 'example.com');
  assert.equal(nameOf('nonsense'), 'nonsense');
  assert.equal(shownAddress('https://example.com/a/'), 'example.com/a');
});
