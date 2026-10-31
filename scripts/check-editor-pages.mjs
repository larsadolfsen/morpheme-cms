import { chromium } from 'playwright';

const ROUTES_TO_TEST = [
  // 1. Dashboard & User
  { id: '', name: 'Start / Dashboard' },
  { id: 'konto', name: 'Konto' },
  { id: 'notifikationer', name: 'Notifikationer' },
  { id: 'indstillinger', name: 'Indstillinger' },

  // 2. Settings & Integrations
  { id: 'udseende', name: 'Udseende (Oversigt)' },
  { id: 'apps', name: 'Apps' },
  { id: 'indstillinger/appstore', name: 'App Store (Apps)' },
  { id: 'indstillinger/appstore/temaer', name: 'App Store (Temaer)' },
  { id: 'maaling', name: 'Analytics / Måling' },
  { id: 'promovering', name: 'Promovering' },
  { id: 'privatliv', name: 'Privatliv' },
  { id: 'privatliv/cookiebanner', name: 'Privatliv - Cookiebanner' },
  { id: 'privatliv/privatlivssider', name: 'Privatliv - Privatlivssider' },
  { id: 'privatliv/samtykker', name: 'Privatliv - Samtykker' },
  { id: 'seo', name: 'SEO (Oversigt)' },
  { id: 'seo/videresendelser', name: 'SEO - Videresendelser' },
  { id: 'seo/vurdering', name: 'SEO - Vurdering' },
  { id: 'avanceret', name: 'Avanceret' },
  { id: 'licenser', name: 'Licenser' },

  // 3. Udseende / Appearance
  { id: 'udseende/temaer', name: 'Temaer' },
  { id: 'udseende/temaer/material', name: 'Tema - Material (MD3)' },
  { id: 'udseende/ikonpakker', name: 'Ikonpakker' },
  { id: 'udseende/bevaegelse', name: 'Bevægelse (Motion)' },
  { id: 'udseende/farver', name: 'Farver' },
  { id: 'udseende/logo', name: 'Logo & Brand' },
  { id: 'udseende/standardsider', name: 'Standardsider' },
  { id: 'udseende/dele', name: 'Dele (Oversigt)' },
  { id: 'udseende/dele/editor', name: 'Dele - Editor' },
  { id: 'udseende/dele/ui', name: 'Dele - M3 UI Komponenter' },
  { id: 'udseende/dele/blokke', name: 'Dele - Blokke' },
  { id: 'udseende/dele/vaerdier', name: 'Dele - MD3 Værdier/Tokens' },

  // 4. Blokke & Blokvalg
  { id: 'blokke', name: 'Blokke (Oversigt)' },
  { id: 'blokke/booking', name: 'Blok - Book en tid' },
  { id: 'blokvalg', name: 'Blokindstillinger' },

  // 5. Virksomheden & Header
  { id: 'header', name: 'Header & Menuer' },
  { id: 'virksomheden', name: 'Virksomheden' },
  { id: 'virksomheden/kontakt', name: 'Virksomheden - Kontakt' },
  { id: 'virksomheden/betaling', name: 'Virksomheden - Betaling' },

  // 6. Filer & Lister
  { id: 'filer', name: 'Filer / Mediearkiv' },
  { id: 'lister', name: 'Lister' },
  { id: 'liste/pages', name: 'Liste - Sider' },
  { id: 'liste/blog', name: 'Liste - Blogindlæg' },
  { id: 'liste/kategorier', name: 'Liste - Kategorier' },
  { id: 'liste/popups', name: 'Liste - Pop-ups' },

  // 7. Enkeltfiler (Single file collections & data)
  { id: 'src/data/menu.json', name: 'Fil - menu.json' },
  { id: 'src/data/mobile-menu.json', name: 'Fil - mobile-menu.json' },
  { id: 'src/data/footer.json', name: 'Fil - footer.json' },
  { id: 'src/data/cookies.json', name: 'Fil - cookies.json' },
  { id: 'src/data/colors.json', name: 'Fil - colors.json' },
  { id: 'src/data/contact.json', name: 'Fil - contact.json' },
  { id: 'src/data/standard-pages.json', name: 'Fil - standard-pages.json' },

  // 8. Opret nyt (Forms)
  { id: 'ny/blog', name: 'Opret nyt blogindlæg' },
  { id: 'ny/pages', name: 'Opret ny side' },

  // 9. Konkrete indholdsartikler (Markdown editor & Live preview)
  { id: 'src/content/pages/index.md', name: 'Rediger Forside (index.md)' },
  { id: 'src/content/blog/build-a-page-from-blocks.md', name: 'Rediger Blogindlæg' }
];

async function run() {
  console.log('================================================================');
  console.log('       INTERSTELLAR CMS EDITOR - KOMPLET RUTE-TEST              ');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const results = [];

  // Track exceptions
  let currentErrors = [];
  page.on('pageerror', (err) => currentErrors.push(err.message || String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (
        !text.includes('React DevTools') &&
        !text.includes('download') &&
        !text.includes('warning-keys') &&
        !text.includes('unique "key" prop') &&
        !text.includes('descendant of') &&
        !text.includes('cannot contain a nested')
      ) {
        currentErrors.push(`Console: ${text}`);
      }
    }
  });

  console.log('1. Åbner editor og afventer indlæsning af cached/mocked site-filer...');
  await page.goto('http://localhost:4321/editor/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForSelector('text=Loading the website', { state: 'detached', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(400);

  console.log(`2. Tester ${ROUTES_TO_TEST.length} ruter i CMS-editoren:\n`);

  for (let i = 0; i < ROUTES_TO_TEST.length; i++) {
    const item = ROUTES_TO_TEST[i];
    currentErrors = [];

    const start = Date.now();
    let status = 'PASS';
    let bodyText = '';

    try {
      // Skift hash i SPA routeren
      await page.evaluate((hash) => {
        location.hash = hash;
      }, item.id);

      // Vent på at UI opdateres
      await page.waitForTimeout(250);

      bodyText = await page.innerText('body');
      const textLen = bodyText.trim().length;

      if (currentErrors.length > 0) {
        status = 'FAIL';
      } else if (textLen === 0) {
        status = 'BLANK';
      }
    } catch (e) {
      status = 'ERROR';
      currentErrors.push(e.message);
    }

    const duration = Date.now() - start;

    results.push({
      ...item,
      status,
      duration,
      errors: [...currentErrors],
      chars: bodyText.trim().length
    });

    const numStr = `[${String(i + 1).padStart(2)}/${ROUTES_TO_TEST.length}]`;
    const icon = status === 'PASS' ? '✓' : '✗';
    console.log(`${icon} ${numStr} ${item.name.padEnd(35)} -> #${item.id.padEnd(32)} (${duration}ms)`);

    if (currentErrors.length > 0) {
      console.log(`     FEJL: ${currentErrors.join(' | ')}`);
      try {
        await page.goto('http://localhost:4321/editor/', { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForSelector('text=Loading the website', { state: 'detached', timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(400);
      } catch {}
    }
  }

  await browser.close();

  console.log('\n================================================================');
  console.log('                       TEST RESULTATER                          ');
  console.log('================================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status !== 'PASS').length;
  console.log(`Total testede ruter: ${results.length}`);
  console.log(`Bestået:             ${passed} / ${results.length} (${Math.round((passed / results.length) * 100)}%)`);
  console.log(`Fejlede:             ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    console.log('Følgende ruter kræver opmærksomhed:');
    for (const r of results.filter(r => r.status !== 'PASS')) {
      console.log(`- ${r.name} (#${r.id}): ${r.status}`);
      if (r.errors.length) console.log(`  Fejl: ${r.errors.join(' | ')}`);
    }
    process.exit(1);
  } else {
    console.log('🎉 ALLE ruter og underskærme i editoren virker fejlfrit!');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fejl i afvikling af test script:', err);
  process.exit(1);
});
