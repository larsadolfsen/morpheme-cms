// "Liste" on the site: only its fields (view.ts).
import type { Load } from '../view';
import { listOf, type ListView } from './view';

export const load: Load<ListView> = async (props) => listOf(props);
