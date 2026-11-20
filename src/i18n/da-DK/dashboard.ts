// The widgets on the start screen (DashboardGrid.tsx) and their edit mode (DashboardEdit.tsx), as in Danish (../en-US/dashboard.ts).
import type { Messages } from '../en-US';

export const dashboard: Messages['dashboard'] = {
  loading: 'Henter dashboardet…',
  notLoaded: 'Kunne ikke hente dashboardet.',
  tryAgain: 'Prøv igen',
  edit: 'Rediger dashboard',
  done: 'Færdig',
  addWidget: 'Tilføj widget',
  cmsWidgets: 'Indbygget',
  dragCard: (widget) => `Træk ${widget} for at ændre rækkefølgen`,
  cardMenu: (widget) => `Handlinger for ${widget}`,
  moveUp: 'Flyt op',
  moveDown: 'Flyt ned',
  settings: 'Indstillinger',
  remove: 'Fjern',
  settingsOf: (widget) => `Indstillinger for ${widget}`,
  moved: (position, total) => `Flyttet til plads ${position} af ${total}`,
  notSaved: 'Kunne ikke gemme dashboardet.',
  notSavedNoStorage: 'Dette website kan ikke gemme dashboards endnu.',
  notSavedInvalid: 'Opsætningen er ikke gyldig. Fortryd den sidste ændring, og prøv igen.',
  notSavedTooBig: 'Dashboardet er for stort. Fjern en widget, og prøv igen.',
  notSavedFailed: 'Tjek din forbindelse, og vælg Færdig for at prøve igen.',
};
