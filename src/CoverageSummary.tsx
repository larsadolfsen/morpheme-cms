// The line under the intro of "UI components": how many parts the active theme styles fully.
// Exposes CoverageSummary (nothing for the standard theme); reads themeCoverage (coverage.ts).
import { themeCoverage } from './coverage';
import { t } from './i18n';

/** "<theme> styles N of M parts fully. …"; nothing when the theme is the standard one (no coverage). */
export function CoverageSummary() {
  if (!themeCoverage) return null;
  const parts = Object.values(themeCoverage.parts);
  const own = parts.filter((p) => p.status === 'own').length;
  return <p className="text-sm text-muted">{t.parts.screens.coverage.summary(themeCoverage.theme, own, parts.length)}</p>;
}
