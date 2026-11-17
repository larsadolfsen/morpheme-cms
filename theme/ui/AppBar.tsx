// The app bar, Material 3's name (m3.material.io/components/app-bars: "Four variants: Search app bar, small, medium
// flexible, large flexible"), which it called the top app bar before. Import it by this name: `AppBar`, its kinds
// (`appBarKinds`), its class (`appBarClass`) and its classes (`appBarClasses`). The code is in TopAppBar.tsx, the file a
// theme draws its own bar in until a later THEME_API removes it, so this name and the old one (TopAppBar, topAppBarClass …) are the
// same bar, a theme's own one too (@theme/ui/TopAppBar is the theme's file, else the standard theme's).
export {
  default,
  topAppBarKinds as appBarKinds,
  topAppBarClass as appBarClass,
  topAppBarClasses as appBarClasses,
  type TopAppBarKind as AppBarKind,
  type TopAppBarAlign as AppBarAlign,
} from '@theme/ui/TopAppBar';
