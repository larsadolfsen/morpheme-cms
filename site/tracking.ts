// Where the site measures from: only these hostnames load the apps' tags (Google Analytics, Google Ads, Google Tag
// Manager, src/apps/) and send events (src/scripts/tracking.ts). Elsewhere (staging) events are only logged to the
// console, unless the address has ?tracking=test, which sends them (in GA4's debug mode). The IDs are the apps'
// settings (src/data/apps/).
import { config } from '@site/config';

export const tracking = {
  hosts: [config.domain, `www.${config.domain}`],
};
