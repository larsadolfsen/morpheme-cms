// The Image grid typed in place (InlineLiveList.tsx): the images are drawn as the site draws them, from the images of Files; the heading and the
// subheading are typed above them. The filter's chips are drawn hidden (the site's script shows them): here the card shows them, and they do
// nothing (editor.css), so a tap selects the block; the Preview has the real behaviour. Under the grid, the text button `Add images` asks for
// several images of the Library at once and puts them in the block as `Picked images` (the images the grid shows now come first, so nothing that
// is shown goes away). A tap on an image opens its settings sheet: the text it has in this block (a picked image's own, with the Library's text
// as the hint); with `All images with tags` an image has no text of its own (it is the Library's), so a tap opens Edit. The large view is the
// site's only. Which images, what a card shows and its style are in Edit.
import { useLayoutEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { t } from './i18n';
import { InlineAdd } from './InlineItems';
import InlineLiveList from './InlineLiveList';
import type { InlineViewProps } from './inlineViews';
import imageGrid from './standard/imagegrid';
import { viewOf } from './standard/imagegrid/view';
import ImageGrid from '@theme/blocks/imagegrid/View';

type Picked = { image?: string; alt?: string };

// The field of a picked image that is its text in this block (its Library text is the hint, `libraryText`).
const altField = () => {
  const list = imageGrid.fields.find((f) => f.name === 'picked');
  return list && 'fields' in list ? list.fields.filter((f) => f.name === 'alt') : [];
};

export default function InlineImageGrid({ props, data, active, focus, onChange, onProps, onEdit, onRow }: InlineViewProps) {
  const box = useRef<HTMLDivElement>(null);
  // No script runs in the editor: the chips are shown here (the theme's `[hidden]` rule cannot be overridden by a rule of the editor's).
  useLayoutEffect(() => {
    box.current?.querySelectorAll<HTMLElement>('[data-imagegrid-filter]').forEach((filter) => (filter.hidden = false));
  });
  const picked: Picked[] = Array.isArray(props.picked) ? (props.picked as Picked[]) : [];

  async function addImages() {
    const srcs = await data.pickImages?.();
    if (!srcs?.length) return;
    // From `All images with tags` the images shown now become the picked ones; from `Picked images` the new ones go last.
    const base: Picked[] = props.show === 'picked' ? picked : (viewOf(props, data)?.images ?? []).map((i) => ({ image: i.src }));
    const have = new Set(base.map((row) => row.image));
    onProps({ show: 'picked', picked: [...base, ...srcs.filter((src) => !have.has(src)).map((image) => ({ image }))] });
  }

  function open(e: MouseEvent) {
    const card = (e.target as Element).closest('a[data-image]');
    if (!card) return;
    // The tap is about the image: it does not start the head, and the link leads nowhere here.
    e.preventDefault();
    e.stopPropagation();
    if (props.show !== 'picked' || !onRow) return void onEdit?.();
    const at = Number(card.closest('li')?.getAttribute('data-index'));
    // The rows with an image are the images the grid shows, in order.
    const index = picked.map((row, i) => [row, i] as const).filter(([row]) => row?.image)[at]?.[1];
    if (index === undefined) return void onEdit?.();
    onRow({
      headline: t.blocks.imageGrid.image,
      fields: altField(),
      value: { alt: picked[index].alt ?? '' },
      onChange: (v) =>
        onProps({
          picked: picked.map((row, i) => {
            if (i !== index) return row;
            const { alt: _own, ...rest } = row;
            return v.alt ? { ...rest, alt: String(v.alt) } : rest;
          }),
        }),
    });
  }

  return (
    <div ref={box} onClickCapture={open}>
      <InlineLiveList
        props={props}
        active={active}
        focus={focus}
        onChange={onChange}
        drawn={(p) => {
          const view = viewOf(p, data);
          return view && <ImageGrid view={view} />;
        }}
      />
      {data.pickImages && <InlineAdd label={t.blocks.imageGrid.addImages} onClick={() => void addImages()} />}
    </div>
  );
}
