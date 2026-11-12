// What "Tickets" shows in the editor, from its fields (the same as load.ts makes on the site): the rows that have a heading.
import type { ViewOf } from '@morphemecms/cms/src/standard/view';
import { ticketsOf, type TicketsView } from './tickets';

export const viewOf: ViewOf<TicketsView> = (props) => ticketsOf(props);
