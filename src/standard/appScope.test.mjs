// Tests for src/standard/appScope.tsx: the scope goes on the block's own outer element, so the theme's child and sibling rules still reach it.
// Bundled with esbuild (react external), as lib/contentColors.test.mjs does. Exposes nothing.
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';

let loaded;
async function modules() {
  loaded ??= (async () => {
    const root = new URL('../..', import.meta.url).pathname;
    const entry = `export { scoped, scopedNode, scopedPart } from './src/standard/appScope.tsx'; export { renderToStaticMarkup } from 'react-dom/server'; export { createElement } from 'react'; export { useState } from 'react';`;
    const { outputFiles } = await build({
      stdin: { contents: entry, resolveDir: root, loader: 'ts' },
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'node',
      jsx: 'automatic',
      external: ['react', 'react-dom'],
    });
    const file = `${root}.morpheme/appScope.test.bundle.mjs`;
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(`${root}.morpheme`, { recursive: true });
    writeFileSync(file, outputFiles[0].text);
    return import(file);
  })();
  return loaded;
}

test("the scope is on the block's own outer element, with no wrapper", async () => {
  const { scoped, renderToStaticMarkup, createElement } = await modules();
  const View = ({ text }) => createElement('section', { className: 'mo-is-in-text' }, text);
  const html = renderToStaticMarkup(createElement(scoped('shop', View), { text: 'Hi' }));
  assert.equal(html, '<section class="mo-is-in-text" data-mo-app="shop">Hi</section>');
});

test('a view with hooks still runs them', async () => {
  const { scoped, renderToStaticMarkup, createElement, useState } = await modules();
  const View = () => {
    const [n] = useState(3);
    return createElement('p', null, n);
  };
  assert.equal(renderToStaticMarkup(createElement(scoped('shop', View), {})), '<p data-mo-app="shop">3</p>');
});

test('a view without one element of its own gets a wrapper that takes no space', async () => {
  const { scoped, renderToStaticMarkup, createElement } = await modules();
  const View = () => createElement('i', null, 'a');
  const Two = () => [createElement('i', { key: 1 }, 'a'), createElement('b', { key: 2 }, 'b')];
  const Nested = () => createElement(View);
  assert.equal(
    renderToStaticMarkup(createElement(scoped('shop', Two), {})),
    '<div data-mo-app="shop" style="display:contents"><i>a</i><b>b</b></div>',
  );
  assert.match(
    renderToStaticMarkup(createElement(scoped('shop', Nested), {})),
    /^<div data-mo-app="shop" style="display:contents"><i>a<\/i><\/div>$/,
  );
  assert.equal(
    renderToStaticMarkup(
      createElement(
        scoped('shop', () => null),
        {},
      ),
    ),
    '',
  );
});

test("an app's promotion part is drawn in the app's scope, the same component each time", async () => {
  const { scopedPart, renderToStaticMarkup, createElement } = await modules();
  const Part = ({ view, button }) => createElement('form', { className: 'mo-block-buttons__form' }, view, button);
  assert.equal(scopedPart('shop', Part), scopedPart('shop', Part));
  assert.notEqual(scopedPart('shop', Part), scopedPart('other', Part));
  const html = renderToStaticMarkup(createElement(scopedPart('shop', Part), { view: 'Sign up', button: null }));
  assert.equal(html, '<form class="mo-block-buttons__form" data-mo-app="shop">Sign up</form>');
});
