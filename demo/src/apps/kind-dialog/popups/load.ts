// The kind's data for its part: the promotion's heading, as the app reads it.
import type { Popup } from '@morphemecms/cms/site/popups';

export const load = (popup: Popup) => ({ note: popup.heading });
