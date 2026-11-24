// Where a literal corner or type value is right, and why. Same shape as check-colors.allow.mjs:
// the file, the line's text and the reason. Keep it small: a new entry is reviewed.
export const allow = [
  {
    file: /^src\/editor-settings\.css$/,
    line: /^font-size: (0\.875|1|1\.5)rem|^line-height: (1\.25rem|1\.5|1\.375|2rem)$|^border-radius: (0\.5|0\.75|1|1\.375)rem|^border-radius: 3px/,
    reason:
      "the old text-sm, text-base, text-2xl, leading-snug, rounded-lg, rounded-xl, rounded-2xl and the sign-in icon's and ratio box's own corners of the editor's settings and tools, moved as they were (Tailwind batch T08: the same look first, the type roles and corner steps in the M3 pass, T13)",
  },
  {
    file: /editor-forms\.css$/,
    line: /^(font-size: 20px|line-height: (22|26)px|letter-spacing: -0\.025em)/,
    reason:
      "the search result preview draws Google's own result at Google's own pixel sizes, and the logo preview draws the name at the site logo's tracking; neither is a step of the scale",
  },
  {
    file: /^src\/editor-rest\.css$/,
    line: /^font-size: (0\.875|1)rem|^line-height: 1\.(25|5)rem|^border-radius: (0\.5|0\.75)rem/,
    reason:
      "the old text-sm, text-base, rounded-lg and rounded-xl of the editor's small files, moved as they were (Tailwind batch T09: the same look first, the type roles and corner steps in the M3 pass, T13)",
  },
  {
    file: /^src\/editor-screens\.css$/,
    line: /^font-size: 0\.(875|75)rem|^line-height: 1(\.25)?rem|^border-radius: (0\.75|1)rem|^border-radius: calc\(infinity \* 1px\)/,
    reason:
      'the old text-sm, text-xs, rounded-xl, rounded-2xl and rounded-full (calc(infinity * 1px)) of the large screens, moved as they were (Tailwind batch T06: the same look first, the type roles and corner steps in the M3 pass, T13)',
  },
  {
    file: /(^|\/)styles\/prose\.css$/,
    line: /^(font-size|line-height|border-radius): /,
    reason:
      "the text style's sizes, line heights and corners are the typography plugin's own values, kept as they were (batch T13); Material 3 tuning of the text is a later, visible change (plan, decision 6)",
  },
  {
    file: /base\.css$|blocks(\/[a-z-]+)?\.css$|tokens\/(base|blocks)\/sys\.css$/,
    line: /^--mo-(sys-shape-corner-(medium|large)|comp-block-(radius|radius-small|control-radius)): /,
    reason: 'the fallback corners for a theme that sets no steps (global.css sets the ten steps and maps these to them)',
  },
  {
    file: /global\.css$|tokens\/material\/comp\/slider\.css$/,
    line: /^--mo-comp-slider-active-track-inner-corner-corner-size: 0\.125rem/,
    reason: "the slider's inner track corner: M3 draws it 2dp",
  },
  {
    file: /base\.css$/,
    line: /^border-radius: 6px/,
    reason: 'the focus ring of every part: M3 draws it to the part, here one round-off for any element',
  },
  { file: /base\.css$/, line: /^border-radius: 0\.3em/, reason: 'inline code: its corners follow the text size, not a step' },
  {
    file: /global\.css$|ui\.css$|checkbox\.css$|material\/fields\.css$/,
    line: /^border-radius: (2px|0\.1875rem)/,
    reason: "the checkbox's own 2px square corner (M3: 2dp), and the error ring's 3px over it",
  },
  {
    file: /blocks(\/[a-z-]+)?\.css$|ui\.css$|cards\.css$/,
    line: /^border-radius: calc\(/,
    reason: 'optical roundness: the container corner minus its padding or border',
  },
  {
    file: /ui\.css$|menus\.css$/,
    line: /^--mo-comp-menus-menu-item-shape, calc|^border-radius: var\(--mo-comp-menus-menu-item-shape, calc/,
    reason: 'a menu item inside the container: the container corner minus its padding',
  },
  {
    file: /editor\.css$/,
    line: /font-size|line-height|letter-spacing/,
    reason:
      "the editor's page preview draws the site's own headings and texts at the sizes of the components' classes (docs/editor.md); they move together with the site's blocks",
  },
  {
    file: /^src\/.*\.tsx$/,
    line: /^(text-\[20px\]|leading-\[2[26]px\])$/,
    reason: "the search-result preview is Google's own look: 20px/26px title and 22px lines, not M3 steps",
  },
  {
    file: /^src\/.*\.tsx$/,
    line: /^(rounded-\[3px\]|rounded-\[1\.375rem\]|border-\[1\.5px\]|border-\[3px\])$/,
    reason:
      "a crop handle's 3px corner and 1.5px line, the app icon's 22px corner (the icon's own shape, as on a phone's home screen) and a 3px line: not steps of a scale",
  },
  {
    file: /blocks(\/[a-z-]+)?\.css$|ui\.css$|cards\.css$|global\.css$|material\/[a-z-]+\.css$|base\.css$|site-logo-post\.css$|site-action\.css$|site-page\.css$|text-field\.css$/,
    line: /^(font-size|line-height|letter-spacing)\b/,
    reason: 'not yet moved to the type scale: tracked for the next pull request of the shape and type sweep',
  },
  {
    file: /^theme\/styles\/site-(blog|header)\.css$/,
    line: /^(line-height: 1\.(25|375)|border-radius: calc\(infinity \* 1px\))$/,
    reason:
      "moved as it was from the utility classes leading-tight, leading-snug and rounded-full (batch T11, a pure migration): the line height of a wrapper whose parts set their own, and a portrait's full circle; the shape and type sweep takes them to the scales",
  },
  {
    file: /^theme\/styles\/reset\.css$/,
    line: /^(line-height: 1\.5|font-size: 1em)/,
    reason:
      "the reset's values are Tailwind's preflight as it was (batch T14, a pure migration): the page's default line height before the body's own, and the code elements' size that keeps em from compounding",
  },
  {
    file: /^theme\/styles\/prose\.css$/,
    line: /^box-shadow: 0 0 0 1px var\(--mo-comp-prose-kbd-shadows\), 0 3px 0 var\(--mo-comp-prose-kbd-shadows\)$/,
    reason: 'the kbd key edge has an offset and no blur: it draws the edge of a key, not a height (elevation spec, The check)',
  },
  {
    file: /^src\/editor\.css$/,
    line: /^box-shadow: 0 -?3px 0 0 var\(--mo-sys-color-primary\)$/,
    reason: "the editor's drop indicator is a 3px line above or below a part: an offset and no blur, a line and not a height",
  },
  {
    file: /^theme\/styles\/blocks\/prose\.css$/,
    line: /^filter: drop-shadow\(0 2px 8px rgb\(0 0 0 \/ 0\.5\)\)$/,
    reason:
      "the video facade's play icon sits on a video, M3's case for a shadow (\"Protect elements\"); drop-shadow() takes one shadow and not the level tokens' two-part list, so it keeps a drop-shadow of level 3's strength until the icon is drawn as a box",
  },
];
