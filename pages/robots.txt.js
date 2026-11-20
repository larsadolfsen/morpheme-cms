// /robots.txt: every page for search engines, not the editor or its login, and where the sitemap is.
export const GET = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /editor/\nDisallow: /oauth/\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`);
