// The editor's app page routes (#apps/<id>, #apps/<id>/om, #apps/<id>/indstillinger/<field>): which tab is open,
// Settings or Information, and which settings field has its page open. Exposes appRouteOf, INFO_KEY, SETTINGS_KEY.
// No dependencies; App.tsx and AppList.tsx use it.

export const INFO_KEY = 'om';
export const SETTINGS_KEY = 'indstillinger';

export function appRouteOf(route, id) {
  const parts = route.split('/');

  if (parts[0] !== 'apps' || parts[1] !== id) {
    return null;
  }

  if (parts.length === 2) {
    return { tab: 'settings' };
  }

  if (parts.length === 3) {
    if (parts[2] === INFO_KEY) {
      return { tab: 'information' };
    }
    if (parts[2] === SETTINGS_KEY) {
      return { tab: 'settings' };
    }
  }

  if (parts.length === 4) {
    if (parts[2] === SETTINGS_KEY && parts[3] !== '') {
      return { tab: 'settings', page: parts[3] };
    }
  }

  return null;
}
