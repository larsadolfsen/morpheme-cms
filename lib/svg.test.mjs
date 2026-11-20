// Tests for lib/svg.mjs: cleanSvg keeps only what draws. Every case here is something an SVG from an upload, a theme or
// an app of the store could try; none of it may come out of cleanSvg.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanSvg, svgHtml, svgParts } from './svg.mjs';

const wrap = (inner, attributes = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"${attributes}>${inner}</svg>`;
const clean = (file, options) => cleanSvg(file, options)?.svg;
/** What must never be in a cleaned file, wherever it came from. */
const DANGER = /javascript:|<script|\son[a-z]+=|foreignObject|evil\.example|<a[\s>]|<set\b|<animate|file:|xml:base/i;

test('an icon is kept: its viewBox and what draws', () => {
  const result = cleanSvg(wrap('<path d="M0 0h24v24H0z" fill="#000"/>'));
  assert.equal(result.viewBox, '0 0 24 24');
  assert.equal(result.inner, '<path d="M0 0h24v24H0z" fill="#000"/>');
  assert.deepEqual(result.removed, []);
});

test('scripts, event handlers and elements that run or embed code are left out', () => {
  const dirty = {
    script: wrap('<script>alert(1)</script>'),
    onload: wrap('<rect onload="alert(1)"/>', ' onclick="alert(1)"'),
    prefixedScript: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg"><s:script>alert(1)</s:script></svg>`,
    link: wrap('<a href="javascript:alert(1)"><rect/></a>'),
    animation: wrap(
      '<use href="#a"><set attributeName="href" to="javascript:alert(1)"/></use><animate attributeName="href" to="javascript:alert(1)"/>',
    ),
    inNamespaceOnly: wrap('<foo:script xmlns:foo="http://example.com/">alert(1)</foo:script>'),
  };
  for (const [name, file] of Object.entries(dirty)) {
    const result = cleanSvg(file, { style: true });
    assert.ok(result, name);
    assert.doesNotMatch(result.svg, DANGER, name);
    assert.ok(result.removed.length, `${name} is reported as removed`);
  }
});

test('foreignObject (HTML inside the SVG) makes the file unreadable or is left out', () => {
  const result = cleanSvg(
    wrap('<foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"/></div></foreignObject>'),
  );
  assert.ok(result === null || !/foreignObject|onerror|<div/.test(result.svg));
});

test('a link goes only to an id in the file', () => {
  assert.equal(clean(wrap('<use href="#a"/>')).includes('href="#a"'), true);
  for (const href of ['javascript:alert(1)', 'https://evil.example/x.svg#a', 'data:image/svg+xml,%3Csvg/%3E#a', '//evil.example/x#a'])
    assert.doesNotMatch(clean(wrap(`<use href="${href}"/>`)), /href/, href);
  const xlink = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="https://evil.example/x#a"/></svg>`;
  assert.doesNotMatch(clean(xlink), /evil|href/);
});

test('an image inside the file is a data: PNG, JPEG, WebP or GIF, and nothing else', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  assert.match(clean(wrap(`<image href="${png}" width="1" height="1"/>`)), /href="data:image\/png/);
  for (const href of ['data:image/svg+xml;base64,PHN2Zz4=', 'https://evil.example/x.png', 'data:text/html;base64,PGI+', '/logo.png'])
    assert.doesNotMatch(clean(wrap(`<image href="${href}"/>`)), /href/, href);
});

test('CSS that loads or runs something is left out of attributes and <style>, however it is written', () => {
  const css = [
    'fill:url(https://evil.example/x)',
    'fill:URL( https://evil.example/x)',
    'fill:url(\n http://evil.example)',
    'fill:&#117;rl(https://evil.example/x)',
    'fill:\\75rl(https://evil.example/x)',
    'background:image-set("https://evil.example/x" 1x)',
    'background:-webkit-image-set("https://evil.example/x" 1x)',
    'behavior:expression(alert(1))',
    'background:javascript:alert(1)',
  ];
  for (const value of css) {
    const asAttribute = clean(wrap(`<rect style="${value.replace(/"/g, '&quot;')}"/>`));
    assert.ok(asAttribute, `style="${value}" is still one readable file`);
    assert.doesNotMatch(asAttribute, /evil|expression|javascript|image-set/i, `style="${value}"`);
    const inStyle = clean(wrap(`<style>rect{${value.replace(/&#117;/, 'u')}}</style>`), { style: true });
    assert.doesNotMatch(inStyle, /evil|expression|javascript|image-set/i, `<style>${value}`);
  }
  assert.doesNotMatch(clean(wrap('<style>@import "https://evil.example/x.css";</style>'), { style: true }), /import|evil/);
  assert.doesNotMatch(clean(wrap('<style>@font-face{src:url(https://evil.example/f.woff)}</style>'), { style: true }), /evil/);
  assert.doesNotMatch(clean(wrap('<style><![CDATA[rect{background:url(http://evil.example)}]]></style>'), { style: true }), /evil/);
  for (const attribute of ['fill', 'stroke', 'mask', 'clip-path', 'filter'])
    assert.doesNotMatch(clean(wrap(`<rect ${attribute}="url(https://evil.example/x)"/>`)), /evil/, attribute);
});

test('a reference to an id in the file is kept in CSS and attributes', () => {
  assert.match(clean(wrap('<rect fill="url(#g)"/>')), /fill="url\(#g\)"/);
  assert.match(clean(wrap('<rect style="fill:url( &quot;#g&quot; )"/>')), /style=/);
});

test('<style> is kept only for a file shown on its own (the logo), never for an icon', () => {
  const file = wrap('<style>rect{fill:red}</style><rect/>');
  assert.match(clean(file, { style: true }), /<style>rect\{fill:red\}<\/style>/);
  assert.doesNotMatch(clean(file), /<style/);
  assert.doesNotMatch(cleanSvg(file).inner, /<style/);
});

test('a style element holding markup cannot close itself early', () => {
  const out = clean(wrap('<style>rect{fill:red}&lt;/style&gt;&lt;script&gt;alert(1)&lt;/script&gt;</style>'), { style: true });
  assert.doesNotMatch(out, /<script|<\/style><script/i);
});

test("the file's own entities are put in, anything else of a DOCTYPE is not", () => {
  const old = `<!DOCTYPE svg [<!ENTITY ns_svg "http://www.w3.org/2000/svg">]><svg xmlns="&ns_svg;" viewBox="0 0 1 1"><rect/></svg>`;
  assert.match(clean(old), /<rect\/>/);
  assert.equal(
    cleanSvg(`<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"><text>&x;</text></svg>`),
    null,
  );
  // An entity that names another entity would grow without end (a billion laughs), so it is refused.
  assert.equal(
    cleanSvg(`<!DOCTYPE svg [<!ENTITY a "aaaa"><!ENTITY b "&a;&a;&a;&a;">]><svg xmlns="http://www.w3.org/2000/svg">&b;</svg>`),
    null,
  );
});

test('a file that is not one well-formed <svg> is null', () => {
  for (const file of [
    undefined,
    '',
    'text',
    '<svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"></g></svg>',
    '<html></html>',
    wrap('') + wrap(''),
    'x' + wrap(''),
    '<svg xmlns="http://example.com/"/>',
  ])
    assert.equal(cleanSvg(file), null, String(file));
});

test('xml:base and other xml: attributes are dropped', () => {
  assert.doesNotMatch(clean(wrap('<rect/>', ' xml:base="https://evil.example/"')), /xml:base|evil/);
});

test('a viewBox that is not four numbers is dropped', () => {
  assert.equal(cleanSvg(wrap('<rect/>', '').replace('0 0 24 24', 'javascript:alert(1)')).viewBox, undefined);
  assert.equal(cleanSvg(wrap('<rect/>').replace('0 0 24 24', '0 -960 960 960')).viewBox, '0 -960 960 960');
});

test('what is written is built from the parts read: quotes and angle brackets in values cannot break out', () => {
  const out = clean(wrap('<rect id="a&quot; onload=&quot;alert(1)"/><text>&lt;img src=x onerror=alert(1)&gt;</text>'));
  assert.doesNotMatch(out, /<img|"\sonload=/);
  assert.match(out, /id="a&quot; onload=&quot;alert\(1\)"/);
});

test('svgParts and svgHtml draw only the cleaned inside, at the size given, in the text colour', () => {
  const file = wrap('<script>alert(1)</script><path d="M0 0h1v1z"/>');
  assert.deepEqual(svgParts(file), { viewBox: '0 0 24 24', inner: '<path d="M0 0h1v1z"/>' });
  const html = svgHtml(file, 20);
  assert.match(html, /^<svg width="20" height="20" fill="currentColor" aria-hidden="true"/);
  assert.doesNotMatch(html, /script/i);
  assert.equal(svgHtml(undefined, 20), '');
  assert.equal(svgHtml('not svg', 20), '');
});

test('an icon drawn inside a page keeps nothing of the <svg> element itself', () => {
  // A position:fixed, class or style on the root would cover the page the icon is drawn in; svgHtml writes its own root.
  const html = svgHtml(wrap('<rect/>', ' style="position:fixed;inset:0;width:100vw;height:100vh" class="fixed inset-0"'), 24);
  assert.doesNotMatch(html, /position|inset|class=|style=/);
});
