import {
  Browser,
  Buildings,
  Certificate,
  ChartLineUp,
  DeviceMobile,
  FileText,
  House,
  FolderSimple,
  List as ListIcon,
  MagnifyingGlass,
  Megaphone,
  ListChecks,
  Newspaper,
  PaintBrushBroad,
  Palette,
  PuzzlePiece,
  Shapes,
  ShieldCheck,
  Signpost,
  Smiley,
  SlidersHorizontal,
  SquareHalfBottom,
  SquaresFour,
  Sticker,
  Storefront,
  Swatches,
  Tag,
  ToggleRight,
  WaveSine,
  Wrench,
  type Icon,
} from '@phosphor-icons/react';
import type { Part, PartScreen } from '@interstellarcms/cms/src/schema';
import { privacy } from './privacy';
import { standardPageFieldsOf } from './collections';

export { config } from './config';
export { collections } from './collections';
export { companyParts } from './company';
export { blockParts } from './blockTexts';
export { countsOf, keptBy, relationsOf, testimonialsOf, usedBy, usesOf, whatIsAt } from './rules';
export { siteOf, type SiteData } from './sitedata';
export { everyFixedPage, fixedPages, Texts, type Props } from '@theme/editor/previews';
export { HEADINGS as headingLooks, LOOKS as sectionLooks } from '@theme/editor/looks.mjs';
export { frontLeads, standardPages, standardPaths, type StandardPage } from './standardPages';
export { colorFields, colorPairs, colorRoles, defaultColors } from './colors';

export const siteName = 'Interstellar CMS';

export const sharing = { name: siteName, description: 'Interstellar CMS Editor', picture: '/images/uploads/2026/10/earth-from-space.webp' };

export const icons: Record<string, Icon> = {
  blog: Newspaper,
  pages: FileText,
  header: Browser,
  menu: ListIcon,
  mobilmenu: DeviceMobile,
  kategorier: Tag,
  popups: Megaphone,
  virksomheden: Buildings,
  blokke: SquaresFour,
  filer: FolderSimple,
  privatliv: ShieldCheck,
  maaling: ChartLineUp,
  promovering: SlidersHorizontal,
  lister: ListChecks,
  footer: SquareHalfBottom,
  seo: MagnifyingGlass,
  videresendelser: Signpost,
  udseende: PaintBrushBroad,
  blokvalg: ToggleRight,
  apps: PuzzlePiece,
  appstore: Storefront,
  avanceret: Wrench,
  licenser: Certificate,
  temaer: Swatches,
  farver: Palette,
  logo: Sticker,
  ikonpakker: Smiley,
  bevaegelse: WaveSine,
  dele: Shapes,
};

export const groups: { title: string; ids: string[] }[] = [
  { title: 'Indhold', ids: ['pages', 'blog', 'kategorier', 'popups', 'filer'] },
  { title: 'På alle sider', ids: ['header', 'footer', 'virksomheden'] },
  { title: 'Blokke', ids: ['blokke', 'lister', 'blokvalg'] },
];

export const settings: string[] = ['udseende', 'apps', 'appstore', 'maaling', 'promovering', 'privatliv', 'seo', 'avanceret', 'licenser'];

export const lists: string[] = [];

export const header = ['menu', 'mobilmenu'];

export const partScreens: PartScreen[] = [
  { id: 'maaling', label: 'Analytics', parts: [], apps: ['analytics'] },
  { id: 'promovering', label: 'Promovering', parts: [], apps: ['booking', 'newsletter'] },
  privacy,
];

export const seoParts: Part[] = [];

export const appearance: Part[] = [
  {
    id: 'standardsider',
    label: 'Standardsider',
    icon: House,
    file: 'src/data/standard-pages.json',
    fields: standardPageFieldsOf('front', 'blog', 'notFound', 'contact'),
    rows: true,
  },
];
