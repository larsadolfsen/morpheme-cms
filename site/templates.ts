// The page templates the site's theme offers: the theme in use's ("templates" in its theme.json), else the standard theme's.
// Exposes offeredTemplates, read by PageLayout.astro and the check in scripts/check-side.mjs.
import { templatesOf } from '../lib/page-template.mjs';
import theme from '@theme/theme.json';

/** The templates a page can choose, the first the default. */
export const offeredTemplates: string[] = templatesOf(theme as { templates?: unknown });
