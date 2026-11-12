// The site's own kinds of promotion drawn beside their form in the editor. A pop-up ("Promotion", the
// kind "Pop-up") as it looks on the site: the theme's box (PopupView.tsx, the same as Popup.astro shows on the
// site) with the picture, heading and text, and its button: "Book an appointment", "Call" with the number, a page by its name,
// or "Download PDF", with the button's own text when it has one; and an app's kind with a part in it (Mailchimp's
// signup, drawPart: FolderCollection.drawPart). Links and buttons are only drawn.
import type { BlockData } from '../src/blocks';
import type { KindPart } from '../src/schema';
import { buttonsOf } from '../src/standard/buttons/view';
import { shownPicture } from '../src/standard/view';
import PopupView from '@theme/components/PopupView';
import BottomSheet from '@theme/ui/BottomSheet';
import Button from '@theme/ui/Button';
import Toolbar from '@theme/ui/Toolbar';
import List, { ListItem } from '@theme/ui/List';
import type { PopupButtonView } from '@theme/components/PopupButton';
import { siteT } from '../src/i18n';

// Its button, as the editor has the site's targets and pages.
function buttonOf(p: Record<string, any>, data: BlockData): PopupButtonView | undefined {
  const own = String(p.label ?? '').trim();
  if (p.button === 'file') return { file: { href: '', label: own || 'Download PDF' } };
  if (p.button !== 'booking' && p.button !== 'phone' && p.button !== 'page') return undefined;
  const icon = p.button === 'phone' ? 'phone' : 'arrow-right';
  return { buttons: buttonsOf([{ to: p.button, label: own, href: p.href, kind: 'filled', icon }], data) };
}

/** A pop-up, of the list's own kind or (`part`) an app's with its part under the text. */
export function drawPopup(p: Record<string, any>, data: BlockData, part?: KindPart) {
  const popup = {
    slug: 'preview',
    image: p.image ? shownPicture(p.image) : undefined,
    heading: String(p.heading ?? ''),
    text: String(p.text ?? '')
      .split(/\n\s*\n/)
      .map((t) => t.trim())
      .filter(Boolean),
    button: buttonOf(p, data),
  };
  return (
    <div className="not-prose mx-auto max-w-md">
      <PopupView popup={popup} Part={part?.View} part={part?.viewOf(p, data)} />
    </div>
  );
}

// An action bar ("Promotion", the kind "Action bar") as it looks on a phone (ActionBar.astro in the
// theme): the same standard bottom sheet (BottomSheet, .theme-action-bar-drawn in styles/components.css: in its place,
// a phone wide) with the same toolbar row in it, its one or two items side by side, each a text (a list row of two lines: its heading over its text) or a button, the first button filled, the buttons with their own texts or those of their target
// ("Book an appointment", "Call"), of what they open (a pop-up's heading, an app's booking sheet: "Book an appointment") or of their
// page; the calendar for what books, the phone for "Call", the arrow after a page or a pop-up.
export function drawActionBar(p: Record<string, any>, data: BlockData) {
  const pageName = (href: string) =>
    [...(data.relations.fixed ?? []), ...(data.relations.pages ?? [])].find((o) => o.value === href)?.label;
  const buttons = (
    (p.buttons ?? []) as { type?: string; heading?: string; text?: string; label?: string; to?: string; href?: string; open?: string }[]
  ).slice(0, 2);
  if (!buttons.length) return null;
  const first = buttons.findIndex((b) => b.type !== 'text');
  return (
    <BottomSheet
      kind="standard"
      wide="sheet"
      dragHandle={false}
      states={['expanded']}
      label={siteT.theme.actions}
      className="theme-action-bar-drawn not-prose"
    >
      <Toolbar label={siteT.theme.actions} className="theme-action-bar-row">
        {buttons.map((b, i) => {
          if (b.type === 'text')
            return (
              <List key={i} dividers="none" className="theme-action-bar-text">
                <ListItem headline={String(b.heading ?? '').trim()} supporting={String(b.text ?? '').trim() || undefined} />
              </List>
            );
          const own = String(b.label ?? '').trim();
          const opens = b.to === 'promotion' ? data.relations.promotions?.find((o) => o.value === b.open) : undefined;
          // What it does: "Book an appointment" also for a promotion that stands for it (an app's booking sheet).
          const to = opens?.as ?? b.to;
          const text =
            to === 'phone'
              ? own || data.site.labels.call
              : to === 'page'
                ? own || pageName(b.href ?? '') || ''
                : to === 'promotion'
                  ? own || opens?.text || ''
                  : own || data.site.labels.book;
          const arrow = to === 'page' || to === 'promotion';
          return (
            <Button
              key={i}
              href=""
              kind={i === first ? 'filled' : 'outlined'}
              icon={arrow ? undefined : to === 'phone' ? 'phone' : 'calendar-blank'}
              trailingIcon={arrow ? 'arrow-right' : undefined}
            >
              {text}
            </Button>
          );
        })}
      </Toolbar>
    </BottomSheet>
  );
}
