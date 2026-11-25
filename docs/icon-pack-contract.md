# Icon pack contract (`ICON_PACK_API` 1)

An icon pack is a store item of the kind `icons` (id `icons_` and 16 lowercase hex characters, a handle such as `morpheme/phosphor`).
It is data: SVG files and text. It has no code, no dependencies, no `role`, no hooks and no settings.

## The folder

In the store and, once installed, in the site as `src/icon-packs/<id>/` (`STORE_PACKS_FOLDER`, `iconPackFolder`):

| File | Meaning |
| :--- | :--- |
| `pack.json` | `name`, `author`, `license` (SPDX id), `api` (this contract), `version`, `url`, optional `description` (`{ "en-US": …, "da-DK": … }`), `style` (`outline`, `filled`, `duotone`, `mixed`) and `includes` for icons taken from other sets, each with its own `LICENSE-<set>`. |
| `LICENSE` | The pack's licence text. |
| `<icon>.svg` | One file per icon the pack draws its own way, by its Material Symbols name (`location_on.svg`; `<name>-fill.svg` is the filled one). |
| `store.json` | Written by the install: `version`, `ref`, `files` (as an app's and a theme's). |

## Rules

- **A pack may lack icons.** The store does not check coverage. An icon the pack lacks is drawn in Material Symbols; only a name Material Symbols lacks too is missing. A missing icon is a notice, never a build failure.
- **Safety.** An SVG draws only; `svgProblems` (`site/icons.mjs`) runs when the pack is released and again when it is installed.
- **Uninstall is never refused.** A site whose chosen pack is not installed draws Material Symbols, with no warning (`RETIRED_PACKS`, `packInUse`).
- **The catalog.** An entry of `icons` in `catalog.json` carries `id`, `handle`, `version`, `api`, `name`, `author`, `license`, `files`, and `samples` (five inline SVGs), and optional `style`, `description`, `releaseNotes` and `licenses`. The editor reads only entries written to a contract in `ICON_PACK_APIS` (`lib/contracts.mjs`) and ignores the rest; a catalog without `icons` has no packs.
- **The pick.** `src/data/icons.json` holds the store id: `{ "pack": "icons_0123456789abcdef" }`.

`ICON_PACK_API` is raised when a pack written to the one before no longer works.
