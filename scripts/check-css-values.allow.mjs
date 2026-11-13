// Where a literal corner or type value, or an off-scale Tailwind class, is right, and why. Same shape as check-colors.allow.mjs:
// the file, the line's text and the reason. Keep it small: a new entry is reviewed.
export const allow = [
  {
    file: /base\.css$|blocks\.css$/,
    line: /^--(radius|radius-small|block-radius|block-radius-small|block-control-radius): /,
    reason: 'the fallback corners for a theme that sets no steps (global.css sets the ten steps and maps these to them)',
  },
  { file: /global\.css$/, line: /^--slider-track-inner-radius: 0\.125rem/, reason: "the slider's inner track corner: M3 draws it 2dp" },
  {
    file: /base\.css$/,
    line: /^border-radius: 6px/,
    reason: 'the focus ring of every part: M3 draws it to the part, here one round-off for any element',
  },
  { file: /base\.css$/, line: /^border-radius: 0\.3em/, reason: 'inline code: its corners follow the text size, not a step' },
  {
    file: /global\.css$|ui\.css$/,
    line: /^border-radius: (2px|0\.1875rem)/,
    reason: "the checkbox's own 2px square corner (M3: 2dp), and the error ring's 3px over it",
  },
  {
    file: /blocks\.css$|ui\.css$/,
    line: /^border-radius: calc\(/,
    reason: 'optical roundness: the container corner minus its padding or border',
  },
  {
    file: /ui\.css$/,
    line: /^--menu-item-radius, calc|^border-radius: var\(--menu-item-radius, calc/,
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
    line: /^(text-(lg|xl|4xl)|rounded-md|rounded-\[[0-9.]+(px|rem)\]|text-\[20px\]|leading-\[2[26]px\]|tracking-\[0\.00625rem\]|border-\[[0-9.]+px\])$/,
    reason:
      "the editor's own chrome: off-scale sizes (18, 20, 36 px text; 6 px, 3 px and 22 px corners; 1.5 and 3 px lines) that move to a step in a pull request that changes how the editor looks (the owner decides)",
  },
  {
    file: /blocks\.css$|ui\.css$|global\.css$|base\.css$|components\.css$/,
    line: /^(font-size|line-height|letter-spacing)\b/,
    reason: 'not yet moved to the type scale: tracked for the next pull request of the shape and type sweep',
  },
];
