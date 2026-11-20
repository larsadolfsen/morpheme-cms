// /editor/sw.js: the editor's service worker (sw.js), for its notifications.
import code from './sw.js?raw';

export const GET = () => new Response(code, { headers: { 'content-type': 'text/javascript' } });
