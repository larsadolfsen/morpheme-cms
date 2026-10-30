// The logo and the icons, made in the browser from a picture the owner picks (BrandForm.tsx).
//   Logo: public/butterfly.svg, shown next to the name on the site as a CSS mask (global.css .butterfly),
//     so only its shape counts and it takes the site's colour. An SVG is kept as it is, without code; other
//     pictures are put inside an SVG.
//   Icon: public/favicon.svg (the browser tab, Google), public/favicon.ico (for what asks for that
//     address), public/apple-touch-icon.png (the site on an iPhone home screen) and the app icons in
//     public/editor/, drawn on the site's background colour (light mode, colors.json) with the same
//     margins as packages/editor/scripts/editor-icons.mjs.
import { t } from './i18n';

export const LOGO = 'public/butterfly.svg';
export const FAVICON = 'public/favicon.svg';
const FAVICON_ICO = 'public/favicon.ico';
// The PNG icons: size in pixels and the picture's share of the width.
const APP_ICONS: [string, number, number][] = [
  ['public/editor/icon-192.png', 192, 0.7],
  ['public/editor/icon-512.png', 512, 0.7],
  ['public/editor/icon-maskable-512.png', 512, 0.5],
  ['public/editor/apple-touch-icon.png', 180, 0.66],
  ['public/apple-touch-icon.png', 180, 0.66],
];
export const BRAND_FILES = [LOGO, FAVICON, FAVICON_ICO, ...APP_ICONS.map(([path]) => path)];

export type Picture = { image: HTMLImageElement; svg: string | null };

// An SVG can hold code, which would run if the file was opened on the site (and could read the
// editor's GitHub login there). So the logo keeps only what draws a shape: the elements and attributes
// below, no address outside the file (a link only to an id in it, "#..."); everything else is left out.
const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const ELEMENTS = new Set(
  'svg g defs symbol use path circle ellipse rect line polyline polygon text tspan clipPath mask linearGradient radialGradient stop title desc style'.split(
    ' ',
  ),
);
const ATTRIBUTES = new Set(
  (
    'id class style viewBox width height x y x1 y1 x2 y2 cx cy r rx ry fx fy fr d points transform preserveAspectRatio ' +
    'fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-miterlimit stroke-dasharray ' +
    'stroke-dashoffset stroke-opacity opacity clip-path clip-rule mask clipPathUnits maskUnits maskContentUnits ' +
    'offset stop-color stop-opacity gradientUnits gradientTransform spreadMethod display visibility ' +
    'font-family font-size font-weight font-style text-anchor dominant-baseline letter-spacing'
  ).split(' '),
);
// A url(...) to anything but an id in the file, or CSS that can load or run something.
const OUTSIDE = /url\s*\(\s*['"]?\s*(?!#)|@import|expression\s*\(|javascript:/i;

function cleanSvg(text: string): Element {
  const source = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
  if (source.localName !== 'svg' || source.namespaceURI !== SVG_NS) throw new Error(t.company.brand.svgUnreadable);
  const doc = document.implementation.createDocument(SVG_NS, null, null);
  const copy = (from: Element): Element | null => {
    if (from.namespaceURI !== SVG_NS || !ELEMENTS.has(from.localName)) return null;
    const to = doc.createElementNS(SVG_NS, from.localName);
    for (const a of Array.from(from.attributes)) {
      if (OUTSIDE.test(a.value)) continue;
      if (a.localName === 'href' && (!a.namespaceURI || a.namespaceURI === XLINK_NS)) {
        if (a.value.startsWith('#')) to.setAttribute('href', a.value);
      } else if (!a.namespaceURI && ATTRIBUTES.has(a.name)) to.setAttribute(a.name, a.value);
    }
    for (const child of Array.from(from.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = copy(child as Element);
        if (el) to.appendChild(el);
      } else if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
        const value = child.textContent ?? '';
        if (from.localName !== 'style' || !OUTSIDE.test(value)) to.appendChild(doc.createTextNode(value));
      }
    }
    return to;
  };
  return copy(source)!;
}

// Opens a picture (SVG, PNG, JPEG, WebP).
export async function openPicture(file: Blob): Promise<Picture> {
  let svg: string | null = null;
  let blob = file;
  if (file.type === 'image/svg+xml' || (file instanceof File && /\.svg$/i.test(file.name))) {
    const root = cleanSvg(await file.text());
    svg = new XMLSerializer().serializeToString(root) + '\n';
    // Without a width and height an SVG has no size to draw from; give it one from its viewBox.
    const box = root
      .getAttribute('viewBox')
      ?.split(/[\s,]+/)
      .map(Number);
    if (box?.length === 4 && !root.getAttribute('width')) {
      const scale = 512 / Math.max(box[2], box[3]);
      root.setAttribute('width', String(box[2] * scale));
      root.setAttribute('height', String(box[3] * scale));
    }
    blob = new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml' });
  }
  const image = new Image();
  image.src = URL.createObjectURL(blob);
  await image.decode().catch(() => {
    throw new Error(t.company.brand.cannotOpen);
  });
  return { image, svg };
}

// The picture on a square of `px`, as large as `share` of it allows; on `bg` and in `tint` if given.
function draw({ image }: Picture, px: number, share: number, bg?: string, tint?: string): HTMLCanvasElement {
  const scale = (px * share) / Math.max(image.naturalWidth, image.naturalHeight);
  const [w, h] = [image.naturalWidth * scale, image.naturalHeight * scale];
  const picture = document.createElement('canvas');
  picture.width = picture.height = px;
  const ctx = picture.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, (px - w) / 2, (px - h) / 2, w, h);
  if (tint) {
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, px, px);
  }
  if (!bg) return picture;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px;
  const out = canvas.getContext('2d')!;
  out.fillStyle = bg;
  out.fillRect(0, 0, px, px);
  out.drawImage(picture, 0, 0);
  return canvas;
}

const png = (canvas: HTMLCanvasElement) =>
  new Promise<Uint8Array>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? b.arrayBuffer().then((a) => resolve(new Uint8Array(a))) : reject(new Error(t.company.brand.notReady))),
      'image/png',
    ),
  );

// An ICO file with one PNG in it (`px` square), as packages/editor/scripts/editor-icons.mjs makes it.
function ico(image: Uint8Array, px: number): Uint8Array {
  const file = new Uint8Array(22 + image.length);
  const head = new DataView(file.buffer);
  head.setUint16(2, 1, true); // an icon
  head.setUint16(4, 1, true); // one picture
  file[6] = file[7] = px; // width and height
  head.setUint16(10, 1, true); // colour planes
  head.setUint16(12, 32, true); // bits per pixel
  head.setUint32(14, image.length, true);
  head.setUint32(18, 22, true); // where the picture starts
  file.set(image, 22);
  return file;
}

const dataUrl = (canvas: HTMLCanvasElement) => canvas.toDataURL('image/png');

// Whether a picture has no see-through background (its corners are solid), so that as a mask it
// would be a plain square.
export function solid({ image }: Picture): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, 32, 32);
  return [
    [0, 0],
    [31, 0],
    [0, 31],
    [31, 31],
  ].every(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3] > 250);
}

// The logo file: an SVG as it is (cleaned, openPicture), another picture (at most 600 px) inside an SVG.
export function logoFile(picture: Picture): string {
  if (picture.svg) return picture.svg;
  const { naturalWidth: w, naturalHeight: h } = picture.image;
  const scale = Math.min(1, 600 / Math.max(w, h));
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [Math.round(w * scale), Math.round(h * scale)];
  canvas.getContext('2d')!.drawImage(picture.image, 0, 0, canvas.width, canvas.height);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}">` +
    `<image href="${dataUrl(canvas)}" width="${canvas.width}" height="${canvas.height}"/></svg>\n`
  );
}

// The icon files from a picture, on the site's background colour (`bg`). `fromLogo`: the logo's shape in
// the accent colour (`accent`), like the butterfly.
export async function iconFiles(
  picture: Picture,
  fromLogo: boolean,
  { bg: BG, accent }: { bg: string; accent: string },
): Promise<{ files: Record<string, string | Uint8Array>; preview: string }> {
  const tint = fromLogo ? accent : undefined;
  const files: Record<string, string | Uint8Array> = {};
  // The favicon: a rounded square with the picture inside, nested like the one
  // packages/editor/scripts/editor-icons.mjs reads.
  files[FAVICON] =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${BG}"/>` +
    `<svg x="8" y="8" width="48" height="48" viewBox="0 0 256 256"><image href="${dataUrl(draw(picture, 256, 1, undefined, tint))}" width="256" height="256"/></svg></svg>\n`;
  files[FAVICON_ICO] = ico(await png(draw(picture, 32, 0.75, BG, tint)), 32);
  for (const [path, px, share] of APP_ICONS) files[path] = await png(draw(picture, px, share, BG, tint));
  const preview = URL.createObjectURL(new Blob([files[APP_ICONS[0][0]] as BlobPart], { type: 'image/png' }));
  return { files, preview };
}
