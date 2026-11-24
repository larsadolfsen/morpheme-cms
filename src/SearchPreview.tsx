// How a page looks as a Google result, on a phone or a computer (tabs): the site's name and address, the title and the description.
// Exposes SearchPreview. Depends on googleResult.mjs (the address line, the bold keyword), TabRow and TabPanel in ui.tsx, shortDate (when.ts) and i18n.
import { useId, useState } from 'react';
import { boldParts, searchCrumbs } from './googleResult.mjs';
import { TabPanel, TabRow } from './ui';
import { shortDate } from './when';
import { t } from './i18n';
import { Icon, materialIcon } from './icon';

type Device = 'mobile' | 'desktop';

/** How a page looks in Google's results, drawn as Google draws one, in Google's own colours (--google-* in editor.css,
 * light and dark with the editor): a ringed circle with the site's first letter, the site's name over the address line
 * (https:// first) and a menu icon, the title in blue and the description, with a post's `date` before it and the
 * `keyword` in bold in the description. Tabs switch between a phone (opens first: the title cut off after two lines, the
 * description after three, at most 360 px wide between two 8 px bands, the menu icon at the right edge) and a computer
 * (one line of title, two of description, at most 600 px wide, Google's results column, the menu icon after the
 * address). `path`: the page's address on the site. `keyword`: the page's primary keyword, if it has one. */
export function SearchPreview({
  domain,
  path,
  siteName,
  title,
  description,
  date,
  keyword,
}: {
  domain: string;
  path: string;
  siteName: string;
  title: string;
  description: string;
  date?: string;
  keyword?: string;
}) {
  const id = useId();
  const [device, setDevice] = useState<Device>('mobile');
  const phone = device === 'mobile';
  const menu = <Icon name="more_vert" aria-hidden="true" className="mo-keep mo-editor-search-menu" />;
  return (
    <div className="mo-editor-search-preview">
      <TabRow
        id={id}
        label={t.forms.searchPreview.on}
        value={device}
        options={[
          { value: 'mobile', label: t.forms.searchPreview.mobile, icon: materialIcon('mobile') },
          { value: 'desktop', label: t.forms.searchPreview.desktop, icon: materialIcon('desktop_windows') },
        ]}
        onChange={setDevice}
      />
      <TabPanel id={id} value={device}>
        <figure
          aria-label={t.forms.searchPreview.result}
          className={`mo-editor-search-result ${phone ? 'mo-editor-search-result-phone' : 'mo-editor-search-result-desktop'}`}
        >
          <div className="mo-editor-search-site">
            <span aria-hidden="true" className="mo-keep mo-editor-search-icon">
              {[...siteName][0]?.toLocaleUpperCase()}
            </span>
            <span className="mo-editor-search-site-text">
              <span className="mo-truncate mo-editor-search-site-name">{siteName}</span>
              <span className="mo-editor-search-crumbs-row">
                <span className="mo-truncate mo-editor-search-crumbs">{searchCrumbs(domain, path)}</span>
                {!phone && menu}
              </span>
            </span>
            {phone && <span className="mo-editor-search-menu-end">{menu}</span>}
          </div>
          <span
            className={`mo-editor-search-title ${
              phone ? 'mo-clamp-2 mo-editor-search-title-phone' : 'mo-truncate mo-editor-search-title-desktop'
            }`}
          >
            {title}
          </span>
          <p className={`mo-editor-search-description ${phone ? 'mo-editor-search-clamp-phone' : 'mo-clamp-2'}`}>
            {date && <span className="mo-editor-search-date">{shortDate(date)} — </span>}
            {boldParts(description, keyword).map((part, i) =>
              part.bold ? (
                <b key={i} className="mo-editor-search-keyword">
                  {part.text}
                </b>
              ) : (
                part.text
              ),
            )}
          </p>
        </figure>
      </TabPanel>
    </div>
  );
}
