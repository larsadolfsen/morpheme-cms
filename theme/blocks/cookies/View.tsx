// "Cookie list": the cookies as the theme's data table (DataTable, drawn as the "Table" block is: header row, row height, padding), a
// row each with who sets it first and then its name (the row's header), which scrolls sideways on a narrow screen.
import type { CookiesView } from '@morphemecms/cms/src/standard/cookies/view';
import { useInText } from '@morphemecms/cms/src/standard/view';
import DataTable from '@theme/ui/DataTable';

export default function Cookies({ view }: { view: CookiesView }) {
  const { texts } = view;
  return (
    <DataTable
      className={useInText()}
      label={view.label}
      head={[texts.provider, texts.name, texts.purpose, texts.lasts, texts.category]}
      rows={view.cookies.map((c) => [c.provider, <code key="name">{c.name}</code>, c.purpose, c.lasts, texts[c.category]])}
      rowHeader={1}
    />
  );
}
