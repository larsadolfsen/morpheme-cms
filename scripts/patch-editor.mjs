import fs from 'fs';
let code = fs.readFileSync('playground/src/site/editor.ts', 'utf8');
code = code.replace(
  'videresendelser: Signpost,\n  tema: PaintBrushBroad,',
  'videresendelser: Signpost,\n  seo: Signpost,\n  tema: PaintBrushBroad,\n  udseende: PaintBrushBroad,'
);
code = code.replace(
  "ids: ['tema', 'cookies', 'maaling', 'videresendelser']",
  "ids: ['udseende', 'cookies', 'maaling', 'seo']"
);
fs.writeFileSync('playground/src/site/editor.ts', code, 'utf8');
console.log('Patched editor.ts successfully');
