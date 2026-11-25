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
import { scopedPart } from '@morphemecms/cms/src/standard/appScope';

export type PopupBoxView = { slug: string; image?: Image; heading: string; text: string[]; button?: PopupButtonView };

/** An app's part of a pop-up: its view, and the pop-up's own button to show where it wants. */
export type PopupPart<V = any> = ComponentType<{ view: V; button: ReactNode }>;

/** An app's part is drawn in the app's scope (`appId`: data-mo-app on its outer element), so the app's scoped CSS applies to it (standard/appScope.tsx). */
export default function PopupView({ popup, Part, part, appId }: { popup: PopupBoxView; Part?: PopupPart; part?: unknown; appId?: string }) {
  const button = <PopupButton button={popup.button} />;
  const Scoped = Part && appId ? scopedPart(appId, Part) : Part;
  return (
    <Dialog className="mo-popup">
      <IconButton icon="close" label={siteT.theme.close} kind="tonal" className="mo-popup__close" data-popup-close="true" />
      {popup.image && (
        <img
          src={popup.image.src}
          srcSet={popup.image.srcset}
          width={popup.image.width}
          height={popup.image.height}
          sizes="min(28rem, calc(100vw - 2rem))"
          alt=""
          className="mo-popup__image"
        />
      )}
      <div className="mo-popup__body">
        <h2
          id={`popup-${popup.slug}`}
          className={popup.image ? 'mo-type-headline-small mo-popup__title' : 'mo-type-headline-small mo-popup__title mo-has-close-space'}
        >
          {popup.heading}
        </h2>
        {popup.text.map((t, i) => (
          <p key={i} className="mo-popup__text">
            {t}
          </p>
        ))}
        {Scoped ? <Scoped view={part} button={button} /> : button}
      </div>
    </Dialog>
  );
}
