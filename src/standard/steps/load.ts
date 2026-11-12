// "Steps" on the site: only its fields (view.ts).
import type { Load } from '../view';
import { stepsOf, type StepsView } from './view';

export const load: Load<StepsView> = async (props) => stepsOf(props);
