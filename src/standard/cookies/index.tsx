// "Cookie list", a standard block: the site's cookies as a table in the cookie policy, each one's name, who sets it,
// what for, how long it lasts and its category. The cookies are in the list the block brings ("Cookies",
// list.ts; cookieList.ts), so the block works without any app. How it looks is the theme's
// (packages/editor/theme/blocks/cookies/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Cookie } from '@phosphor-icons/react';
import { config } from '@site/config';
import { defineBlock } from '../../blocks';
import { t } from '../../i18n';

export default defineBlock({
  group: 'content',
  label: t.blocks.cookies.label,
  icon: Cookie,
  hint: t.blocks.cookies.hint,
  edit: { to: `list/${config.lists.cookies}`, text: t.blocks.cookies.edit },
  fields: [],
  example: {},
});
