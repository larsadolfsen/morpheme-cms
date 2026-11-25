# Forms: autocomplete (notes)

Status: notes from the owner, 25 Nov 2026. No design or plan yet. This file keeps what is open until forms are next worked on.
(`2026-11-15-forms-design.md` is the Forms app of the app platform, not the editor's form parts, so this is a separate file.)

1. **The gap.** Material 3 has a filled and an outlined autocomplete (tokens `md.comp.filled-autocomplete` and `md.comp.outlined-autocomplete` in `docs/m3-tokens/`). The theme has no component by that name. Selects exist as the exposed dropdown menu (`theme/ui/ExposedDropdownMenu.tsx`), and search has its own suggestions list (`theme/ui/Search.tsx`). It is **not yet checked** whether either follows the autocomplete spec. A form that needs a text field with suggestions therefore has no Material 3 part.

2. **To check when forms are next worked on.**
   - Read the m3.material.io text-fields and menus pages for autocomplete (the real pages, skill `material-3`).
   - Compare them with `ExposedDropdownMenu`.
   - Decide whether to add a `ThemeAutocomplete` or to extend the dropdown. Adding a component needs the owner's yes (skill `developer`, *no own components*).
