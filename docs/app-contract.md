# App contract

The contract is the set of rules between the editor and an app. `APP_API` in `lib/contracts.mjs` holds its version. An app in the store says which version it is written to in its `api` field.

## App types with one active app

- The `subcategory` of an app is its type: `redirects` and `links`, both under the category `seo`. An app written before still has the category `redirects` or `links`; the editor reads that as the same subcategory of `seo` (`categoryOf` in `lib/storeCategories.mjs`).
- A type allows one active app when two apps of that type collide in code or data.
- `ONE_APP_TYPES` in `lib/appTypes.mjs` lists those types. Today: the subcategories `redirects` and `links` of `seo`.
- When an owner activates an app of such a type, the editor shows a warning and deactivates the other app of that type.
- Activate means install, or turn on the Enabled switch.
- The deactivated app keeps its folder, settings and data.
- The other types allow many active apps.

## Contract 3: `@app/self`

Contract 3 adds one module. An app file can import the id of its own folder.

```ts
import self from '@app/self';

self.id; // 'app_a030dfba69793996'
```

- `self.id` is the folder name under `src/apps/`. Apps from the store have a store id such as `app_a030dfba69793996`. An app a site made itself, and an older store copy, keep a plain name such as `cookiescanner` or `mobilepay`.
- Use `self.id` where the app needs its own id. Do not write the folder name in the code.
- Only files under `src/apps/<id>/` can import `@app/self`. Any other file fails the build with `@app/self is only for app files: <path>`.
- The Vite plugin is `appSelf` in `site/appSelf.mjs`. The types are in `src/virtual.d.ts`.

## Contract 2

Apps written to contract 2 build and run as before. Contract 3 only adds `@app/self`.
