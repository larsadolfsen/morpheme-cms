// SVG files, as the site and the editor use them: cleaned (cleanSvg), so that only what draws is kept, and an icon as
// the site and the editor draw every icon (Svg in ../src/icon.tsx; the play button of a video in the text, video.mjs):
// the bare <svg> with the file's viewBox and what is inside it, at the size given, in the text's colour
// (fill="currentColor"), hidden from screen readers. So an icon looks the same whether it is a theme's (in any viewBox:
// Material Symbols' 0 -960 960 960) or Phosphor's (0 0 256 256).
//
// An SVG can hold code, which would run in the page an icon is drawn in, or when the file is opened on the site (both
// where the editor's GitHub login is), and can load things from elsewhere. So every SVG the site keeps or draws (the
// logo the owner picks, brand.ts; an icon pack's and a theme's icons, also from the app store) is read here and written
// anew with only the elements and attributes below, no address outside the file (a link only to an id in it, "#…",
// or a picture inside it as a data: PNG, JPEG, WebP or GIF), and no CSS that loads or runs something. What is written
// is built from the parts read, never copied as text, so a file the reading misunderstands still cannot bring
// anything else along.
// Pure JavaScript, so it works the same in the browser (the editor) and in Node (the build, check:content).

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';
const ELEMENTS = new Set(
  (
    'svg g defs symbol use image path circle ellipse rect line polyline polygon text tspan clipPath mask ' +
    'linearGradient radialGradient stop title desc style'
  ).split(' '),
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
// CSS that loads or runs something: a url(…) to anything but an id in the file, the other ways of naming a picture or
// a font by its address (image-set("…"), image("…"), src("…")), @import, IE's expression(…), a javascript: address,
// and any escape (\75 rl(…) is url(…)).
const OUTSIDE = /url\s*\(\s*(?!\s|['"]?\s*#)|image-set\s*\(|\b(image|src)\s*\(|@import|expression\s*\(|javascript:|\\/i;
// A picture inside the file: only a PNG, JPEG, WebP or GIF as data: (the logo made from a PNG, logoFile in brand.ts).
const PICTURE = /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=\s]*$/i;
// A viewBox: four numbers.
const VIEW_BOX = /^\s*-?[\d.]+(?:e-?\d+)?(?:[\s,]+-?[\d.]+(?:e-?\d+)?){3}\s*$/i;

const NAME = '[A-Za-z_][\\w.:-]*';
const TAG = new RegExp(`<(${NAME})((?:\\s+${NAME}\\s*=\\s*(?:"[^"<]*"|'[^'<]*'))*)\\s*(/?)>`, 'y');
const ATTRIBUTE = new RegExp(`(${NAME})\\s*=\\s*(?:"([^"<]*)"|'([^'<]*)')`, 'g');
const CLOSE = new RegExp(`</(${NAME})\\s*>`, 'y');
const DOCTYPE = /<!DOCTYPE\s[^[>]*(?:\[([^\]]*)\])?\s*>/iy;
const ENTITY = /<!ENTITY\s+([A-Za-z_][\w.:-]*)\s+(?:"([^"]*)"|'([^']*)')\s*>/g;
const BUILT_IN = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

/** Text with its references (&amp; &#160; &#xA0; and the file's own entities) as the characters they stand for;
 * null for a reference that is not one. */
function decode(text, entities) {
  let ok = true;
  const out = text.replace(/&(?:#x([0-9a-f]+)|#(\d+)|([A-Za-z_][\w.:-]*))?(;?)/gi, (all, hex, dec, name, end) => {
    const code = hex ? parseInt(hex, 16) : dec ? parseInt(dec, 10) : NaN;
    if (end && (hex || dec) && code > 0 && code <= 0x10ffff) return String.fromCodePoint(code);
    if (end && name && Object.hasOwn(entities, name)) return entities[name];
    ok = false;
    return '';
  });
  return ok ? out : null;
}

/** An XML file as a tree of its elements ({ name, attributes, children }, a child being an element or text), or null
 * when it is not well-formed. Comments, the XML declaration and processing instructions (an xml-stylesheet) are left
 * out; the file's own entities (`<!ENTITY ns_svg "…">`, as old drawing programs wrote them) are put in, nothing else
 * of a DOCTYPE. */
function parse(text) {
  const entities = { ...BUILT_IN };
  const document = { name: '', attributes: [], children: [] };
  const open = [document];
  const addText = (value) => {
    const decoded = decode(value, entities);
    if (decoded === null) return false;
    open.at(-1).children.push(decoded);
    return true;
  };
  let i = 0;
  while (i < text.length) {
    const lt = text.indexOf('<', i);
    if (lt < 0) return addText(text.slice(i)) && open.length === 1 ? document : null;
    if (lt > i && !addText(text.slice(i, lt))) return null;
    const until = (end, from) => {
      const at = text.indexOf(end, from);
      return at < 0 ? -1 : at + end.length;
    };
    if (text.startsWith('<!--', lt)) i = until('-->', lt + 4);
    else if (text.startsWith('<![CDATA[', lt)) {
      i = until(']]>', lt);
      if (i < 0) return null;
      open.at(-1).children.push(text.slice(lt + '<![CDATA['.length, i - 3));
    } else if (text.startsWith('<?', lt)) i = until('?>', lt);
    else if (text.startsWith('<!', lt)) {
      DOCTYPE.lastIndex = lt;
      const doctype = DOCTYPE.exec(text);
      if (!doctype || open.length > 1) return null;
      for (const [, name, double, single] of (doctype[1] ?? '').matchAll(ENTITY)) {
        const value = decode(double ?? single, BUILT_IN);
        if (value === null) return null;
        if (!Object.hasOwn(entities, name)) entities[name] = value;
      }
      i = DOCTYPE.lastIndex;
    } else if (text.startsWith('</', lt)) {
      CLOSE.lastIndex = lt;
      const close = CLOSE.exec(text);
      if (!close || open.length === 1 || open.at(-1).name !== close[1]) return null;
      open.pop();
      i = CLOSE.lastIndex;
    } else {
      TAG.lastIndex = lt;
      const tag = TAG.exec(text);
      if (!tag) return null;
      const attributes = [];
      for (const [, name, double, single] of tag[2].matchAll(ATTRIBUTE)) {
        const value = decode(double ?? single, entities);
        if (value === null) return null;
        if (!attributes.some(([n]) => n === name)) attributes.push([name, value]);
      }
      const element = { name: tag[1], attributes, children: [] };
      open.at(-1).children.push(element);
      if (!tag[3]) open.push(element);
      i = TAG.lastIndex;
    }
    if (i < 0) return null;
  }
  return open.length === 1 ? document : null;
}

const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttribute = (s) => escapeText(s).replace(/"/g, '&quot;');

/** An SVG file with only what draws (see above), or null when it is not one well-formed <svg>. `style`: keep
 * <style> elements, for a file shown on its own (the logo); an icon drawn inside a page has none, as its CSS would
 * apply to the whole page. `svg` is the cleaned file, `viewBox` and `inner` its viewBox (only four numbers) and what is
 * inside its <svg>, and `removed` what was left out (`<script>`, `onload`, …), for check:content.
 * @param {string | undefined} file @param {{ style?: boolean }} [options]
 * @returns {{ svg: string, viewBox: string | undefined, inner: string, removed: string[] } | null} */
export function cleanSvg(file, { style = false } = {}) {
  const document = file === undefined ? null : parse(file);
  const elements = document?.children.filter((c) => typeof c !== 'string') ?? [];
  if (elements.length !== 1 || document.children.some((c) => typeof c === 'string' && c.trim())) return null;
  const removed = new Set();

  /** The namespaces in an element (by their prefix, '' the default one), with those around it. */
  const namespacesIn = (element, around) => {
    const own = { ...around };
    for (const [name, value] of element.attributes)
      if (name === 'xmlns') own[''] = value;
      else if (name.startsWith('xmlns:')) own[name.slice('xmlns:'.length)] = value;
    return own;
  };
  const split = (name) => (name.includes(':') ? name.split(':', 2) : ['', name]);
  /** What of an element's attributes is kept, as [name, value]. */
  const attributesOf = (element, local, namespaces) => {
    const kept = [];
    for (const [name, value] of element.attributes) {
      if (name === 'xmlns' || name.startsWith('xmlns:')) continue;
      const [prefix, own] = split(name);
      const namespace = prefix ? namespaces[prefix] : '';
      if (namespace === XML_NS) continue; // xml:space and xml:lang change nothing that is drawn
      const href = own === 'href' && (namespace === '' || namespace === XLINK_NS);
      if (
        href
          ? (value.startsWith('#') && !OUTSIDE.test(value)) || (local === 'image' && PICTURE.test(value))
          : namespace === '' && ATTRIBUTES.has(name) && !OUTSIDE.test(value)
      )
        kept.push([href ? 'href' : name, value]);
      else removed.add(name);
    }
    return kept;
  };
  /** What is inside an element, as it is written. */
  const innerOf = (element, local, namespaces) => {
    let inner = '';
    for (const child of element.children)
      if (typeof child !== 'string') inner += write(child, namespaces) ?? '';
      else if (local !== 'style' || !OUTSIDE.test(child)) inner += escapeText(child);
      else removed.add('<style>');
    return inner;
  };
  const tag = (local, attributes, inner) => {
    const head = attributes.map(([n, v]) => ` ${n}="${escapeAttribute(v)}"`).join('');
    return inner ? `<${local}${head}>${inner}</${local}>` : `<${local}${head}/>`;
  };
  /** An element as it is written, or null when it is left out. */
  const write = (element, around) => {
    const namespaces = namespacesIn(element, around);
    const [prefix, local] = split(element.name);
    if (namespaces[prefix] !== SVG_NS || !ELEMENTS.has(local) || (local === 'style' && !style)) {
      removed.add(`<${element.name}>`);
      return null;
    }
    return tag(local, attributesOf(element, local, namespaces), innerOf(element, local, namespaces));
  };

  // The <svg> itself, read as SVG also without a namespace of its own, as a browser does inside a page.
  const [root] = elements;
  const namespaces = namespacesIn(root, { '': SVG_NS, xml: XML_NS });
  if (root.name !== 'svg' || namespaces[''] !== SVG_NS) return null;
  const attributes = attributesOf(root, 'svg', namespaces).filter(([name, value]) => {
    if (name !== 'viewBox' || VIEW_BOX.test(value)) return true;
    removed.add(name);
    return false;
  });
  const inner = innerOf(root, 'svg', namespaces);
  const viewBox = attributes.find(([name]) => name === 'viewBox')?.[1].trim();
  return { svg: `${tag('svg', [['xmlns', SVG_NS], ...attributes], inner)}\n`, viewBox, inner, removed: [...removed] };
}

// The icons read, by their file's text: the editor draws the same few icons again and again.
const read = new Map();

/** An SVG file's viewBox and what is inside its <svg>, cleaned (cleanSvg), or null when it is not one <svg>.
 * @param {string | undefined} file @returns {{ viewBox: string | undefined, inner: string } | null} */
export function svgParts(file) {
  if (file === undefined) return null;
  if (!read.has(file)) {
    const clean = cleanSvg(file);
    read.set(file, clean && { viewBox: clean.viewBox, inner: clean.inner });
  }
  return read.get(file);
}

/** The icon as HTML, as <Svg> draws it. @param {string | undefined} file @param {number} size */
export function svgHtml(file, size) {
  const parts = svgParts(file);
  if (!parts) return '';
  const viewBox = parts.viewBox ? ` viewBox="${parts.viewBox}"` : '';
  return `<svg width="${size}" height="${size}" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"${viewBox}>${parts.inner}</svg>`;
}
