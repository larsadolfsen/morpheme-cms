// "Cookieliste": the cookies as a table, a row each with who sets it first and then its name, which scrolls sideways on
// a narrow screen. Built of the standard blocks' part .block-table.
import type { CookiesView } from '@interstellarcms/cms/src/standard/cookies/view';
import { useInText } from '@interstellarcms/cms/src/standard/view';

export default function Cookies({ view }: { view: CookiesView }) {
  const { texts } = view;
  return (
    <div className={useInText('block-table')}>
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
    </div>
  );
}
