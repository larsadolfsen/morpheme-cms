// The fixture "0.17 site" (docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md, 6.3): what a site made with 0.17 has that the dynamic lists
// framework must keep drawing the same. Two own lists (a version 1 and a version 2 definition), a Dynamic list with a `map`, a Dynamic segmented list
// with `howMany` and `Show all`, a Dynamic FAQ list from Testimonials and a List from posts, on two pages. It is laid over the demo site
// (check-same-html.mjs builds it before and after a change and compares the HTML) and its content is checked by the editor's rules (check-content.mjs).
// Pure data: a map of site file paths to their text.

/** A block as the page's markdown has it. @param {string} type @param {Record<string, unknown>} props */
const block = (type, props) => `<div data-block="${type}" data-props="${JSON.stringify(props).replaceAll('"', '&quot;')}"></div>`;

const page = (title, blocks) =>
  `---\ntitle: "${title}"\ndescription: "A page of the 0.17 fixture."\n---\n\n# ${title}\n\n${blocks.join('\n\n')}\n`;

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export const SITE_017 = {
  // Version 1: the fields are the kinds' names.
  'src/data/services/_list.json': json({ version: 1, label: 'Services', fields: ['title', 'text'] }),
  'src/data/services/web.json': json({ title: 'Web design', text: 'Pages that load fast.', order: 1 }),
  'src/data/services/seo.json': json({ title: 'Search', text: 'Be found.', order: 2 }),
  'src/data/services/care.json': json({ title: 'Care plan', order: 3 }),
  // Version 2: fields with ids and kinds, two body texts, an icon, a link and tags.
  'src/data/team/_list.json': json({
    version: 2,
    label: 'Team',
    fields: [
      { id: 'icon', kind: 'icon' },
      { id: 'text', kind: 'text', label: 'Name' },
      { id: 'text-2', kind: 'text', label: 'Role' },
      { id: 'href', kind: 'href' },
      { id: 'tags', kind: 'tags' },
    ],
  }),
  'src/data/team/anna.json': json({ icon: 'star', text: 'Anna', 'text-2': 'Lead', href: '/about/', tags: ['design'], order: 1 }),
  'src/data/team/bo.json': json({ icon: 'heart', text: 'Bo', 'text-2': 'Design', tags: [], order: 2 }),
  'src/data/team/cy.json': json({ text: 'Cy', 'text-2': 'Support', order: 3 }),
  'src/data/team/di.json': json({ text: 'Di', 'text-2': 'Sales', order: 4 }),
  'src/content/pages/fixture-lists.md': page('Fixture lists', [
    block('list', { heading: 'Services', from: 'services' }),
    // The Dynamic list with a `map`: the role is the top line, the name the bottom line.
    block('list', { heading: 'Team', from: 'team', map: { title: 'text-2', text: 'text' } }),
    // The Dynamic segmented list with `howMany` and `Show all`.
    block('segmented', { heading: 'Some of the team', from: 'team', howMany: 2, button: 'Show all', buttonHref: '/about/' }),
  ]),
  'src/content/pages/fixture-sources.md': page('Fixture sources', [
    // A Dynamic FAQ list from Testimonials.
    block('faq', { heading: 'What people say', from: 'testimonials', button: 'Show all' }),
    // A List from posts.
    block('list', { heading: 'Latest posts', from: 'posts', howMany: 3 }),
    block('list', { heading: 'Posts about design', from: 'posts', tags: ['design'] }),
  ]),
};
