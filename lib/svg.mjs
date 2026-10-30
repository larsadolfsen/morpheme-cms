// An icon's SVG file, as the site and the editor draw every icon (Svg in ../src/icon.tsx; the play button of a video in
// the text, video.mjs): the bare <svg> with the file's viewBox and what is inside it, at the size given, in the text's
// colour (fill="currentColor"), hidden from screen readers. So an icon looks the same whether it is a theme's (in any
// viewBox: Material Symbols' 0 -960 960 960) or Phosphor's (0 0 256 256).

/** An SVG file's viewBox and what is inside its <svg>, or null when it is not one <svg>.
 * @param {string | undefined} file @returns {{ viewBox: string | undefined, inner: string } | null} */
export function svgParts(file) {
  const [, attrs, inner] = file?.match(/^\s*<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/) ?? [];
  return attrs === undefined ? null : { viewBox: attrs.match(/\bviewBox="([^"]*)"/)?.[1], inner };
}

/** The icon as HTML, as <Svg> draws it. @param {string | undefined} file @param {number} size */
export function svgHtml(file, size) {
  const parts = svgParts(file);
  if (!parts) return '';
  const viewBox = parts.viewBox ? ` viewBox="${parts.viewBox}"` : '';
  return `<svg width="${size}" height="${size}" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"${viewBox}>${parts.inner}</svg>`;
}
