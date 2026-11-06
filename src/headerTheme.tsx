// How the theme draws the parts of the header that its settings put in, as HTML for the editor's preview of the header
// (headerPreview.mjs HeaderTheme): the call to action (the phone number and the button, HeaderCta.tsx), an empty bar of
// "Mobilmenu", the menu button's classes on each side. Exposes headerThemeOf. Uses the theme's HeaderCta, Tabs and
// headerParts.ts.
import HeaderCta from '@theme/components/HeaderCta';
import { tabClass } from '@theme/ui/Tabs';
import { headerMenuClass, mobileNavClass, mobileNavListClass } from '@theme/components/headerParts';
import { buttonsOf } from './standard/buttons/view';
import type { BlockData } from './blocks';
import { htmlOf } from './pagePreview';
import { siteT } from './i18n';
import type { HeaderCta as Cta, HeaderTheme } from './headerPreview.mjs';

// As Header.astro draws the call to action: the button (filled) and the site's phone number, each when it is on. The
// number's link is its tel: one at every size (the site's leads to the contact page on a computer): the preview's links
// are only drawn.
function ctaOf({ button, phone }: Cta, data: BlockData) {
  const number = data.site.contact.phone;
  return (
    <HeaderCta
      button={button ? buttonsOf([{ ...button, kind: 'filled' }], data)[0] : undefined}
      phone={
        phone && number ? { number, href: `tel:${number.replace(/\s/g, '')}`, label: `${data.site.labels.call} ${number}` } : undefined
      }
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

/** The theme's parts for the preview; `cta`: the call to action as the form has it (headerOf), when it changed. The
 * HTML is drawn here, when the preview draws the page, not while the form is drawn. */
export function headerThemeOf(cta: Cta | undefined, data: BlockData): HeaderTheme {
  return {
    menuClass: { start: headerMenuClass('start'), end: headerMenuClass('end') },
    cta: cta === undefined ? undefined : htmlOf(ctaOf(cta, data)),
    mobileNav: mobileNavHtml(),
    subpagesOf: siteT.theme.subpagesOf,
    current: '/',
  };
}
