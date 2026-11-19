// A row's text in the accordion (Accordion.tsx in this folder, a row with `page`): the text, a link to the row's page
// (`link`: its text, e.g. "Read more about prices", the shared text of "Accordion"), and links to more specific pages
// (`more`, e.g. "Depression som ung", as chips). The standard block "Accordion", and a site's own rows (this site's front
// page, home/Topics.astro).
import type { PageRowView } from '@morphemecms/cms/src/standard/accordion/view';
import Button from '@theme/ui/Button';
import Chip from '@theme/ui/Chip';

export default function PageRow(row: PageRowView) {
  return (
    <>
      <p className="mo-block-accordion__row-text">{row.text}</p>
      <div className="mo-block-accordion__row-links">
        <Button kind="text" href={row.href}>
          {row.link}
        </Button>
        {row.more?.map((m) => (
          <Chip key={m.href} href={m.href} label={m.label} />
        ))}
      </div>
    </>
  );
}
