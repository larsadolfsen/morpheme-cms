// A row's text in the accordion (Accordion.tsx in ../faq/, a row with `page`): the text, a link to the row's page
// (`link`: its text, e.g. "Læs mere om priser", the shared text of "Foldeliste"), and links to more specific pages
// (`more`, e.g. "Depression som ung", as chips). The standard block "Foldeliste", and a site's own rows (this site's front
// page, home/Topics.astro).
import { Svg } from '@morphemecms/cms/src/icon';
import type { PageRowView } from '@morphemecms/cms/src/standard/accordion/view';
import { Link } from '@morphemecms/cms/src/standard/view';
import Chip from '@theme/ui/Chip';

export default function PageRow(row: PageRowView) {
  return (
    <>
      <p className="block-row-text">{row.text}</p>
      <div className="block-row-links">
        <Link href={row.href} className="block-link block-row-link">
          {row.link}
          <Svg name="arrow-right" size={18} />
        </Link>
        {row.more?.map((m) => (
          <Chip key={m.href} href={m.href} label={m.label} />
        ))}
      </div>
    </>
  );
}
