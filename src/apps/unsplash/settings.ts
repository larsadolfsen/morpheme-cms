import { defineSettings } from '@interstellarcms/cms/src/apps';

export default defineSettings({
  fields: [
    {
      name: 'appName',
      label: 'Application name',
      type: 'string',
      hint: 'Name used for mandatory UTM tracking in accordance with Unsplash guidelines (e.g. your website domain).',
    },
  ],
  values: {
    appName: 'interstellar-cms',
  },
  example: {
    appName: 'interstellar-cms',
  },
});
