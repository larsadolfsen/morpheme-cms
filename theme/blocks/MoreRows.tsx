// `Max rows` of the lists: the list (its rows after the first `cut` carry data-extra, put on them by Accordion.tsx and
// list/Rows.tsx) in a wrapper with the text button `Show more` under it. All rows are in the HTML; the button is hidden and all
// rows show until script (list/script.ts on the site, here in the editor's preview) hides the extra ones and shows the
// button. (With a text button under the last row, the two are on one row.) The button is a toggle for aria-expanded and names the list in aria-controls; after it is used it is gone.
import { useEffect, useId, useRef, type ReactNode } from 'react';
import Button from '@theme/ui/Button';
import { cutMoreRows, showMoreRows } from '@theme/blocks/list/more';

export default function MoreRows({
  cut,
  label,
  className,
  after,
  children,
}: {
  cut?: number;
  label: string;
  className?: string;
  /** The text button under the last row (ListButton.tsx): with `Show more` the two are on one row. */
  after?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  // In the editor's preview there is no page script: the same is done here (again when the limit changes).
  useEffect(() => {
    if (cut !== undefined && root.current) cutMoreRows(root.current);
  }, [cut]);
  if (cut === undefined)
    return (
      <>
        {children}
        {after}
      </>
    );
  return (
    <div ref={root} className="mo-block-more" data-max={cut}>
      <div id={id}>{children}</div>
      <div className={className ? `mo-block-buttons__row ${className}` : 'mo-block-buttons__row'}>
        <div
          className={className ? `mo-block-more__button mo-block-list__button ${className}` : 'mo-block-more__button mo-block-list__button'}
        >
          <Button kind="text" aria-controls={id} aria-expanded="false" onClick={() => root.current && showMoreRows(root.current)}>
            {label}
          </Button>
        </div>
        {after}
      </div>
    </div>
  );
}
