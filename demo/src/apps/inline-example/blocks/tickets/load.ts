// "Tickets" on the site: the same view as in the editor (viewOf.ts).
import type { Load } from '@morphemecms/cms/src/standard/view';
import { ticketsOf, type TicketsView } from './tickets';

export const load: Load<TicketsView> = async (props) => ticketsOf(props);
