// The four places an app runs code in (build, editor, worker, pages) and the access it has in each: "Sandboxed" or "Full access".
// Exposes AppPlaces (default). Depends on ./ui (ListItem), ./i18n and the AppPlaces type of lib/appPlaces.mjs.
import { Browser, Hammer, HardDrives, PencilSimple, type Icon } from '@phosphor-icons/react';
import { ListItem } from './ui';
import { t } from './i18n';
import type { AppPlaces as Places } from '../lib/appPlaces.mjs';

const rows: { place: keyof Places; icon: Icon; label: () => string }[] = [
  { place: 'build', icon: Hammer, label: () => t.apps.placeBuild },
  { place: 'editor', icon: PencilSimple, label: () => t.apps.placeEditor },
  { place: 'worker', icon: HardDrives, label: () => t.apps.placeWorker },
  { place: 'pages', icon: Browser, label: () => t.apps.placePages },
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
