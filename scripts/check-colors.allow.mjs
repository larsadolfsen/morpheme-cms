// Where a fixed colour is right, and why. Each entry: the kind of finding, the file, the line's text, and the reason. Keep it small:
// a new entry is reviewed. `todo` entries are a cause group that has its own fix pull request; the fix removes them.
const any = /./;
export const allow = [
  // The text style's keys and code blocks: the typography plugin's own greys, kept as they were (batch T13); a later, visible change moves them to roles.
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/tokens\/base\/comp\/prose\.css$/,
    line: /--mo-comp-prose-(kbd|kbd-shadows|pre-code|pre-bg):/,
    reason:
      "the plugin's fixed greys for keys and code blocks, the same in light and dark; the move to roles is a later, visible change (plan T13)",
  },
  // The editor's own look of other products.
  {
    kind: 'fixed-colour',
    file: /^src\/editor\.css$/,
    line: /--mo-comp-editor-status-/,
    reason: "PageSpeed's own ratings (good, average, bad)",
  },
  {
    kind: 'fixed-colour',
    file: /^src\/editor\.css$/,
    line: /--mo-comp-google-/,
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
    kind: 'fixed-colour',
    file: /^src\/editor-screens\.css$/,
    line: /background-color: #fff/,
    reason: "the Preview's frame: a page is shown on paper, whatever the editor's colours",
  },
  {
    kind: 'palette-class',
    file: /^src\/ui\.tsx$/,
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
    file: /^(theme\/blocks\/testimonials\/Testimonial\.tsx|theme\/styles\/blocks(\/[a-z-]+)?\.css)$/,
    line: /mask-?[iI]mage|0 0 #0000/,
    reason: 'a mask fades by alpha only; #000 is its opaque stop; #0000 is no shadow',
  },
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/blocks(\/[a-z-]+)?\.css$/,
    line: /mo-block-video__facade|^\s*(background: #000|color: #fff|background: linear-gradient\(to bottom, rgb|filter: drop-shadow|text-shadow)/,
    reason: 'the video still: white title and play button over a black shade on an image, whatever the theme',
  },
  // Words, not colours.
  { kind: 'fixed-colour', file: /^(src\/i18n\/|lib\/hooks\.ts)/, line: any, reason: 'a text that names a colour' },
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/(base|global|ui|cards|tokens\/[a-z]+\/[a-z-]+)\.css$/,
    line: /^\s*(--mo-sys-elevation-level0-shadow: 0 0 #0000|.*\(0 0 #0000)|0 0 #0000/,
    reason: 'no shadow',
  },
  // The @property registry: the default of a colour token has to be a literal (an initial-value cannot hold a var()), see docs/theme-token-files.md.
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/tokens\/[a-z]+\/registry\.css$/,
    line: /^\s*initial-value: /,
    reason: 'the default of a registered colour token: a literal, so a faulty theme value falls back to it',
  },
  // Status colours: Material 3 has no success or warning role.
  {
    kind: 'fixed-colour',
    file: /^theme\/styles\/(global|tokens\/material\/comp\/badge)\.css$/,
    line: /--mo-comp-badge-(ok|minor|major)/,
    reason: 'status badges: Material 3 has no success or warning role',
  },
  {
    kind: 'state-layer',
    file: /^theme\/styles\/tokens\/material\/comp\/bottom-sheet\.css$/,
    line: /drag-handle-color/,
    reason:
      "the sheet's drag handle in on-surface-variant at 40%, M3's `sheet.bottom.docked.drag-handle.opacity`: a handle, not a state layer (its name says drag)",
  },
  {
    kind: 'state-layer',
    file: /^src\/pagePreview\.tsx$/,
    line: /outline: 2px dotted/,
    reason: 'an outline hint in the Preview, not a state layer',
  },
];
