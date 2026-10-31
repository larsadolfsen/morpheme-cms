// /_headers: the response headers Cloudflare adds to the files and pages from dist/ (_headers.txt, the same on every site).
import headers from './_headers.txt?raw';

export const GET = () => new Response(headers);
