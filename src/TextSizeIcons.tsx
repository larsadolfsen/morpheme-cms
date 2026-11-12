// The icons of the three body styles: a capital T at three sizes (src/icons/text-t-*.svg), drawn in Phosphor's regular
// stroke (16 on its 256 grid, round ends) with one baseline. Exposes TextSmallIcon, TextMediumIcon and TextLargeIcon, which
// take the size and class the toolbar's buttons give an icon; the raw files are imported by MarkdownEditor.tsx for the
// floating row, so each style has one drawing.
import type { Icon } from '@phosphor-icons/react';
import large from './icons/text-t-large.svg?raw';
import medium from './icons/text-t-medium.svg?raw';
import small from './icons/text-t-small.svg?raw';

const insideOf = (file: string) => file.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const fromFile = (file: string) =>
  (({ size = 20, className }: { size?: number | string; className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: insideOf(file) }}
    />
  )) as unknown as Icon;

export const TextLargeIcon = fromFile(large);
export const TextMediumIcon = fromFile(medium);
export const TextSmallIcon = fromFile(small);
