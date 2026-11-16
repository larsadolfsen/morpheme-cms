import assert from 'node:assert/strict';
import { test } from 'node:test';
import { editorAddressOf, editorAddressProblems } from './editorAddress.mjs';

test('a page at /edit/ or /editor/ is reported, by its path or by its file name', () => {
  assert.equal(editorAddressOf('/edit/', 'a.md'), '/edit/');
  assert.equal(editorAddressOf('edit', 'a.md'), '/edit/');
  assert.equal(editorAddressOf(undefined, 'editor.md'), '/editor/');
  assert.equal(editorAddressOf(undefined, 'edit.md'), '/edit/');
  assert.equal(editorAddressOf('/editor/', 'x.md'), '/editor/');
});

test('other addresses are fine, also below the editor address', () => {
  assert.equal(editorAddressOf(undefined, 'about.md'), undefined);
  assert.equal(editorAddressOf('/edit/guide/', 'x.md'), undefined);
  assert.equal(editorAddressOf('/editing/', 'x.md'), undefined);
});

test('the message says which file to move', () => {
  assert.deepEqual(editorAddressProblems([{ file: 'edit.md' }, { file: 'about.md' }]), [
    "The address /edit/ is the editor's. Move the page src/content/pages/edit.md to another address.",
  ]);
});
