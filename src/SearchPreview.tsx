// How a page looks as a Google result, on a phone or a computer (tabs): the site's name and address, the title and the description.
// Exposes SearchPreview. Depends on googleResult.mjs (the address line), TabRow and TabPanel in ui.tsx, shortDate (when.ts) and i18n.
import { useId, useState } from 'react';
import { DeviceMobile, Desktop } from '@phosphor-icons/react';
import { searchCrumbs } from './googleResult.mjs';
import { TabPanel, TabRow } from './ui';
import { shortDate } from './when';
import { t } from './i18n';

type Device = 'mobile' | 'desktop';

/** How a page looks in Google's results, drawn as Google draws one, in Google's own colours (--google-* in editor.css,
 * light and dark with the editor): a circle with the site's first letter, the site's name over the address line, the title
 * in blue and the description, with a post's `date` before it. Tabs switch between a phone (opens first: the title cut off
 * after two lines, the description after three, on a card at most 360 px wide) and a computer (one line of title, two of
 * description, at most 600 px wide, Google's results column). `path`: the page's address on the site. */
export function SearchPreview({
  domain,
  path,
  siteName,
  title,
  description,
  date,
}: {
  domain: string;
  path: string;
  siteName: string;
  title: string;
  description: string;
  date?: string;
}) {
  const id = useId();
  const [device, setDevice] = useState<Device>('mobile');
  const phone = device === 'mobile';
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
          className={`space-y-1 border border-line bg-(--google-background) p-4 font-[arial,sans-serif] ${
            phone ? 'max-w-[360px] rounded-3xl' : 'max-w-[600px] rounded-lg'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--google-text)_15%,transparent)] text-xs text-(--google-site)"
            >
              {[...siteName][0]?.toLocaleUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-(--google-site)">{siteName}</span>
              <span className="block truncate text-xs text-(--google-text)">{searchCrumbs(domain, path)}</span>
            </span>
          </div>
          <span className={`block text-(--google-title) ${phone ? 'line-clamp-2 text-lg' : 'truncate text-xl'}`}>{title}</span>
          <p className={`text-sm leading-[22px] text-(--google-text) ${phone ? 'line-clamp-3' : 'line-clamp-2'}`}>
            {date && <span className="text-(--google-date)">{shortDate(date)} — </span>}
            {description}
          </p>
        </figure>
      </TabPanel>
    </div>
  );
}
