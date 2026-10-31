// The shared texts of "Blogindlæg" ("Blokke"): the link under the posts, with {tag} for the tag it goes
// to, to begin with in the site's language (siteT). Also where a site shows posts itself (this site's
// front page).
import { siteT, t } from '../../i18n';
import { defineShared, fill } from '../../shared';

export default defineShared({
  fields: [
    { name: 'all', label: t.blocks.posts.allLink, type: 'string', required: true, max: 30 },
    { name: 'allAbout', label: t.blocks.posts.allAboutLink, type: 'string', required: true, max: 40, hint: t.blocks.posts.allAboutHint },
  ],
  values: { all: siteT.blocks.posts.allText, allAbout: siteT.blocks.posts.allAboutText },
});

/** What its "Alle indlæg" says: "Alle indlæg om opskrifter" when it goes to a tag (by its name), else
 * "Alle indlæg". */
export const allPostsText = (texts: Record<string, string>, tag?: string): string =>
  tag ? fill(texts.allAbout, { tag: tag.toLowerCase() }) : texts.all;

/** How many posts it shows: its `count` (3–6), else 3. */
export const postCount = (count: unknown) => Math.min(6, Math.max(3, Number(count) || 3));
