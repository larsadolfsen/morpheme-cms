// The editor's texts in English (United States), by the part of the editor they are in: the reference the other
// languages translate (Messages); ../index.ts picks one.
import { advanced } from './advanced';
import { app } from './app';
import { apps } from './apps';
import { assistants } from './assistants';
import { blocks } from './blocks';
import { blockSettings } from './blockSettings';
import { check } from './check';
import { cms } from './cms';
import { colors } from './colors';
import { common } from './common';
import { company } from './company';
import { consents } from './consents';
import { dashboard } from './dashboard';
import { ownList } from './ownList';
import { forms } from './forms';
import { footer } from './footer';
import { history } from './history';
import { keywords } from './keywords';
import { licenses } from './licenses';
import { library } from './library';
import { media } from './media';
import { parts } from './parts';
import { preview } from './preview';
import { redirects } from './redirects';
import { seo } from './seo';
import { text } from './text';
import { theme } from './theme';

export const enUS = {
  common,
  app,
  library,
  text,
  blocks,
  forms,
  check,
  media,
  company,
  blockSettings,
  apps,
  colors,
  redirects,
  consents,
  dashboard,
  ownList,
  footer,
  seo,
  keywords,
  licenses,
  assistants,
  cms,
  parts,
  history,
  preview,
  advanced,
  theme,
};

export type Messages = typeof enUS;
