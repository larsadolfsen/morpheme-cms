// The top of an item's media sheet (docs/superpowers/plans/2026-11-25-0-19-8.md, section 4; B6, B11, B12): the media as it is, with its actions
// under it (Change media, Change icon or Change image, and for an image Crop, Alt text and Remove). Nothing is set yet, or Change media is
// pressed: the kinds of media as a radio list instead. Made of the theme's parts only (Button, RadioGroup).
import type { ReactNode } from 'react';
import { Button } from './ui';
import { SiteRadioButton, SiteRadioGroup } from './themeUi';

export type MediaPanelSpec = {
  /** The media as it is: the icon, the avatar or the image. */
  preview?: ReactNode;
  /** The actions under it, in order. `kind` defaults to outlined. */
  actions?: { label: string; kind?: 'tonal' | 'outlined' | 'text'; action: () => void }[];
  /** The kinds of media as a radio list (shown at once when nothing is set, else after Change media). */
  kinds?: { label: string; name: string; value: string; options: { label: string; value: string }[]; onChange: (value: string) => void };
};

export default function MediaPanel({ spec }: { spec: MediaPanelSpec }) {
  return (
    <div className="mo-editor-media-panel">
      {spec.preview && <div className="mo-editor-media-panel-preview">{spec.preview}</div>}
      {spec.actions && spec.actions.length > 0 && (
        <div className="mo-row mo-editor-media-panel-actions">
          {spec.actions.map((a) => (
            <Button key={a.label} kind={a.kind ?? 'outlined'} onClick={a.action}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
      {spec.kinds && (
        <SiteRadioGroup label={spec.kinds.label}>
          {spec.kinds.options.map((o) => (
            <SiteRadioButton
              key={o.value}
              label={o.label}
              name={spec.kinds!.name}
              value={o.value}
              checked={o.value === spec.kinds!.value}
              onChange={() => spec.kinds!.onChange(o.value)}
              // The kind that is already chosen fires no change, but choosing it still goes on (a new List row has Icon chosen).
              onClick={() => o.value === spec.kinds!.value && spec.kinds!.onChange(o.value)}
            />
          ))}
        </SiteRadioGroup>
      )}
    </div>
  );
}
