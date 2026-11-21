// The arrows that move a list's row up and down: two icon buttons, the first disabled at the top and the last at the
// bottom. Exposes MoveButtons. Uses IconButton of ui.tsx; the move itself is movedList (moveItem.mjs).
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import { t } from './i18n';
import { IconButton } from './ui';

/** `index`: the row's place in the list of `length` rows; `onMove`: moves the row to the place given; `name`: the row's name, which the two
 * buttons say for a screen reader ("Move Contact up"), so ten rows are not ten "Move up". */
export function MoveButtons({
  index,
  length,
  onMove,
  name,
}: {
  index: number;
  length: number;
  onMove: (to: number) => void;
  name?: string;
}) {
  return (
    <>
      <IconButton
        icon={ArrowUp}
        label={name ? t.common.moveUpItem(name) : t.common.moveUp}
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
      />
      <IconButton
        icon={ArrowDown}
        label={name ? t.common.moveDownItem(name) : t.common.moveDown}
        disabled={index === length - 1}
        onClick={() => onMove(index + 1)}
      />
    </>
  );
}
