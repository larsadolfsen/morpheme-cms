// The standard pages' sections in the editor as they look on the site, where the theme draws a block its own way there
// (by `<file>#<key>`: 'src/data/standard-pages.json#front' …, the same React components as on the site; the theme's
// CSS is the editor's, @theme/styles/global.css), with what is in it now; the standard theme draws every block as the
// block (preview() in packages/editor/src/registry.tsx). Also what another theme's previews.tsx can take from here
// (Texts, contactOf, Text …). Links and buttons are only drawn
// (Link, InEditor): the card around a preview is the button that opens the block's menu (MarkdownEditor.tsx).
import { createContext, useContext, type ReactNode } from 'react';
import type { BlockData, BlockProps, DrawBlock } from '@interstellarcms/cms/src/blocks';
import type { SiteData } from '@site/sitedata';

export const cx = (...names: unknown[]) => names.filter(Boolean).join(' ');
export type Props = BlockProps & Record<string, any>;
export type Contact = BlockData['site']['contact'];

// The texts every copy of a block has, and the labels of the buttons, as the editor has them now
// (BlockData's site, sitedata.ts); preview() gives them to the blocks it draws.
export const Texts = createContext<Pick<SiteData, 'labels' | 'blocks'> | null>(null);
export const useTexts = () => useContext(Texts)!;

// The phone, e-mail and address, as saved under "Virksomheden".
export const contactOf = (data: BlockData): Contact => data.site.contact;

// Markdown as plain paragraphs, for a text that is not edited here (a hidden section, Om mig).
export const plainParagraphs = (markdown: string) =>
  markdown
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .replace(/^#+\s*/, '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/[*_`>]/g, '')
        .trim(),
    )
    .filter(Boolean);

// A text that is not edited here, in the page's text style: a hidden section of text.
export const Text = ({ heading, body }: { heading?: string; body: string }) => (
  <div className="prose max-w-none">
    {heading && <h2>{heading}</h2>}
    {plainParagraphs(body).map((p, i) => (
      <p key={i}>{p}</p>
    ))}
  </div>
);

export type Preview = (props: Props, data: BlockData, block: DrawBlock) => ReactNode;

// What every standard page draws its own way: a text (only on a page with sections in their own fields). A section of
// a block's type is drawn by that block, and the prices by the block "Priser" (`block`, as the site's Block.astro).
export const everyFixedPage: Record<string, Preview> = {
  text: (props) => <Text heading={props.heading} body={String(props.body ?? '')} />,
};

export const fixedPages: Record<string, Record<string, Preview>> = {};
