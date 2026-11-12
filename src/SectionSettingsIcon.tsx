// The icon of the "Section settings" tool: Phosphor's rows, drawn by Svg (icon.tsx).
// Exposes the default SectionSettingsIcon, which takes the size and class the toolbar's buttons give an icon.
import type { Icon } from '@phosphor-icons/react';
import { Svg } from './icon';

const SectionSettingsIcon = (({ size = 20, className }: { size?: number | string; className?: string }) => (
  <Svg name="rows" size={Number(size)} className={className} />
)) as unknown as Icon;

export default SectionSettingsIcon;
