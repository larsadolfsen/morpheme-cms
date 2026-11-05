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

test('an address that has not moved stays', () => {
  assert.equal(movedRoute('appearance/header'), 'appearance/header');
  assert.equal(movedRoute('lists'), 'lists');
});

test('the extra moves come first', () => {
  assert.equal(movedRoute('butik', { butik: 'indstillinger/appstore' }), 'indstillinger/appstore');
  assert.equal(movedRoute('tema', { butik: 'x' }), 'appearance');
});

test('only the old prefix of an address is renamed, the rest stays', () => {
  const renamed = { indstillinger: 'settings', 'udseende/dele': 'appearance/parts', liste: 'list' };
  assert.equal(movedRoute('indstillinger/appstore', {}, renamed), 'settings/appstore');
  assert.equal(movedRoute('udseende/dele/liste/kontakt', {}, renamed), 'appearance/parts/liste/kontakt');
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
  assert.equal(movedRoute('udseende/dele/liste/kontakt'), 'appearance/parts/list/kontakt');
  assert.equal(movedRoute('indstillinger/appstore'), 'settings/appstore');
  assert.equal(movedRoute('udseende/farver'), 'appearance/colors');
});

test('every old route prefix opens the screen where it is now', () => {
  const cases = {
    indstillinger: 'settings',
    'indstillinger/appstore/temaer': 'settings/appstore/themes',
    'apps/google-analytics/indstillinger': 'apps/google-analytics/settings',
    'apps/content-colors/indstillinger/variant': 'apps/content-colors/settings/variant',
    udseende: 'appearance',
    'udseende/temaer': 'appearance/themes',
    'udseende/temaer/material': 'appearance/themes/material',
    'udseende/ikonpakker': 'appearance/icon-packs',
    'udseende/bevaegelse': 'appearance/motion',
    'udseende/sidekolonne': 'appearance/side-column',
    'udseende/farver/reservefarver': 'appearance/colors/fallback-colors',
    'udseende/dele': 'appearance/parts',
    'udseende/dele/editor': 'appearance/parts/editor',
    'udseende/dele/blokke': 'appearance/parts/blocks',
    'udseende/dele/vaerdier': 'appearance/parts/values',
    'udseende/standardsider': 'appearance/default-pages',
    'udseende/logo': 'appearance/logo',
    maaling: 'analytics',
    'maaling/google-analytics': 'analytics/google-analytics',
    privatliv: 'privacy',
    'privatliv/samtykker': 'privacy/samtykker',
    lister: 'lists',
    liste: 'list',
    'liste/priser/cookiescanner': 'list/priser/cookiescanner',
    'liste/kategorier': 'list/tags',
    ny: 'new',
    'ny/popups/mailchimp': 'new/popups/mailchimp',
    'ny/kategorier': 'new/tags',
    'ny/udtalelser': 'new/testimonials',
    'slettet/kategorier': 'slettet/tags',
    'slettet/udtalelser': 'slettet/testimonials',
    'liste/udtalelser': 'list/testimonials',
    'liste/mobilmenu': 'list/mobile-menu',
    'slettet/mobilmenu': 'slettet/mobile-menu',
    'slettet/filer': 'slettet/files',
    virksomheden: 'company',
    'virksomheden/kontakt': 'company/kontakt',
    blokke: 'blocks',
    'blokke/accordion': 'blocks/accordion',
    filer: 'files',
    'seo/videresendelser': 'seo/redirects',
    blokvalg: 'block-settings',
    avanceret: 'advanced',
    licenser: 'licenses',
    'licenser/mit': 'licenses/mit',
  };
  for (const [old, now] of Object.entries(cases)) assert.equal(movedRoute(old), now, old);
});

test('a new address stays', () => {
  assert.equal(movedRoute('settings/appstore'), 'settings/appstore');
  assert.equal(movedRoute('blog/mit-indlaeg'), 'blog/mit-indlaeg');
});

test('a moved address wins over a renamed segment', () => {
  assert.equal(movedRoute('tema', {}, { tema: 'x' }), 'appearance');
});

test('an old route to the app store opens it at its English route', () => {
  assert.equal(movedRoute('indstillinger/appstore'), 'settings/appstore');
});

test('the old colours route opens the colours screen under Appearance', () => {
  assert.equal(movedRoute('farver'), 'appearance/colors');
});

test('an old parts route keeps a list id and opens at its English route', () => {
  assert.equal(movedRoute('udseende/dele/liste/kontakt'), 'appearance/parts/list/kontakt');
});
