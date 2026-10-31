import { defineSettings } from '@interstellarcms/cms/src/apps';

export default defineSettings({
  fields: [
    {
      name: 'accessKey',
      label: 'Access Key (Client ID)',
      type: 'string',
      required: true,
      hint: 'Get your Access Key from your Unsplash Developer Dashboard (https://unsplash.com/oauth/applications). Note: Secret Key is not needed as it is only used for OAuth and must not be exposed in client code.',
    },
    {
      name: 'appName',
      label: 'Application name',
      type: 'string',
      hint: 'Name used for mandatory UTM tracking in accordance with Unsplash guidelines (e.g. your website domain).',
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
