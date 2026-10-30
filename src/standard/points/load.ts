// "Punkter med ikon" on the site: only its fields (view.ts).
import type { Load } from '../view';
import { pointsOf, type PointsView } from './view';

export const load: Load<PointsView> = async (props) => pointsOf(props);
