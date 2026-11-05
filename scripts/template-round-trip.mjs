// Checks that a page's front matter survives a template change and change back (used by editor-roundtrip.mjs).
// Exports: templateRoundTripProblem(yaml, { writeFields, templateWritten, templates }). No imports; the callers pass the functions.
const TEMPLATE_LINE = /^template: ("sidebar-left"|sidebar-left)$/m;

/**
 * Change the template of the front matter to sidebar-left and back to the default; the result must be the front matter as it was.
 *
 * @param {string} yaml Front matter text without the --- lines.
 * @param {{ writeFields: (yaml: string, fields: object) => string, templateWritten: (id: string, templates: string[]) => string, templates: string[] }} deps
 * @returns {string | null} A problem text, or null when the round trip holds.
 */
export function templateRoundTripProblem(yaml, { writeFields, templateWritten, templates }) {
  const [fallback] = templates;
  const plain = writeFields(yaml, { template: '' });
  const chosen = writeFields(plain, { template: templateWritten('sidebar-left', templates) });
  const back = writeFields(chosen, { template: templateWritten(fallback, templates) });
  if (!TEMPLATE_LINE.test(chosen)) return 'the template line is not written';
  if (back !== plain) return 'changing back does not give the front matter as it was';
  if (writeFields(plain, { template: templateWritten(fallback, templates) }) !== plain)
    return 'the default template changes the front matter';
  return null;
}
