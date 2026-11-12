// A pop-up's box, a dialog (Dialog.tsx; Popup.astro shows it modally on the site, the editor draws it beside its
// form): the cross to close it in the top right corner (a tonal icon button, as it can stand on an image), over the
// image at the top (to the edges in 3:2, as on the cards with an image), the heading, the text and its button
// (PopupButton.tsx). A pop-up of a kind an app adds (`type`, e.g. Mailchimp's) has the app's part under the text
// instead (`Part`, src/apps/<app>/popups/View.tsx, given its view and the button), which shows the button where it
// wants.
import type { ComponentType, ReactNode } from 'react';
import type { Image } from '@morphemecms/cms/src/standard/view';
import Dialog from '@theme/ui/Dialog';
import IconButton from '@theme/ui/IconButton';
import PopupButton, { type PopupButtonView } from '@theme/components/PopupButton';
import { siteT } from '@morphemecms/cms/src/i18n';

export type PopupBoxView = { slug: string; image?: Image; heading: string; text: string[]; button?: PopupButtonView };

/** An app's part of a pop-up: its view, and the pop-up's own button to show where it wants. */
export type PopupPart<V = any> = ComponentType<{ view: V; button: ReactNode }>;

export default function PopupView({ popup, Part, part }: { popup: PopupBoxView; Part?: PopupPart; part?: unknown }) {
  const button = <PopupButton button={popup.button} />;
  return (
    <Dialog className="relative overflow-hidden">
      <IconButton icon="x" label={siteT.theme.close} kind="tonal" className="absolute top-3 right-3 z-10" data-popup-close="true" />
      {popup.image && (
        <img
          src={popup.image.src}
          srcSet={popup.image.srcset}
          width={popup.image.width}
          height={popup.image.height}
          sizes="min(28rem, calc(100vw - 2rem))"
          alt=""
          className="block aspect-[3/2] w-full bg-surface-container-high object-cover"
        />
      )}
      <div className="p-6 medium:p-8">
        <h2 id={`popup-${popup.slug}`} className={popup.image ? 'type-headline-small' : 'pr-12 type-headline-small'}>
          {popup.heading}
        </h2>
        {popup.text.map((t, i) => (
          <p key={i} className="mt-3 text-on-surface-variant">
            {t}
          </p>
        ))}
        {Part ? <Part view={part} button={button} /> : button}
      </div>
    </Dialog>
  );
}
