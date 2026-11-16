// "Table": the rows of cells as the theme's data table (DataTable: an outlined card that scrolls sideways on a narrow screen), the first
// row the header (`th` in the column) unless turned off. Built of the standard blocks' parts.
import type { TableView } from '@morphemecms/cms/src/standard/table/view';
import { useInText } from '@morphemecms/cms/src/standard/view';
import DataTable from '@theme/ui/DataTable';

export default function Table({ view }: { view: TableView }) {
  const [first, ...rest] = view.rows;
  return (
    <DataTable
      className={useInText()}
      label={view.label}
      head={view.header ? first : null}
      rows={view.header ? rest : view.rows}
      align={view.align}
      kinds={view.kinds}
      striped={view.striped}
    />
  );
}
