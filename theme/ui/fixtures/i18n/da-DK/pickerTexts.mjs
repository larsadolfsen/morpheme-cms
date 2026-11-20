// What a Danish site's date and time pickers showed before the texts moved to defaults/i18n/da-DK/themeUi.ts (a fixture).
// Exposes expectDanish(assert, datePickerTextsIn, timePickerTextsIn, danish). No dependencies.
export function expectDanish(assert, datePickerTextsIn, timePickerTextsIn, danish) {
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
}
