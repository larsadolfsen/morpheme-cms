import { defineSettings } from '@interstellarcms/cms/src/apps';

export default defineSettings({
  fields: [
    {
      name: 'accessKey',
      label: 'Access Key (Client ID)',
      type: 'string',
      required: true,
      hint: 'Hent din Access Key i Unsplash Developer Dashboard (https://unsplash.com/oauth/applications). Secret Key behøves ikke, da den kun er til OAuth og aldrig må deles i frontend-kode.',
    },
    {
      name: 'appName',
      label: 'Applikationsnavn',
      type: 'string',
      hint: 'Navn til obligatorisk UTM-sporing i henhold til Unsplash retningslinjer (f.eks. dit domænenavn).',
    },
  ],
  values: {
    accessKey: '',
    appName: 'interstellar-cms',
  },
  example: {
    accessKey: 'demo-key-123456789',
    appName: 'interstellar-cms',
  },
});
