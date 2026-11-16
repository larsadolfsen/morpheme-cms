// /edit/manifest.webmanifest: the editor as an app on a phone's home screen or a computer, with the
// site's name, description and language for it (src/site/config.ts) and the icons from
// packages/editor/scripts/editor-icons.mjs. No colours, on purpose (packages/editor/pages/edit/index.astro).
import { config } from '@site/config';

export function GET() {
  return new Response(`{
  "name": ${JSON.stringify(config.name)},
  "short_name": ${JSON.stringify(config.name)},
  "description": ${JSON.stringify(config.description)},
  "lang": ${JSON.stringify(config.locale)},
  "id": "/edit/",
  "start_url": "/edit/",
  "scope": "/edit/",
  "display": "standalone",
  "icons": [
    { "src": "/edit/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/edit/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/edit/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
`);
}
