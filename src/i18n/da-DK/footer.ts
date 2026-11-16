// What the editor's footer and its "Status" screen say (EditorFooter.tsx, ServiceStatus.tsx).
import type { Messages } from '../en-US';

export const footer: Messages['footer'] = {
  support: 'Support',
  status: 'Status',
  terms: 'Vilkår',
  security: 'Sikkerhed',
  privacy: 'Privatliv',
  openStatusPage: 'Åbn statusside',
  loading: 'Tjekker status…',
  state: {
    ok: 'Alle systemer virker',
    minor: 'Nogle systemer er langsomme',
    major: 'Nogle systemer er nede',
    unknown: 'Kan ikke tjekke status',
  },
  component: {
    operational: 'Virker',
    degraded_performance: 'Langsom',
    under_maintenance: 'Vedligeholdes',
    partial_outage: 'Delvist nede',
    major_outage: 'Nede',
    unknown: 'Kan ikke tjekkes',
  },
};
