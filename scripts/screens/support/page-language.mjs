/** The language a site page really renders: the `lang` of the `<html>` the server sent. The live `document.documentElement.lang` is not the page's
 * language: the site's client script (src/i18n/index.ts) rewrites it to the browser's locale, while the texts stay in the site's language. */
export function htmlLang(html) {
  const tag = /<html\b[^>]*>/i.exec(String(html))?.[0] ?? '';
  return (
    /\blang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
      .exec(tag)
      ?.slice(1)
      .find((v) => v !== undefined) ?? ''
  );
}

/** `{ lang, where }` for an opened page: the served HTML's lang, and a sentence saying where it was read (for a failure message). */
export async function pageLanguage(page) {
  const live = await page.evaluate(() => document.documentElement.lang);
  const served = htmlLang(await (await page.request.get(page.url())).text());
  return {
    lang: served,
    where: `the <html lang> the server sent for ${page.url()}; the live document.documentElement.lang is "${live}"`,
  };
}
