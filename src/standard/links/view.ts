// What "Links" shows (its view, drawn by the theme's View.tsx and LinkGroups.tsx): its heading, and each group's
// heading, its page when it has one, and its pages by their titles; a page that is not there is left out. In the
// editor: viewOf, from the site's pages; on the site: load.ts.
import type { ViewOf } from '../view';

export type LinkGroup = { title: string; href?: string; pages: { href: string; name: string }[] };
export type LinksView = { heading?: string; groups: LinkGroup[] };

/** A group as its field writes it. */
export type LinkGroupProps = { title?: string; href?: string; paths?: string[] };

export const viewOf: ViewOf<LinksView> = (props, data) => {
  const byPath = new Map(data.site.pages.map((p) => [p.path, p]));
  return {
    heading: props.heading || undefined,
    groups: ((props.groups ?? []) as LinkGroupProps[]).map((g) => ({
      title: g.title ?? '',
      href: g.href,
      pages: (g.paths ?? []).flatMap((path) => {
        const page = byPath.get(path);
        return page ? [{ href: path, name: page.title }] : [];
      }),
    })),
  };
};
