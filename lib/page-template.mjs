// Pure helpers for resolving page templates from a theme's template list.
// Exports: PAGE_TEMPLATES, STANDARD_TEMPLATES, templatesOf, templateOf, hasSidebar, templateChoices, templateProblems.
// No dependencies.

export const PAGE_TEMPLATES = ['single', 'full', 'sidebar-left', 'sidebar-right'];
export const STANDARD_TEMPLATES = ['single', 'sidebar-right', 'sidebar-left'];

/**
 * Return the theme's `templates` list when templateProblems finds no problem and the list is not undefined;
 * else a copy of STANDARD_TEMPLATES.
 *
 * @param {{ templates?: unknown } | null | undefined} theme
 * @returns {string[]} A copy of the theme's valid template list or of STANDARD_TEMPLATES.
 */
export function templatesOf(theme) {
  if (theme === null || theme === undefined) {
    return [...STANDARD_TEMPLATES];
  }

  const value = theme.templates;
  if (value === undefined) {
    return [...STANDARD_TEMPLATES];
  }

  const problems = templateProblems(value);
  if (problems.length > 0) {
    return [...STANDARD_TEMPLATES];
  }

  // value is a valid non-empty array of known, unique templates
  return [...value];
}

/**
 * Return page.template when it is a string in offered; else offered[0].
 *
 * @param {{ template?: unknown } | null | undefined} page
 * @param {string[]} offered
 * @returns {string} The resolved template id.
 */
export function templateOf(page, offered) {
  if (page === null || page === undefined) {
    return offered[0];
  }

  const template = page.template;
  if (typeof template === 'string' && offered.includes(template)) {
    return template;
  }

  return offered[0];
}

/**
 * True for 'sidebar-left' and 'sidebar-right'; false for every other value.
 *
 * @param {unknown} template
 * @returns {boolean} Whether the template is a sidebar template.
 */
export function hasSidebar(template) {
  return template === 'sidebar-left' || template === 'sidebar-right';
}

/**
 * Return offered in the same order; without the sidebar templates when sideChosen is false.
 *
 * @param {string[]} offered
 * @param {boolean} sideChosen
 * @returns {string[]} A new array of template choices.
 */
export function templateChoices(offered, sideChosen) {
  if (sideChosen) {
    return [...offered];
  }
  return offered.filter((t) => !hasSidebar(t));
}

/**
 * Problems with a theme.json `templates` value, one English sentence each.
 * [] when the value is undefined or valid.
 *
 * @param {unknown} value
 * @returns {string[]} List of problem descriptions.
 */
export function templateProblems(value) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return ['"templates" must be a list of template ids.'];
  }

  if (value.length === 0) {
    return ['"templates" must name at least one template.'];
  }

  const problems = [];
  const seen = new Set();

  for (const item of value) {
    if (!PAGE_TEMPLATES.includes(item)) {
      problems.push(`"templates" has an unknown template: ${item}.`);
      continue;
    }
    if (seen.has(item)) {
      problems.push(`"templates" names ${item} twice.`);
      continue;
    }
    seen.add(item);
  }

  return problems;
}
