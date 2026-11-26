// What "Events" shows in the editor, from its fields (the same as load.ts makes on the site).
import type { ViewOf } from '@morphemecms/cms/src/standard/view';
import { eventsOf, type EventsView } from './events';

export const viewOf: ViewOf<EventsView> = (props) => eventsOf(props);
