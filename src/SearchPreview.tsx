// How a page looks as a Google result, on a phone or a computer (tabs): the site's name and address, the title and the description.
// Exposes SearchPreview. Depends on googleResult.mjs (the address line, the bold keyword), TabRow and TabPanel in ui.tsx, shortDate (when.ts) and i18n.
import { useId, useState } from 'react';
import { DeviceMobile, Desktop, DotsThreeVertical } from '@phosphor-icons/react';
import { boldParts, searchCrumbs } from './googleResult.mjs';
import { TabPanel, TabRow } from './ui';
import { shortDate } from './when';
import { t } from './i18n';

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
  const menu = <DotsThreeVertical aria-hidden="true" className="shrink-0 text-(--google-text)" />;
  return (
    <div className="space-y-3">
      <TabRow
        id={id}
        label={t.forms.searchPreview.on}
        value={device}
        options={[
          { value: 'mobile', label: t.forms.searchPreview.mobile, icon: DeviceMobile },
          { value: 'desktop', label: t.forms.searchPreview.desktop, icon: Desktop },
        ]}
        onChange={setDevice}
      />
      <TabPanel id={id} value={device}>
        <figure
          aria-label={t.forms.searchPreview.result}
          className={`bg-(--google-background) p-4 font-[arial,sans-serif] ${
            phone ? 'max-w-[360px] border-y-8 border-(--google-separator)' : 'max-w-[600px]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-[28px] shrink-0 items-center justify-center rounded-full border border-(--google-icon-ring) bg-(--google-icon-fill) text-xs text-(--google-icon-letter)"
            >
              {[...siteName][0]?.toLocaleUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-(--google-site)">{siteName}</span>
              <span className="flex items-center gap-1">
                <span className="truncate text-xs text-(--google-text)">{searchCrumbs(domain, path)}</span>
                {!phone && menu}
              </span>
            </span>
            {phone && <span className="ml-auto">{menu}</span>}
          </div>
          <span
            className={`block text-[20px] leading-[26px] ${
              phone ? 'mt-3 line-clamp-2 text-(--google-title-phone)' : 'mt-1.5 truncate text-(--google-title)'
            }`}
          >
            {title}
          </span>
          <p className={`mt-1 text-sm leading-[22px] text-(--google-text) ${phone ? 'line-clamp-3' : 'line-clamp-2'}`}>
            {date && <span className="text-(--google-date)">{shortDate(date)} — </span>}
            {boldParts(description, keyword).map((part, i) =>
              part.bold ? (
                <b key={i} className="font-bold">
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
