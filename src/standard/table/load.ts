// "Table" on the site: only its fields (view.ts).
import type { Load } from '../view';
import { tableOf, type TableView } from './view';

export const load: Load<TableView> = async (props) => tableOf(props);
