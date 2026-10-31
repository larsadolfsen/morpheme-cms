import { themeViews, appLooks } from './sites';

const byType = <T>(found: Record<string, T>) =>
  Object.fromEntries(Object.entries(found).map(([file, m]) => [file.split('/').at(-2)!, m]));
const defaults = <T>(found: Record<string, { default: T }>) =>
  Object.fromEntries(Object.entries(byType(found)).map(([type, m]) => [type, m.default]));

export const blockViews: Record<string, any> = {
  ...defaults(themeViews.standard),
  ...defaults(themeViews.own),
  ...defaults(appLooks.views),
};
