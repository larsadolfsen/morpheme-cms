// The text field menu, Material 3's name (m3.material.io/components/menus: "Dropdown menu and exposed dropdown menu are
// now both referred to as menu"; text fields: "Text field dropdown menus"): a text field that opens a menu of choices.
// Import it by this name: `TextFieldMenu`, its option (`TextFieldMenuOption`) and its class (`textFieldMenuClass`). The
// code is in ExposedDropdownMenu.tsx, the file a theme draws its own in until a later THEME_API removes it, so this name and the old
// one (ExposedDropdownMenu, exposedDropdownMenuClass) are the same part, a theme's own one too.
export {
  default,
  exposedDropdownMenuClass as textFieldMenuClass,
  type ExposedDropdownMenuOption as TextFieldMenuOption,
} from '@theme/ui/ExposedDropdownMenu';
