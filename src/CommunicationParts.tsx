// "Parts" › "UI-komponenter" (BlockParts.tsx), the group "Communication": the theme's parts that tell the visitor something
// (packages/editor/theme/ui/, through @site/editor) as the site draws them, with made-up texts: badges (a dot and a number,
// on an icon, an icon button and a navigation drawer's item), the loading indicator with and without its container,
// the progress indicators with a value and without (flat and wavy, and thick), snackbars (one line, two lines, with
// an action, with a longer action, with a close button and with links) and tooltips (plain and rich, shown open). Only
// drawn: what the site does with them in a browser (a tooltip shown on hover, a snackbar at the bottom) is its
// scripts'.
import type { ReactNode } from 'react';
import {
  SiteBadge,
  SiteButton,
  SiteCircularProgressIndicator,
  SiteIconButton,
  SiteLinearProgressIndicator,
  SiteLoadingIndicator,
  SiteNavigationDrawer,
  SiteNavigationDrawerItem,
  SiteNavigationDrawerRow,
  SiteSnackbar,
  SiteTooltip,
} from './themeUi';
import { Svg } from './icon';
import { Part } from './PartsShown';
import { Preview } from './ui';
import { t } from './i18n';

const say = t.parts.screens.communication;

// A made-up example under its name.
const Example = ({ name, children }: { name: string; children: ReactNode }) => (
  <div className="flex flex-col items-start gap-2">
    {children}
    <span className="text-sm text-muted">{name}</span>
  </div>
);

export default function CommunicationParts() {
  return (
    <>
      <Part name="Badge" use={say.badge}>
        <Preview>
          <div className="flex flex-wrap items-end gap-8 p-4">
            <Example name={say.dot}>
              <SiteBadge label={say.new}>
                <Svg name="envelope-simple" size={24} />
              </SiteBadge>
            </Example>
            <Example name={say.number}>
              <SiteBadge count={3} label={say.count(3)}>
                <Svg name="envelope-simple" size={24} />
              </SiteBadge>
            </Example>
            <Example name={say.many}>
              <SiteBadge count={1200} label={say.count(1200)}>
                <Svg name="envelope-simple" size={24} />
              </SiteBadge>
            </Example>
            <Example name={say.onIconButton}>
              <div className="flex gap-2">
                <SiteBadge>
                  <SiteIconButton icon="envelope-simple" label={`${say.messages}, ${say.new}`} />
                </SiteBadge>
                <SiteBadge count={3}>
                  <SiteIconButton icon="envelope-simple" label={`${say.messages}, ${say.count(3)}`} />
                </SiteBadge>
              </div>
            </Example>
          </div>
          <SiteNavigationDrawer>
            <SiteNavigationDrawerRow>
              <SiteNavigationDrawerItem href="">{say.home}</SiteNavigationDrawerItem>
            </SiteNavigationDrawerRow>
            <SiteNavigationDrawerRow>
              <SiteNavigationDrawerItem href="">
                {say.messages}
                <SiteBadge count={3} label={say.count(3)} />
              </SiteNavigationDrawerItem>
            </SiteNavigationDrawerRow>
          </SiteNavigationDrawer>
        </Preview>
      </Part>
      <Part name="LoadingIndicator" use={say.loadingIndicator}>
        <Preview>
          <div className="flex flex-wrap items-end gap-8 p-4">
            <Example name={say.alone}>
              <SiteLoadingIndicator label={say.loading} />
            </Example>
            <Example name={say.contained}>
              <SiteLoadingIndicator label={say.loading} contained />
            </Example>
          </div>
        </Preview>
      </Part>
      <Part name="LinearProgressIndicator" use={say.linearProgressIndicator}>
        <Preview>
          <div className="grid gap-5 p-4">
            {[0, 0.4, 1].map((v) => (
              <Example key={v} name={say.percent(v)}>
                <SiteLinearProgressIndicator value={v} label={say.uploading} />
              </Example>
            ))}
            <Example name={say.indeterminate}>
              <SiteLinearProgressIndicator label={say.uploading} />
            </Example>
            <Example name={say.thick}>
              <SiteLinearProgressIndicator value={0.4} label={say.uploading} thick />
            </Example>
            {[0, 0.4, 1].map((v) => (
              <Example key={v} name={`${say.shapes.wavy}: ${say.percent(v)}`}>
                <SiteLinearProgressIndicator value={v} label={say.uploading} shape="wavy" />
              </Example>
            ))}
            <Example name={`${say.shapes.wavy}: ${say.indeterminate}`}>
              <SiteLinearProgressIndicator label={say.uploading} shape="wavy" />
            </Example>
            <Example name={`${say.shapes.wavy}, ${say.thick.toLowerCase()}: ${say.percent(0.6)}`}>
              <SiteLinearProgressIndicator value={0.6} label={say.uploading} shape="wavy" thick />
            </Example>
            <Example name={`${say.shapes.wavy}, ${say.thick.toLowerCase()}: ${say.indeterminate}`}>
              <SiteLinearProgressIndicator label={say.uploading} shape="wavy" thick />
            </Example>
          </div>
        </Preview>
      </Part>
      <Part name="CircularProgressIndicator" use={say.circularProgressIndicator}>
        <Preview>
          <div className="flex flex-wrap items-end gap-8 p-4">
            {[0, 0.4, 0.85].map((v) => (
              <Example key={v} name={say.percent(v)}>
                <SiteCircularProgressIndicator value={v} label={say.uploading} />
              </Example>
            ))}
            <Example name={say.indeterminate}>
              <SiteCircularProgressIndicator label={say.uploading} />
            </Example>
            <Example name={say.thick}>
              <SiteCircularProgressIndicator value={0.4} label={say.uploading} thick />
            </Example>
            <Example name={`${say.thick}: ${say.indeterminate}`}>
              <SiteCircularProgressIndicator label={say.uploading} thick />
            </Example>
          </div>
          <div className="flex flex-wrap items-end gap-8 p-4" role="group" aria-label={say.shapes.wavy}>
            {[0, 0.4, 0.85].map((v) => (
              <Example key={v} name={`${say.shapes.wavy}: ${say.percent(v)}`}>
                <SiteCircularProgressIndicator value={v} label={say.uploading} shape="wavy" />
              </Example>
            ))}
            <Example name={`${say.shapes.wavy}: ${say.indeterminate}`}>
              <SiteCircularProgressIndicator label={say.uploading} shape="wavy" />
            </Example>
            <Example name={`${say.shapes.wavy}, ${say.thick.toLowerCase()}`}>
              <SiteCircularProgressIndicator value={0.6} label={say.uploading} shape="wavy" thick />
            </Example>
            <Example name={`${say.shapes.wavy}, ${say.thick.toLowerCase()}: ${say.indeterminate}`}>
              <SiteCircularProgressIndicator label={say.uploading} shape="wavy" thick />
            </Example>
          </div>
        </Preview>
      </Part>
      <Part name="Snackbar" use={say.snackbar}>
        <Preview>
          <div className="flex flex-col items-center gap-3 p-4">
            <SiteSnackbar text={say.sent} />
            <SiteSnackbar text={say.booked} />
            <SiteSnackbar text={say.sent} action={{ label: say.undo }} />
            <SiteSnackbar text={say.sent} closeLabel={say.close} />
            <SiteSnackbar text={say.booked} action={{ label: say.undo }} closeLabel={say.close} />
            <SiteSnackbar text={say.booked} action={{ label: say.seeBooking }} longerAction closeLabel={say.close} />
            <SiteSnackbar text={say.preview} links={say.links.map((text) => ({ text, href: '' }))} />
          </div>
        </Preview>
      </Part>
      <Part name="Tooltip" use={say.tooltip}>
        <Preview>
          <div className="grid gap-y-6 p-4">
            <div className="pt-8">
              <SiteTooltip text={say.call} open>
                <SiteIconButton icon="phone" label={say.call} />
              </SiteTooltip>
            </div>
            <div className="pt-24">
              <SiteTooltip subhead={say.cancelHeading} supportingText={say.cancelText} open>
                <SiteIconButton icon="info" label={say.cancelHeading} />
              </SiteTooltip>
            </div>
            <div className="pt-36">
              <SiteTooltip subhead={say.cancelHeading} supportingText={say.cancelText} action={{ label: say.readMore, href: '' }} open>
                <SiteButton kind="outlined" size="small">
                  {say.cancelHeading}
                </SiteButton>
              </SiteTooltip>
            </div>
          </div>
        </Preview>
      </Part>
    </>
  );
}
