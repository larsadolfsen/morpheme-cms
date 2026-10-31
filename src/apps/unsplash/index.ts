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
  hint: 'Search and insert millions of high-resolution free photos directly in the editor.',
  description: `Access Unsplash directly in your Interstellar CMS editor.

Search millions of free high-resolution photos, insert them directly as dedicated Unsplash image blocks with automatic photographer attribution, or use them across your pages and blocks.

The app fully complies with Unsplash API guidelines with automatic photographer credit (including UTM attribution) and download tracking for photographer statistics.`,
  category: 'design',
  version: '1.0.0',
  keywords: ['unsplash', 'photos', 'images', 'stock', 'media', 'photography'],
  settings,
  page,
});
