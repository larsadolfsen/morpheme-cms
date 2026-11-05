// The site frame's parts on "UI components": header menu, drawer head, footer, action bar and logo.
// Exposes FrameParts (default); each part is a Part with its coverage mark and no drawing.
import { Part } from './PartsShown';
import { t } from './i18n';

const { frame } = t.parts.screens;

const FRAME_PARTS = [
  { id: 'HeaderMenu', use: frame.headerMenu },
  { id: 'DrawerHead', use: frame.drawerHead },
  { id: 'Footer', use: frame.footer },
  { id: 'ActionBar', use: frame.actionBar },
  { id: 'Logo', use: frame.logo },
];

export default function FrameParts() {
  return (
    <>
      {FRAME_PARTS.map((p) => (
        <Part key={p.id} name={p.id} use={p.use} coverage={p.id} />
      ))}
    </>
  );
}
