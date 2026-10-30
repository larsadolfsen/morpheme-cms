// What "Foldeliste" shows (its view, drawn by the theme's View.tsx, Accordion.tsx and PageRow.tsx): its head (../head.ts),
// and its rows in their order: each with its own text, or else the opening of the page it links
// to, the link to the page (the shared text, with the row's name in it) and links to more pages under it (`more`). In
// the editor (viewOf) a row without a text of its own says so; on the site (load.ts) a row whose page is missing is
// left out.
import { siteT } from '../../i18n';
import { fill, sharedIn } from '../../shared';
import type { ViewOf } from '../view';
import { headOf, type HeadView } from '../head';
import shared from './shared';

/** A row of a page: its name, its text, its page, the link's text and links to more pages. */
export type PageRowView = { label: string; text: string; href: string; link: string; more?: { label: string; href: string }[] };

export type AccordionView = HeadView & { group?: string; rows: PageRowView[] };

/** A row as its field writes it. */
export type PageRowProps = { label: string; href: string; text?: string; more?: { label: string; href: string }[] };

/** A row with its text and the link's text (`link`, the shared text: "Læs mere om {emne}"). */
export const pageRow = ({ label, href, more }: PageRowProps, text: string, link: string): PageRowView => {
  const row = { label, href, text, link: fill(link, { emne: label.toLowerCase() }) };
  return more?.length ? { ...row, more } : row;
};

export const viewOf: ViewOf<AccordionView> = (props, data) => {
  const link: string = sharedIn(data.site, 'accordion', shared.values).more;
  return {
    ...headOf(props),
    rows: ((props.items ?? []) as PageRowProps[]).map((row) => pageRow(row, row.text?.trim() || siteT.blocks.accordion.opening, link)),
  };
};
