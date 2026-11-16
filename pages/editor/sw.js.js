// /editor/sw.js: the service worker the editor had at its old address. A browser that still has it asks for it again to update it; this
// one removes itself and its scope, so only /edit/ has a service worker. (The Worker answers this address itself, a redirect is not
// allowed for a service worker script; this file is for a Worker that is older than the build.)
import code from './sw.js?raw';

export const GET = () => new Response(code, { headers: { 'content-type': 'text/javascript', 'cache-control': 'no-cache' } });
