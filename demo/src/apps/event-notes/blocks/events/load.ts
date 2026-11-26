// "Events" on the site: the same view as in the editor (viewOf.ts).
import type { Load } from '@morphemecms/cms/src/standard/view';
import { eventsOf, type EventsView } from './events';

export const load: Load<EventsView> = async (props) => eventsOf(props);
