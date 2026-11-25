// The four places an app runs code in (build, editor, worker, pages) and the access it has in each: "Sandboxed" or "Full access".
// Exposes AppPlaces (default). Depends on ./ui (ListItem), ./i18n and the AppPlaces type of lib/appPlaces.mjs.
import { ListItem } from './ui';
import { t } from './i18n';
import type { AppPlaces as Places } from '../lib/appPlaces.mjs';
import { materialIcon, type IconComponent as Icon } from './icon';

const rows: { place: keyof Places; icon: Icon; label: () => string }[] = [
  { place: 'build', icon: materialIcon('hardware'), label: () => t.apps.placeBuild },
  { place: 'editor', icon: materialIcon('edit'), label: () => t.apps.placeEditor },
  { place: 'worker', icon: materialIcon('storage'), label: () => t.apps.placeWorker },
  { place: 'pages', icon: materialIcon('web'), label: () => t.apps.placePages },
];

/** A row for each place of an app, with its access under its name; a place without code says nothing under it. The rows
 * of a Group (the app page's "Permissions"). */
export default function AppPlaces({ places }: { places: Places }) {
  return (
    <>
      {rows.map(({ place, icon, label }) => (
        <ListItem
          key={place}
          icon={icon}
          headline={label()}
          supporting={places[place] === 'none' ? undefined : t.apps.access[places[place]]}
        />
      ))}
    </>
  );
}
