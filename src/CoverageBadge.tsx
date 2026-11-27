// The mark on a part of "UI components": how much of it the active theme styles itself.
// Exposes CoverageBadge and the PartCoverage type; reads the status texts from t.parts.screens.coverage.
import { themeCoverage } from './coverage';
import { t } from './i18n';

export type PartCoverage = NonNullable<typeof themeCoverage>['parts'][string];

const { coverage } = t.parts.screens;

/** A part's status as text; for a part the theme styles only in part, also the pieces it leaves to Material. */
export function CoverageBadge({ coverage: part }: { coverage: PartCoverage }) {
  return (
    <span className="mo-editor-block mo-editor-caption">
      {coverage.status[part.status]}
      {part.status === 'partly' && part.missing.length > 0 && (
        <>
          {' · '}
          {coverage.missing} <span>{part.missing.join(', ')}</span>
        </>
      )}
    </span>
  );
}
