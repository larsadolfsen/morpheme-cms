// "Tjekliste" on the site: only its fields (view.ts).
import type { Load } from '../view';
import { checklistOf, type ChecklistView } from './view';

export const load: Load<ChecklistView> = async (props) => checklistOf(props);
