// The demo's colours under "Indstillinger › Farver": the standard ones (the package's defaults/colors.ts) with the
// colours the demo was designed with.
import type { Colors } from '@morpheme/cms/lib/colors';
import { dynamicColors } from '@morpheme/cms/lib/dynamic-colors';
import { colorRoles } from '@morpheme/cms/defaults/colors';

export { colorFields, colorPairs, colorRoles } from '@morpheme/cms/defaults/colors';

/** The colours the demo was designed with: Material 3's scheme of a calm slate blue (tonal spot), the same as
 * src/data/colors.json. */
export const defaultColors: Colors = dynamicColors({ source: '#425E92', variant: 'tonalSpot', contrast: 'standard' }, colorRoles);
