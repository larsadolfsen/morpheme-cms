// "Links" on the site (view.ts): the pages by their titles as the site has them (@site/standard).
import { standard } from '@site/standard';
import type { Load } from '../view';
import type { LinkGroupProps, LinksView } from './view';

export const load: Load<LinksView> = async (props) => ({
  heading: props.heading || undefined,
  groups: await Promise.all(
    ((props.groups ?? []) as LinkGroupProps[]).map(async (g) => ({
      title: g.title ?? '',
      href: g.href,
      pages: (await Promise.all((g.paths ?? []).map(async (href) => ({ href, name: await standard.pageTitle(href) })))).flatMap((p) =>
        p.name === undefined ? [] : [{ href: p.href, name: p.name }],
      ),
    })),
  ),
});
