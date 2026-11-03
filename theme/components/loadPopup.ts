// A pop-up's box on the site (PopupView.tsx): its picture with the sizes the site has made of it, and its button
// (PopupButton.tsx) with the site's targets and pages.
import { loadButtons } from '@morpheme/cms/src/standard/buttons/load';
import { pictureOf } from '@morpheme/cms/src/standard/load';
import type { Popup } from '@morpheme/cms/site/popups';
import type { PopupBoxView } from '@theme/components/PopupView';
import type { PopupButtonView } from '@theme/components/PopupButton';

async function buttonOf(button: Popup['button']): Promise<PopupButtonView | undefined> {
  if (!button) return undefined;
  if (button.to === 'file') return button.href ? { file: { href: button.href, label: button.label?.trim() || 'Download PDF' } } : undefined;
  const icon = button.to === 'phone' ? 'phone' : 'arrow-right';
  return { buttons: await loadButtons([{ to: button.to, label: button.label, href: button.href, kind: 'filled', icon }]) };
}

export const loadPopup = async (p: Popup): Promise<PopupBoxView> => ({
  slug: p.slug,
  image: p.image ? pictureOf(p.image) : undefined,
  heading: p.heading,
  text: p.text,
  button: await buttonOf(p.button),
});
