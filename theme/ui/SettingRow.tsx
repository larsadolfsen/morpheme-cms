// A setting's row (.mo-setting-row in ../styles/ui/switch.css): its name (`label`) and a line under it (`supporting`) at the left,
// and at the right whatever sets it (`children`: the switch's track, a dropdown button), all on one line, centred on it.
// Switch.tsx and the editor's MenuRow are both made of it, so the two can never drift. `as`: the element, a <label>
// for a switch (a click anywhere switches it), else a <div>; without a `label` only `children` show; `className` goes on it.
import type { ElementType, ReactNode } from 'react';

export default function SettingRow({
  label,
  supporting,
  as: Tag = 'div',
  className,
  children,
}: {
  label: ReactNode;
  supporting?: ReactNode;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Tag className={['mo-setting-row', className].filter(Boolean).join(' ')}>
      {label != null && (
        <span className="mo-setting-row__text">
          <span className="mo-setting-row__label">{label}</span>
          {supporting && <span className="mo-setting-row__supporting">{supporting}</span>}
        </span>
      )}
      {children}
    </Tag>
  );
}
