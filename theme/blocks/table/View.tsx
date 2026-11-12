// "Table": the rows of cells in a box that scrolls sideways on a narrow screen (.block-table, .block-table-grid), the first row the header
// (`th` in the column) unless turned off. Built of the standard blocks' parts.
import type { TableView } from '@morphemecms/cms/src/standard/table/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Table({ view }: { view: TableView }) {
  const [first, ...rest] = view.rows;
  const body = view.header ? rest : view.rows;
  return (
    // A scroll box the keyboard can reach, named for a screen reader.
    <div className={useInText('block-table', 'block-table-grid')} role="region" aria-label={view.label} tabIndex={0}>
      <table>
        {view.header && (
          <thead>
            <tr>
              {first.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {body.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
