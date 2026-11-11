// "Segmented list" on the site (view.ts): only its fields, and its own group, by its place in the text, that keeps one row open at a time.
import type { Load } from '../view';
import { segmentedOf, type SegmentedView } from './view';

export const load: Load<SegmentedView> = async (props, { index }) => ({ ...segmentedOf(props), group: `segmented-${index}` });
