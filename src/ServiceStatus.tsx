// "System status" (#status), opened from the editor's footer: the services a site needs (GitHub, Cloudflare), a group
// each with its components and their status, and a link to the provider's own status page (/api/status, statusReport.ts).
// Exposes STATUS_ROUTE and the screen. Uses Screen, Group, ListItem and EmptyNote from ui.tsx and the theme's Badge.
import { useEffect, useState } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import Screen from './Screen';
import { EmptyNote, Group, ListItem } from './ui';
import { SiteBadge } from './themeUi';
import { backFrom } from './site';
import { t } from './i18n';
import { serviceStatus } from './statusReport';
import type { StatusReport } from '../lib/serviceStatus.mjs';

export const STATUS_ROUTE = 'status';

export default function ServiceStatus() {
  // undefined while it loads, null when it can't be fetched.
  const [report, setReport] = useState<StatusReport | null>();
  useEffect(() => {
    let on = true;
    serviceStatus({ fresh: true }).then((x) => on && setReport(x));
    return () => {
      on = false;
    };
  }, []);

  return (
    <Screen title={t.footer.status} wide back={backFrom(STATUS_ROUTE)}>
      {report === undefined ? (
        <EmptyNote busy>{t.footer.loading}</EmptyNote>
      ) : report === null ? (
        <EmptyNote>{t.footer.state.unknown}</EmptyNote>
      ) : (
        report.providers.map((provider) => (
          <Group key={provider.id} title={provider.name}>
            {provider.components.map((component) => {
              const status = t.footer.component[component.status];
              return (
                <ListItem
                  key={component.id}
                  headline={component.name}
                  supporting={status}
                  trailing={<SiteBadge tone={component.state} label={status} />}
                />
              );
            })}
            <ListItem
              headline={t.footer.openStatusPage}
              href={provider.page}
              target="_blank"
              rel="noopener noreferrer"
              arrow={ArrowSquareOut}
            />
          </Group>
        ))
      )}
    </Screen>
  );
}
