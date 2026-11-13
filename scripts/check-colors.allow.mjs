// Where a fixed colour is right, and why. Each entry: the kind of finding, the file, the line's text, and the reason. Keep it small:
// a new entry is reviewed. `todo` entries are a cause group that has its own fix pull request; the fix removes them.
const any = /./;
export const allow = [
  // The editor's own look of other products.
  {
    kind: 'fixed-colour',
    file: /^src\/editor\.css$/,
    line: /--editor-status-|editor-status-/,
    reason: "PageSpeed's own ratings (good, average, bad)",
  },
  {
    kind: 'fixed-colour',
    file: /^src\/editor\.css$/,
    line: /--google-/,
    reason: "the search-result preview is Google's own look, light and dark",
  },
  // A colour the owner or a tool chooses.
  {
    kind: 'fixed-colour',
    file: /^src\/(ui|Parts)\.tsx$/,
    line: /linear-gradient|hsl\(\$\{|useState\('#|swatches=|contrast\(|swatchEdge|border-\[rgb\(128/,
    reason: "the colour picker's own gradients, swatches and the text colour on a swatch the owner picked",
  },
  {
    kind: 'palette-class',
    file: /^src\/ui\.tsx$/,
    line: /border-white|swatchEdge/,
    reason: "the colour picker's thumb is white over any colour",
  },
  {
    kind: 'palette-class',
    file: /^src\/(ui|PreviewScreen)\.tsx$/,
    line: /bg-white/,
    reason: "the Preview's frame: a page is shown on paper, whatever the editor's colours",
  },
  {
    kind: 'fixed-colour',
    file: /^(lib\/dynamic-colors|defaults\/colors|demo\/src\/site\/colors)\.ts$/,
    line: /#000000|source: '#/,
    reason: "Material's scrim and shadow roles are black, and the seed colour of a scheme",
  },
  // Images and marks.
  {
    kind: 'fixed-colour',
    file: /favicon\.svg$|^src\/examples\.ts$/,
    line: any,
    reason: 'the brand mark and the example image are images, not themed parts',
  },
  {
    kind: 'fixed-colour',
    file: /^(theme\/blocks\/testimonials\/Testimonial\.tsx|theme\/styles\/blocks\.css)$/,
    line: /mask-?[iI]mage|0 0 #0000/,
    reason: 'a mask fades by alpha only; #000 is its opaque stop; #0000 is no shadow',
  },
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/blocks\.css$/,
    line: /video-facade|^\s*(background: #000|color: #fff|background: linear-gradient\(to bottom, rgb|filter: drop-shadow|text-shadow)/,
    reason: 'the video still: white title and play button over a black shade on an image, whatever the theme',
  },
  // Words, not colours.
  { kind: 'fixed-colour', file: /^(src\/i18n\/|lib\/hooks\.ts)/, line: any, reason: 'a text that names a colour' },
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/(base|global|ui)\.css$/,
    line: /^\s*(--mo-elevation-0-shadow: 0 0 #0000|.*\(0 0 #0000)|0 0 #0000/,
    reason: 'no shadow',
  },
  // Status colours: Material 3 has no success or warning role.
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/global\.css$/,
    line: /--badge-(ok|minor|major)/,
    reason: 'status badges: Material 3 has no success or warning role',
  },
  // todo: each group has its own fix pull request.
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/(base|global|ui|blocks)\.css$/,
    line: /shadow/,
    reason: 'todo (shadows): use the shadow role',
    todo: true,
  },
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/ui\.css$/,
    line: /snackbar/,
    reason: 'todo (snackbar fallbacks): use the inverse roles',
    todo: true,
  },
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/blocks\.css$/,
    line: /^\s*--block-/,
    reason: 'todo (block fallback palette): use the roles',
    todo: true,
  },
  {
    kind: 'fixed-colour',
    file: /^worker\/mcp-oauth\.js$/,
    line: any,
    reason: 'todo (the sign-in page of the AI connection has its own fixed palette)',
    todo: true,
  },
  {
    kind: 'state-layer',
    file: /^theme\/styles\/ui\.css$/,
    line: /segmented-(hover|pressed)|tab-(hover|pressed)/,
    reason: "todo (state layers): hover is Material's 8%",
    todo: true,
  },
  {
    kind: 'state-layer',
    file: /^src\/pagePreview\.tsx$/,
    line: /outline: 2px dotted/,
    reason: 'an outline hint in the Preview, not a state layer',
  },
];
