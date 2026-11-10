// Tests movedRoutes.mjs: an old address opens the screen where it is now, others stay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { movedRoute } from './movedRoutes.mjs';

test('the old header screen opens Appearance › Header', () => {
  assert.equal(movedRoute('header'), 'appearance/header');
});

test('the old footer form opens Appearance › Footer', () => {
  assert.equal(movedRoute('src/data/footer.json'), 'appearance/footer');
});

test('the old logo screen under Appearance opens Business › Logo and icon', () => {
  assert.equal(movedRoute('appearance/logo'), 'company/logo');
});

test('the themes tab of the store opens the Theme store under Appearance', () => {
  assert.equal(movedRoute('settings/appstore/themes'), 'appearance/theme-store');
  assert.equal(movedRoute('settings/appstore'), 'settings/appstore');
});

test('an address that has not moved stays', () => {
  assert.equal(movedRoute('appearance/header'), 'appearance/header');
  assert.equal(movedRoute('lists'), 'lists');
});

test('the extra moves come first', () => {
  assert.equal(movedRoute('butik', { butik: 'settings/appstore' }), 'settings/appstore');
  assert.equal(movedRoute('tema', { butik: 'x' }), 'appearance'); // language-ok: a legacy route id
});

test('only the old prefix of an address is renamed, the rest stays', () => {
  const renamed = { indstillinger: 'settings', 'udseende/dele': 'developer/parts', liste: 'list' };
  assert.equal(movedRoute('indstillinger/appstore', {}, renamed), 'settings/appstore');
  assert.equal(movedRoute('udseende/dele/liste/kontakt', {}, renamed), 'developer/parts/liste/kontakt');
});

test('a key segment * matches any one segment and keeps it', () => {
  const renamed = { 'apps/*/indstillinger': 'apps/*/settings' };
  assert.equal(movedRoute('apps/x/indstillinger/variant', {}, renamed), 'apps/x/settings/variant');
  assert.equal(movedRoute('apps/x/om', {}, renamed), 'apps/x/om');
});

test('data inside an address is not renamed', () => {
  assert.equal(movedRoute('files/filer/doc.pdf'), 'files/filer/doc.pdf');
  assert.equal(movedRoute('blog/farver'), 'blog/farver');
  assert.equal(movedRoute('list/temaer'), 'list/temaer');
});

test('old prefixes are renamed, the data after them stays', () => {
  assert.equal(movedRoute('filer/filer/doc.pdf'), 'files/filer/doc.pdf');
  assert.equal(movedRoute('liste/temaer'), 'list/temaer');
  assert.equal(movedRoute('udseende/dele/liste/kontakt'), 'developer/parts/list/kontakt');
  assert.equal(movedRoute('indstillinger/appstore'), 'settings/appstore');
  assert.equal(movedRoute('udseende/farver'), 'appearance/colors');
});

test('every old route prefix opens the screen where it is now', () => {
  const cases = {
    indstillinger: 'settings',
    'indstillinger/appstore/temaer': 'appearance/theme-store',
    'apps/google-analytics/indstillinger': 'apps/google-analytics/settings',
    'apps/udvikler/acme': 'apps/developer/acme',
    'apps/cms-version/om': 'apps/cms-version/about',
    'apps/content-colors/indstillinger/variant': 'apps/content-colors/settings/variant',
    udseende: 'appearance',
    'udseende/temaer': 'appearance/themes',
    'udseende/temaer/material': 'appearance/themes/material',
    'udseende/ikonpakker': 'appearance/icon-packs',
    'udseende/bevaegelse': 'appearance/motion',
    'udseende/sidekolonne': 'appearance/side-column',
    'udseende/farver/reservefarver': 'appearance/colors/fallback-colors',
    'udseende/dele': 'developer/parts',
    'udseende/dele/editor': 'developer/parts/editor',
    'udseende/dele/blokke': 'developer/parts/blocks',
    'udseende/dele/vaerdier': 'developer/parts/values',
    'appearance/parts': 'developer/parts',
    'appearance/parts/list/x': 'developer/parts/list/x',
    advanced: 'developer/caching',
    'udseende/standardsider': 'appearance/default-pages',
    'udseende/logo': 'company/logo',
    maaling: 'analytics',
    'maaling/google-analytics': 'analytics/google-analytics',
    privatliv: 'privacy',
    'privatliv/cookiebanner': 'privacy/cookie-banner',
    'privatliv/samtykker': 'privacy/consents',
    'privatliv/privatlivssider': 'privacy/privacy-pages',
    lister: 'lists',
    liste: 'list',
    'liste/priser/cookiescanner': 'list/priser/cookiescanner',
    'liste/kategorier': 'list/tags',
    ny: 'new',
    'ny/popups/mailchimp': 'new/popups/mailchimp',
    'ny/kategorier': 'new/tags',
    'ny/udtalelser': 'new/testimonials',
    slettet: 'deleted',
    'slettet/priser': 'deleted/priser',
    'slettet/kategorier': 'deleted/tags',
    'slettet/udtalelser': 'deleted/testimonials',
    'liste/udtalelser': 'list/testimonials',
    'liste/mobilmenu': 'list/mobile-menu',
    'slettet/mobilmenu': 'deleted/mobile-menu',
    'slettet/filer': 'deleted/files',
    virksomheden: 'company',
    'virksomheden/kontakt': 'company/contact',
    'virksomheden/sociale-medier': 'company/social-media',
    'virksomheden/betaling/mobilepay': 'company/payment/mobilepay',
    blokke: 'blocks',
    'blokke/accordion': 'blocks/accordion',
    filer: 'files',
    'seo/videresendelser': 'seo/redirects',
    'seo/videresendelser/alle': 'seo/redirects/all',
    'seo/videresendelser/ikke-fundet': 'seo/redirects/not-found',
    'seo/interne-links': 'seo/internal-links',
    'seo/vurdering': 'seo/rating',
    blokvalg: 'block-settings',
    avanceret: 'developer/caching',
    licenser: 'licenses',
    konto: 'account',
    notifikationer: 'notifications',
    'licenser/mit': 'licenses/mit',
  };
  for (const [old, now] of Object.entries(cases)) assert.equal(movedRoute(old), now, old);
});

test('a new address stays', () => {
  assert.equal(movedRoute('settings/appstore'), 'settings/appstore');
  assert.equal(movedRoute('blog/mit-indlaeg'), 'blog/mit-indlaeg');
});

test('a moved address wins over a renamed segment', () => {
  assert.equal(movedRoute('tema', {}, { tema: 'x' }), 'appearance'); // language-ok: a legacy route id
});

test('an old route to the app store opens it at its English route', () => {
  assert.equal(movedRoute('indstillinger/appstore'), 'settings/appstore');
});

test('the old colours route opens the colours screen under Appearance', () => {
  assert.equal(movedRoute('farver'), 'appearance/colors'); // language-ok: a legacy route id
});

test('an old parts route keeps a list id and opens at its English route', () => {
  assert.equal(movedRoute('udseende/dele/liste/kontakt'), 'developer/parts/list/kontakt');
});

test('the old theme routes open the screens under Appearance', () => {
  assert.equal(movedRoute('tema'), 'appearance'); // language-ok: a legacy route id
  assert.equal(movedRoute('tema/dele/editor'), 'developer/parts/editor');
});

test('the old booking and newsletter settings open the apps by their permanent ids', () => {
  assert.equal(movedRoute('promovering/calendly'), 'apps/app_a030dfba69793996');
  assert.equal(movedRoute('promovering/mailchimp'), 'apps/app_5c4b6ba067ef127f');
});
