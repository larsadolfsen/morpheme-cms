// The address of the Morpheme store. Exposes STORE_URL. No dependencies: the site's Worker (worker/store-connection.js) and
// the build (scripts/build-install.mjs) both read it; MORPHEME_STORE_URL in the environment replaces it.
export const STORE_URL = 'https://morpheme-appstore.larsadolfsen.workers.dev';
