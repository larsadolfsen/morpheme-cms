// The host side of content-based colour (Material 3): an image's source colour and the page's colours made from it,
// for the page-colors hook's helper `contentColors` (PageColorsHook in ./hooks.ts). The engine (Material's quantizer,
// score and schemes, ./dynamic-colors.ts) runs here, in the build's own process, so an app's hook in the sandbox only
// decides which images to try and with what choice; it does not load or run the engine itself, which a hook's 1000 ms
// could not afford for a photograph. The site (site/pageColors.ts) makes one engine for a build.
// Nothing the hook gives is trusted: the image must be one of the page's, the choice is checked here, the roles are
// the site's and the colours are kept only when they are readable.
// No React, browser or Node here: it takes the image's pixels and "readable" from the site.
import type { Colors } from './colors.ts';
import { dynamicColors, dynamicProblems, sourceColorsOf, type ColorRoles, type ContentBased } from './dynamic-colors';

export type ContentColors = {
  /** The helper for one page: its images are the only ones it reads, and each one it reads is passed to `onRead`. */
  forPage: (images: string[], onRead?: (image: string) => void) => (image: unknown, choice: unknown) => Promise<Colors | undefined>;
};

/**
 * @param options `pixels` gives an image's pixels, made small, as RGBA bytes (undefined for one that cannot be read);
 * `roles` are the site's colours by their role; `readable` says whether colours can be read in both modes.
 */
export function contentColorsEngine(options: {
  pixels: (image: string) => Promise<Uint8ClampedArray | undefined>;
  roles: ColorRoles;
  readable: (colors: Colors) => boolean;
}): ContentColors {
  const { pixels, roles, readable } = options;
  // Each image is read and quantized once in a build (an image on every page, the shared one, once), and the colours
  // of an image and a choice are made once.
  const sources = new Map<string, Promise<string | undefined>>();
  const made = new Map<string, Colors | undefined>();
  const sourceOf = (image: string) => {
    if (!sources.has(image))
      sources.set(
        image,
        pixels(image).then((bytes) => (bytes ? sourceColorsOf(bytes)[0] : undefined)),
      );
    return sources.get(image)!;
  };

  return {
    forPage(images, onRead) {
      const allowed = new Set(images);
      return async (image, choice) => {
        if (typeof image !== 'string' || !allowed.has(image)) return undefined;
        if (dynamicProblems(choice, 'contentBased').length) return undefined;
        const { variant, contrast } = choice as ContentBased;
        onRead?.(image);
        const key = JSON.stringify([image, variant, contrast]);
        if (!made.has(key)) {
          const source = await sourceOf(image);
          const colors = source ? dynamicColors({ source, variant, contrast }, roles) : undefined;
          made.set(key, colors && readable(colors) ? colors : undefined);
        }
        return made.get(key);
      };
    },
  };
}
