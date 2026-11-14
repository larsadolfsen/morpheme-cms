// "Cookie list": the cookies as a table, drawn as the "Table" block is (an outlined Card, .block-table-grid in
// ../blocks.css: header row, row height, padding), a row each with who sets it first and then its name, which scrolls
// sideways on a narrow screen. Built of the standard blocks' part .block-table.
import type { CookiesView } from '@morphemecms/cms/src/standard/cookies/view';
import { useInText } from '@morphemecms/cms/src/standard/view';
import Card from '@theme/ui/Card';

export default function Cookies({ view }: { view: CookiesView }) {
  const { texts } = view;
  return (
    // A scroll box the keyboard can reach, named for a screen reader.
    <Card kind="outlined" className={useInText('block-table', 'block-table-grid')} role="region" aria-label={view.label} tabIndex={0}>
      <table>
        <thead>
          <tr>
            <th scope="col">{texts.provider}</th>
            <th scope="col">{texts.name}</th>
            <th scope="col">{texts.purpose}</th>
            <th scope="col">{texts.lasts}</th>
            <th scope="col">{texts.category}</th>
          </tr>
        </thead>
        <tbody>
          {view.cookies.map((c) => (
            <tr key={`${c.name} ${c.provider}`}>
              <td>{c.provider}</td>
              <th scope="row">
                <code>{c.name}</code>
              </th>
              <td>{c.purpose}</td>
              <td>{c.lasts}</td>
              <td>{texts[c.category]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
