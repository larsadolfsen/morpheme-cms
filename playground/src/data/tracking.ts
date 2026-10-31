// Google Analytics 4 and Google Ads tracking configuration.
import data from './tracking.json';

type Ids = { ga4?: string; ads?: string; adsLabels?: Record<string, string> };
const ids = data as Ids;

export const tracking = {
  ga4: ids.ga4 ?? '',
  ads: ids.ads ?? '',
  hosts: ['localhost', '127.0.0.1'],
  adsLabels: ids.adsLabels ?? {},
};
