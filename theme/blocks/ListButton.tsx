// The text button under the last row of "Segmented list" and "FAQ list" (`button`: its text and, when it has one, its page; a button
// without a page is drawn but goes nowhere). `className`: the spacing of a block in the text.
import Button from '@theme/ui/Button';

export default function ListButton({ button, className }: { button?: { label: string; href?: string }; className?: string }) {
  if (!button) return null;
  return (
    <div className={className ? `mo-block-list__button ${className}` : 'mo-block-list__button'}>
      {button.href ? (
        <a className="mo-link" href={button.href}>
          {button.label}
        </a>
      ) : (
        <Button kind="outlined">{button.label}</Button>
      )}
    </div>
  );
}
