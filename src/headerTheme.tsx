// How the theme draws the parts of the header that its settings put in, as HTML for the editor's preview of the header
// (headerPreview.mjs HeaderTheme): the button or the phone icon in the button's place, an empty bar of "Mobilmenu", the
// menu button's classes on each side. Exposes headerThemeOf. Uses the theme's Buttons, IconButton, Tabs and headerParts.ts.
import Buttons from '@theme/blocks/buttons/Buttons';
import IconButton from '@theme/ui/IconButton';
import { tabClass } from '@theme/ui/Tabs';
import { headerCtaClass, headerEdge, headerMenuClass, mobileNavClass, mobileNavListClass } from '@theme/components/headerParts';
import { buttonsOf } from './standard/buttons/view';
import type { Button } from './standard/buttons/fields';
import type { BlockData } from './blocks';
import { htmlOf } from './pagePreview';
import { siteT } from './i18n';
import type { HeaderTheme } from './headerPreview.mjs';

// As Header.astro draws the button's place: the button (filled) from the medium window size up, else the phone icon.
function ctaOf(button: Button | null, data: BlockData) {
  if (button) {
    return (
      <div data-editor="header-cta" className={headerCtaClass}>
        <Buttons buttons={buttonsOf([{ ...button, kind: 'filled' }], data)} />
      </div>
    );
  }
  const { phone } = data.site.contact;
  return (
    <IconButton
      href={`tel:${phone.replace(/\s/g, '')}`}
      icon="phone"
      label={`${data.site.labels.call} ${phone}`}
      className={headerEdge.end}
      data-editor="header-cta"
    />
  );
}

// As MobileNav.astro draws the bar, with one tab for the links to be drawn as.
const mobileNavHtml = () =>
  htmlOf(
    <nav aria-label={siteT.theme.mobileMenu} data-mobile-nav data-editor="mobile-nav" className={mobileNavClass}>
      <ul className={mobileNavListClass}>
        <li>
          <a href="/" className={tabClass} />
        </li>
      </ul>
    </nav>,
  );

/** The theme's parts for the preview; `button`: the header's button as the form has it (headerOf), when it changed. The
 * HTML is drawn here, when the preview draws the page, not while the form is drawn. */
export function headerThemeOf(button: Button | null | undefined, data: BlockData): HeaderTheme {
  return {
    menuClass: { start: headerMenuClass('start'), end: headerMenuClass('end') },
    cta: button === undefined ? undefined : htmlOf(ctaOf(button, data)),
    mobileNav: mobileNavHtml(),
    subpagesOf: siteT.theme.subpagesOf,
    current: '/',
  };
}
