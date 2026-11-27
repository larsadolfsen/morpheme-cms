// A row's text in the folding list (Accordion.tsx in this folder, a row with `page`): the text, a link to the row's page
// (`link`: its text, e.g. "Read more about prices", the link's text), and links to more specific pages
// (`more`, e.g. "Depression som ung", as chips). A site's own rows (this site's front
// page, home/Topics.astro).
import type { PageRowView } from '@morphemecms/cms/src/standard/expand/view';
import Chip from '@theme/ui/Chip';

export default function PageRow(row: PageRowView) {
  return (
    <>
      <p className="mo-block-accordion__row-text">{row.text}</p>
      <div className="mo-block-accordion__row-links">
        <a className="mo-link" href={row.href}>
          {row.link}
        </a>
        {row.more?.map((m) => (
          <Chip key={m.href} href={m.href} label={m.label} />
        ))}
      </div>
    </>
  );
}
