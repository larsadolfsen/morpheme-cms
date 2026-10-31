import { Camera } from '@phosphor-icons/react';
import { defineApp } from '@interstellarcms/cms/src/apps';
import settings from './settings';
import page from './page';

export default defineApp({
  label: 'Unsplash',
  publisher: 'Unsplash / Interstellar',
  license: 'MIT',
  thirdParty: [],
  icon: Camera,
  hint: 'Søg og indsæt millioner af gratis fotos i høj opløsning direkte i editoren.',
  description: `Få adgang til Unsplash direkte i din Interstellar CMS-editor.\n\nSøg i millioner af gratis fotos i høj opløsning, indsæt dem direkte som et dedikeret Unsplash-billede med automatisk fotograf-kreditering eller brug dem overalt i dine tekster og blokke.\n\nAppen overholder alle Unsplash API-retningslinjer med automatisk fotograf-kreditering (inklusive UTM-sporing) og download tracking til fotografernes statistik.`,
  category: 'design',
  version: '1.0.0',
  keywords: ['unsplash', 'fotos', 'billeder', 'stock', 'media', 'photography'],
  settings,
  page,
});
