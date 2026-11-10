// Tests of the date and time pickers' texts (pickerTexts.ts, defaults/i18n/da-DK/themeUi.ts) and how a site's language
// reads a typed day: Danish keeps its texts and 24.12.2026; English shows English and reads 12/24/2026 (en-US order).
import assert from 'node:assert/strict';
import test from 'node:test';
import { translate } from '../../lib/translate.mjs';
import { themeUi } from '../../defaults/i18n/da-DK/themeUi.ts';
import { readdirSync } from 'node:fs';
import { datePickerTextsIn, timePickerTextsIn } from './pickerTexts.ts';
import { dayFromTyped, timeFromTyped } from './dates.ts';

// The standard parts' Danish: every file of the folder (its index.ts imports them without extensions).
const folder = new URL('../../defaults/i18n/da-DK/', import.meta.url);
const defaultsDaDK = Object.assign(
  {},
  ...(await Promise.all(
    readdirSync(folder)
      .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
      .map(async (f) => Object.values(await import(new URL(f, folder).href))[0]),
  )),
);
const danish = (text) => translate(defaultsDaDK, text);
const english = (text) => text;

test('a Danish site shows the Danish texts the pickers had', () => {
  const d = datePickerTextsIn(danish, 'da-DK');
  assert.equal(d.select, 'Vælg dato');
  assert.equal(d.format, 'dd.mm.åååå');
  assert.equal(d.wrongFormat, 'Skriv datoen som dd.mm.åååå.');
  assert.equal(d.endBeforeStart, 'Slutdatoen er før startdatoen.');
  assert.equal(d.toCalendar, 'Skift til kalenderen');
  assert.equal(d.cancel, 'Annuller');
  const t = timePickerTextsIn(danish, 'da-DK');
  assert.equal(t.hour, 'Time');
  assert.equal(t.format, 'tt.mm');
  assert.equal(t.format12, 't.mm AM/PM');
  assert.equal(t.wrong, 'Skriv et tidspunkt mellem 00.00 og 23.59.');
  assert.equal(t.wrong12, 'Skriv et tidspunkt mellem 1.00 og 12.59.');
  assert.equal(t.period, 'Før eller efter middag');
  assert.equal(t.toDial, 'Skift til urskiven');
});

test('every text of the pickers has its Danish', () => {
  for (const texts of [datePickerTextsIn(english, 'en-US'), timePickerTextsIn(english, 'en-US')]) {
    for (const [key, text] of Object.entries(texts)) {
      if (['locale', 'am', 'pm'].includes(key)) continue;
      assert.ok(Object.hasOwn(defaultsDaDK, text), `${key}: no Danish for "${text}"`);
    }
  }
});

test('an English site shows English texts', () => {
  const d = datePickerTextsIn(english, 'en-US');
  assert.equal(d.format, 'dd/mm/yyyy');
  assert.equal(d.wrongFormat, 'Write the date as dd/mm/yyyy.');
  assert.equal(d.select, 'Select date');
  const t = timePickerTextsIn(english, 'en-US');
  assert.equal(t.format, 'hh:mm');
  assert.deepEqual([t.am, t.pm], ['AM', 'PM']);
});

test('a Danish site reads 24.12.2026', () => {
  assert.equal(dayFromTyped('24.12.2026', 'da-DK'), '2026-12-24');
  assert.equal(dayFromTyped('2.11.2026', 'da-DK'), '2026-11-02');
  assert.equal(dayFromTyped('12/24/2026', 'da-DK'), null);
  assert.equal(timeFromTyped('14.30'), '14:30');
});

test('an English site reads the month first, as Intl for en-US writes it', () => {
  assert.equal(dayFromTyped('12/24/2026', 'en-US'), '2026-12-24');
  assert.equal(dayFromTyped('11/02/2026', 'en-US'), '2026-11-02');
  assert.equal(dayFromTyped('24/12/2026', 'en-US'), null);
  assert.equal(new Date(2026, 11, 24).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }), '12/24/2026');
});
