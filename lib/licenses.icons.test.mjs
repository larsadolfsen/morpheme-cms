// The licence work ids of an icon pack and of the sets it takes icons from: `icons/<id>`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { iconPackWorks } from './licenses.mjs';

test('an icon pack and the set it includes get ids that start with icons/', () => {
  const pack = {
    id: 'mdi',
    name: 'Material Design Icons',
    author: 'Pictogrammers',
    license: 'Apache-2.0',
    file: '',
    includes: [{ name: 'Simple Icons', author: 'Simple Icons Collaborators', license: 'CC0-1.0', file: '' }],
  };
  assert.deepEqual(
    iconPackWorks(pack, '/nowhere').map((work) => work.id),
    ['icons/mdi', 'icons/simple-icons'],
  );
});
