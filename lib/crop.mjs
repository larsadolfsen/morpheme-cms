// A picture in the text cut to a format (its sides, as 2:3) in the editor (Crop.tsx), written after
// its address in the Markdown, so the file and the picture stay as they are:
//   ![Kontoret](/images/uploads/2024/05/kontor.webp#format=2:3&crop=12.5,0,75,100)
// crop: the part of the picture that is shown, in percent of its width and height: from the left,
// from the top, its width and its height. Shown so on the site (rehypeResponsiveImages, images.mjs)
// and on its card in the editor (MarkdownEditor.tsx). Without crop the middle of it is shown.
// A decorative picture ("Decorative picture": screen readers skip it) is marked there too, alone or after
// the format and crop, and drawn with alt="" on the site:
//   ![](/images/uploads/2024/05/blomst.webp#decorative)
// The mark is part of the address, so Milkdown keeps it as it is, and a visitor never sees it.

/** The formats a picture can be cut to, as width:height. */
export const FORMATS = ['1:1', '4:5', '3:4', '2:3', '3:2', '4:3', '16:9'];

const FORMAT = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/;

/** Width divided by height of a format ('2:3'), or 0 when it is none. */
export function ratioOf(format) {
  const m = String(format ?? '').match(FORMAT);
  return m && +m[1] > 0 && +m[2] > 0 ? +m[1] / +m[2] : 0;
}

const DECORATIVE = 'decorative';

/** Whether a picture's address is marked decorative, and the address without the mark (else as it is). */
export function decorativeOf(address) {
  const text = String(address);
  const at = text.indexOf('#');
  const params = at < 0 ? [] : text.slice(at + 1).split('&');
  const rest = params.filter((p) => p !== DECORATIVE);
  if (rest.length === params.length) return { address: text, decorative: false };
  return { address: text.slice(0, at) + (rest.length ? `#${rest.join('&')}` : ''), decorative: true };
}

/** The address marked decorative, or without the mark. */
export function decorated(address, decorative) {
  const plain = decorativeOf(address).address;
  return decorative ? `${plain}${plain.includes('#') ? '&' : '#'}${DECORATIVE}` : plain;
}

/** The picture's own address, its format and crop ([left, top, width, height]) when it has them (an
 * address without a format is left as it is), and whether it is decorative. */
export function splitPicture(address) {
  const { address: own, decorative } = decorativeOf(address);
  const [src, fragment = ''] = own.split('#');
  const params = new URLSearchParams(fragment);
  const format = params.get('format');
  if (!ratioOf(format)) return { src: own, format: '', crop: null, decorative };
  const crop = (params.get('crop') ?? '').split(',').map(Number);
  const fits = crop.length === 4 && crop.every((n) => Number.isFinite(n) && n >= 0 && n <= 100) && crop[2] > 0 && crop[3] > 0;
  return { src, format, crop: fits ? crop : null, decorative };
}

const round = (n) => Math.round(n * 10) / 10;

/** The address with the format and crop after it (only the address without a format), marked decorative when it is. */
export function joinPicture(src, format, crop, decorative = false) {
  if (!ratioOf(format)) return decorated(src, decorative);
  return decorated(`${src}#format=${format}${crop ? `&crop=${crop.map(round).join(',')}` : ''}`, decorative);
}

/** The largest part of a picture (aspect: its width divided by its height) in a format, in the middle. */
export function middleCrop(aspect, format) {
  const ratio = ratioOf(format);
  if (!ratio || !aspect) return null;
  const [w, h] = aspect > ratio ? [(ratio / aspect) * 100, 100] : [100, (aspect / ratio) * 100];
  return [(100 - w) / 2, (100 - h) / 2, w, h];
}

/** The styles of a cut picture: its box (in the format) and the picture in it, as CSS text; how much
 * wider than the box the picture is (for its sizes). Without a crop the picture is its own box. */
export function cropStyle(format, crop) {
  const [a, b] = format.split(':');
  const aspect = `aspect-ratio: ${a} / ${b}`;
  if (!crop) return { box: null, img: `${aspect}; object-fit: cover`, scale: 1 };
  const [x, y, w] = crop;
  return {
    box: aspect,
    // The picture's width in percent of the box's, moved by percent of its own size.
    img: `width: ${Math.round((100 / w) * 100 * 100) / 100}%; transform: translate(${-round(x)}%, ${-round(y)}%)`,
    scale: 100 / w,
  };
}
